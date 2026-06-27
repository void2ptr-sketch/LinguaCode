import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { paintCalligraphyPolyline } from '../../../core/data/draw-calligraphy-paint.utils';
import { HanziDataService } from '../../../core/hanzi-engine/hanzi-data.service';
import { UserStore } from '../../../core/state';
import type { HanziCharacterModel } from '../../../core/hanzi-engine/hanzi-character.model';
import type { HanziLoadState, HanziPoint } from '../../../core/hanzi-engine/hanzi-character.types';
import { HanziPositioner } from '../../../core/hanzi-engine/hanzi-positioner';
import {
  resolveRadicalComponentCellCenter,
  resolveRadicalComponentSvgTransform,
} from '../../../core/hanzi-engine/hanzi-radical-layout.utils';
import {
  applyHanziCanvasPathTransform,
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
} from '../../../core/hanzi-engine/hanzi-render.utils';
import {
  prepareHanziTracingSamples,
  resolveHanziTracingFrame,
  sliceHanziPolylineByProgress,
  tracingRevealProgress,
  type HanziTracingFrame,
  type HanziTracingStrokeSample,
} from '../../../core/hanzi-engine/hanzi-tracing-animation.utils';
import type { DrawCanvasMode } from '../../../core/models/draw-practice.types';
import type { DrawCanvasPoint, DrawMemoryStrokeGrade, DrawStrokePath } from './draw-canvas.types';

export type DrawRadicalHint = {
  readonly character: string;
  readonly color: string;
};

const DEFAULT_SURFACE_SIZE = 280;
const GHOST_FONT_RATIO = 0.72;

const EMPTY_TRACING_FRAME: HanziTracingFrame = {
  completedStrokeCount: 0,
  activeStrokeIndex: 0,
  activeProgress: 0,
  isLoopPause: false,
  tip: null,
};

@Component({
  selector: 'app-draw-canvas',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './draw-canvas.component.html',
  styleUrl: './draw-canvas.component.scss',
})
export class DrawCanvasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hanziData = inject(HanziDataService);
  private readonly userStore = inject(UserStore);

  readonly ghostCharacter = input<string | null>(null);
  readonly radicalHints = input<readonly DrawRadicalHint[]>([]);
  readonly radicalAriaLabel = input<string | null>(null);
  readonly canvasMode = input<DrawCanvasMode>('memory');
  readonly disabled = input(false);
  readonly showMemoryReview = input(false);
  readonly memoryStrokeGrades = input<readonly DrawMemoryStrokeGrade[]>([]);
  readonly showClearAll = input(false);
  readonly clearAllDisabled = input(true);

  readonly strokesChange = output<boolean>();
  readonly clearAllRequested = output<void>();

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly hasStrokes = signal(false);
  readonly canUndo = signal(false);
  readonly surfaceWidth = signal(DEFAULT_SURFACE_SIZE);
  readonly surfaceHeight = signal(DEFAULT_SURFACE_SIZE);
  readonly hanziModel = signal<HanziCharacterModel | null>(null);
  readonly hanziLoadState = signal<HanziLoadState>('idle');
  readonly radicalModels = signal<ReadonlyMap<string, HanziCharacterModel>>(new Map());
  readonly radicalLoadState = signal<HanziLoadState>('idle');
  readonly tracingFrame = signal<HanziTracingFrame>(EMPTY_TRACING_FRAME);

  readonly hanziStrokes = computed(() => this.hanziModel()?.strokes ?? []);

  readonly svgViewBox = computed(() => `0 0 ${this.surfaceWidth()} ${this.surfaceHeight()}`);

  readonly hanziPositioner = computed(
    () =>
      new HanziPositioner({
        width: this.surfaceWidth(),
        height: this.surfaceHeight(),
        padding: 20,
      }),
  );

  readonly hanziSvgTransform = computed(() =>
    resolveHanziSvgGroupTransform(this.hanziPositioner()),
  );

  readonly hanziDataRequired = computed(() => {
    const mode = this.canvasMode();
    return mode !== 'memory' && mode !== 'radicals' && Boolean(this.ghostCharacter()?.trim());
  });

  readonly showHanziGhost = computed(
    () =>
      (this.hanziDataRequired() || this.showMemoryReviewGhost()) &&
      this.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0 &&
      this.ghostOpacity() > 0,
  );

  readonly showMemoryReviewGhost = computed(
    () => this.showMemoryReview() && this.canvasMode() === 'memory',
  );

  readonly showHanziGuides = computed(() => {
    const mode = this.canvasMode();
    return (
      (mode === 'stroke-order' || mode === 'hints') &&
      this.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0
    );
  });

  readonly showTracingAnimation = computed(
    () =>
      this.canvasMode() === 'tracing' &&
      this.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0,
  );

  readonly tracingStrokeDurationMs = computed(() =>
    Math.round(this.userStore.cjkLearning().tracingStrokeDurationSec * 1000),
  );

  readonly radicalDataRequired = computed(
    () => this.canvasMode() === 'radicals' && this.radicalHints().length > 0,
  );

  readonly showRadicalLayer = computed(
    () =>
      this.radicalDataRequired() &&
      this.radicalLoadState() === 'ready' &&
      this.radicalHints().some((hint) => this.hasRadicalStrokeModel(hint.character)),
  );

  readonly ghostOpacity = computed(() => {
    if (this.showMemoryReviewGhost()) {
      return 0.38;
    }

    switch (this.canvasMode()) {
      case 'tracing':
        return 0.38;
      case 'hints':
        return 0.14;
      case 'stroke-order':
        return 0.1;
      default:
        return 0;
    }
  });

  private strokes: DrawStrokePath[] = [];
  private activeStroke: DrawCanvasPoint[] = [];
  private drawing = false;
  private context: CanvasRenderingContext2D | null = null;
  private tracingSamples: readonly HanziTracingStrokeSample[] = [];
  private tracingAnimationStart = 0;
  private tracingAnimationFrameId = 0;
  private tracingAnimationActive = false;
  private tracingLoopToken = 0;

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
      this.observeCanvasResize();
      this.syncTracingAnimation();
    });

    effect(() => {
      const character = this.ghostCharacter()?.trim() ?? '';
      this.canvasMode();
      this.syncHanziCharacter(character);
    });

    effect(() => {
      const mode = this.canvasMode();
      const hints = this.radicalHints();

      if (mode !== 'radicals') {
        this.radicalModels.set(new Map());
        this.radicalLoadState.set('idle');
        return;
      }

      const characters = hints.map((hint) => hint.character.trim()).filter(Boolean);
      void this.syncRadicalCharacters(characters);
    });

    effect(() => {
      this.hanziModel();
      this.hanziLoadState();
      this.canvasMode();
      this.tracingStrokeDurationMs();
      this.syncTracingAnimation();
    });

    effect(() => {
      const reviewActive = this.showMemoryReview();
      const grades = this.memoryStrokeGrades();
      if (!reviewActive && grades.length === 0) {
        return;
      }

      untracked(() => this.redrawAll());
    });

    this.destroyRef.onDestroy(() => {
      this.stopTracingAnimation();
    });
  }

  medianPath(points: readonly HanziPoint[]): string {
    return medianToSvgPath(points);
  }

  medianLabelCanvas(points: readonly HanziPoint[]): HanziPoint {
    return this.hanziPositioner().toCanvas(medianLabelPoint(points));
  }

  radicalModelFor(character: string): HanziCharacterModel | null {
    return this.radicalModels().get(character.trim()) ?? null;
  }

  radicalComponentTransform(componentIndex: number, componentCount: number): string {
    return resolveRadicalComponentSvgTransform(componentIndex, componentCount, {
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
    });
  }

  getStrokes(): readonly DrawStrokePath[] {
    return this.strokes;
  }

  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
    };
  }

  setStrokes(strokes: readonly DrawStrokePath[]): void {
    this.strokes = strokes.map((stroke) => [...stroke]);
    this.activeStroke = [];
    this.syncStrokeState(false);
    this.redrawAll();
  }

  undoLastStroke(): void {
    if (this.strokes.length === 0) {
      return;
    }

    this.strokes.pop();
    this.syncStrokeState(true);
    this.redrawAll();
  }

  clearStrokes(): void {
    this.strokes = [];
    this.activeStroke = [];
    this.syncStrokeState(true);
    this.redrawAll();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled()) {
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    this.drawing = true;
    this.activeStroke = [this.eventPoint(event, canvas)];
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing || this.disabled()) {
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || this.activeStroke.length === 0) {
      return;
    }

    this.activeStroke.push(this.eventPoint(event, canvas));
    this.redrawAll();
  }

  onPointerUp(event: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (!this.drawing) {
      return;
    }

    this.drawing = false;

    if (this.activeStroke.length > 0) {
      this.strokes.push([...this.activeStroke]);
      this.activeStroke = [];
      this.syncStrokeState(true);
    }
  }

  private async syncRadicalCharacters(characters: readonly string[]): Promise<void> {
    if (characters.length === 0) {
      this.radicalModels.set(new Map());
      this.radicalLoadState.set('idle');
      this.redrawAll();
      return;
    }

    const requestKey = characters.join('\u0000');
    const allCached = characters.every(
      (character) =>
        this.hanziData.hasCachedData(character) ||
        this.hanziData.getLoadState(character) === 'missing' ||
        this.hanziData.getLoadState(character) === 'error',
    );

    if (!allCached) {
      this.radicalLoadState.set('loading');
    }

    const models = await this.hanziData.loadCharacters(characters);
    const currentKey = this.radicalHints()
      .map((hint) => hint.character.trim())
      .filter(Boolean)
      .join('\u0000');

    if (currentKey !== requestKey || this.canvasMode() !== 'radicals') {
      return;
    }

    this.radicalModels.set(models);
    this.radicalLoadState.set(models.size > 0 ? 'ready' : 'missing');
    this.redrawAll();
  }

  private async syncHanziCharacter(character: string): Promise<void> {
    if (!character) {
      this.hanziModel.set(null);
      this.hanziLoadState.set('idle');
      this.redrawAll();
      return;
    }

    const cached = this.hanziData.getCachedModel(character);
    if (cached) {
      this.hanziModel.set(cached);
      this.hanziLoadState.set('ready');
      this.redrawAll();
      return;
    }

    const state = this.hanziData.getLoadState(character);
    if (state === 'missing') {
      this.hanziModel.set(null);
      this.hanziLoadState.set('missing');
      this.redrawAll();
      return;
    }

    this.hanziLoadState.set('loading');
    const model = await this.hanziData.loadCharacter(character);
    if (this.ghostCharacter()?.trim() !== character) {
      return;
    }

    this.hanziModel.set(model);
    this.hanziLoadState.set(model ? 'ready' : this.hanziData.getLoadState(character));
    this.redrawAll();
  }

  private redrawAll(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const context = this.ensureContext();
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.paintRadicalHints(context, canvas.width, canvas.height);
    this.paintTracingAnimation(context);
    this.paintStrokes(context);
  }

  private paintStrokes(context: CanvasRenderingContext2D): void {
    const reviewActive = this.showMemoryReview() && this.canvasMode() === 'memory';

    for (let index = 0; index < this.strokes.length; index += 1) {
      const stroke = this.strokes[index];
      if (!stroke) {
        continue;
      }

      this.paintStroke(context, stroke, reviewActive ? this.memoryStrokeGradeAt(index) : null);
    }

    if (this.activeStroke.length > 0) {
      this.paintStroke(context, this.activeStroke, null);
    }
  }

  private memoryStrokeGradeAt(index: number): DrawMemoryStrokeGrade | null {
    return this.memoryStrokeGrades()[index] ?? 'incorrect';
  }

  private paintStroke(
    context: CanvasRenderingContext2D,
    stroke: DrawStrokePath,
    memoryGrade: DrawMemoryStrokeGrade | null,
  ): void {
    if (stroke.length === 0) {
      return;
    }

    const baseWidth = Math.max(3.5, this.surfaceWidth() * 0.022);
    paintCalligraphyPolyline(context, stroke, {
      baseWidth,
      color: this.resolveStrokeColor(memoryGrade),
      taper: true,
    });
  }

  private resolveStrokeColor(memoryGrade: DrawMemoryStrokeGrade | null): string {
    if (memoryGrade === 'correct') {
      return this.resolveThemeColor('--mat-sys-tertiary', '#386a20');
    }

    if (memoryGrade === 'incorrect') {
      return this.resolveThemeColor('--mat-sys-error', '#b3261e');
    }

    return '#1a1a1a';
  }

  private resolveThemeColor(variable: string, fallback: string): string {
    const canvas = this.canvasRef()?.nativeElement;
    const fromCanvas = canvas ? getComputedStyle(canvas).getPropertyValue(variable).trim() : '';
    if (fromCanvas) {
      return fromCanvas;
    }

    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }

    const width = canvas.clientWidth || DEFAULT_SURFACE_SIZE;
    const height = canvas.clientHeight || DEFAULT_SURFACE_SIZE;
    canvas.width = width;
    canvas.height = height;
    this.surfaceWidth.set(width);
    this.surfaceHeight.set(height);

    this.context = null;
    this.ensureContext();
    this.redrawAll();
  }

  private ensureContext(): CanvasRenderingContext2D | null {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return null;
    }

    if (!this.context) {
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 4;
      context.strokeStyle = '#1a1a1a';
      context.fillStyle = '#1a1a1a';
      this.context = context;
    }

    return this.context;
  }

  private ghostFontSize(width: number): number {
    return Math.floor(width * GHOST_FONT_RATIO);
  }

  private ghostFontFamily(): string {
    return '"Noto Sans SC", "Noto Sans TC", sans-serif';
  }

  private hasRadicalStrokeModel(character: string): boolean {
    const model = this.radicalModels().get(character.trim());
    return Boolean(model && model.strokes.length > 0);
  }

  private paintRadicalHints(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    if (this.canvasMode() !== 'radicals' || this.radicalLoadState() !== 'ready') {
      return;
    }

    const hints = this.radicalHints();
    if (hints.every((hint) => this.hasRadicalStrokeModel(hint.character))) {
      return;
    }

    const cellCount = hints.length;
    const cellWidth = width / Math.max(cellCount, 1);
    const fontSize = Math.min(this.ghostFontSize(cellWidth), this.ghostFontSize(width));
    context.save();
    context.font = `${fontSize}px ${this.ghostFontFamily()}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.globalAlpha = 0.38;

    for (let index = 0; index < hints.length; index += 1) {
      const hint = hints[index];
      if (this.hasRadicalStrokeModel(hint.character)) {
        continue;
      }

      const center = resolveRadicalComponentCellCenter(index, cellCount, { width, height });
      context.fillStyle = hint.color;
      context.fillText(hint.character, center.x, center.y);
    }

    context.restore();
  }

  private eventPoint(event: PointerEvent, canvas: HTMLCanvasElement): DrawCanvasPoint {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(canvas.clientWidth, 1);
    const scaleY = canvas.height / Math.max(canvas.clientHeight, 1);

    return {
      x: (event.clientX - rect.left - canvas.clientLeft) * scaleX,
      y: (event.clientY - rect.top - canvas.clientTop) * scaleY,
    };
  }

  private observeCanvasResize(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    observer.observe(canvas);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private syncStrokeState(emitChange: boolean): void {
    const hasStrokes = this.strokes.length > 0;
    this.hasStrokes.set(hasStrokes);
    this.canUndo.set(hasStrokes);

    if (emitChange) {
      this.strokesChange.emit(hasStrokes);
    }
  }

  private syncTracingAnimation(): void {
    this.stopTracingAnimation(false);

    if (
      this.canvasMode() !== 'tracing' ||
      this.hanziLoadState() !== 'ready' ||
      !this.hanziModel()
    ) {
      this.redrawAll();
      return;
    }

    const model = this.hanziModel();
    if (!model) {
      return;
    }

    this.tracingSamples = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points));
    this.tracingAnimationStart = performance.now();
    this.tracingFrame.set(EMPTY_TRACING_FRAME);
    this.tracingAnimationActive = true;
    this.tracingLoopToken += 1;
    const token = this.tracingLoopToken;
    this.tracingAnimationFrameId = requestAnimationFrame(() => this.runTracingAnimation(token));
  }

  private stopTracingAnimation(redraw = true): void {
    this.tracingAnimationActive = false;
    this.tracingLoopToken += 1;

    if (this.tracingAnimationFrameId) {
      cancelAnimationFrame(this.tracingAnimationFrameId);
      this.tracingAnimationFrameId = 0;
    }

    this.tracingFrame.set(EMPTY_TRACING_FRAME);

    if (redraw) {
      this.redrawAll();
    }
  }

  private runTracingAnimation(token: number): void {
    if (!this.tracingAnimationActive || token !== this.tracingLoopToken) {
      return;
    }

    const elapsedMs = performance.now() - this.tracingAnimationStart;
    this.tracingFrame.set(
      resolveHanziTracingFrame(elapsedMs, this.tracingSamples, {
        strokeDurationMs: this.tracingStrokeDurationMs(),
      }),
    );
    this.redrawAll();
    this.tracingAnimationFrameId = requestAnimationFrame(() => this.runTracingAnimation(token));
  }

  private paintTracingAnimation(context: CanvasRenderingContext2D): void {
    if (!this.tracingAnimationActive || this.tracingSamples.length === 0) {
      return;
    }

    const frame = this.tracingFrame();
    const model = this.hanziModel();
    const positioner = this.hanziPositioner();
    const strokeColor = this.resolvePrimaryColor();
    const lineWidth = Math.max(8, positioner.scale * 0.34);

    for (let strokeNum = 0; strokeNum < this.tracingSamples.length; strokeNum += 1) {
      const sample = this.tracingSamples[strokeNum];
      const strokePath = model?.strokes[strokeNum]?.path;
      if (!sample) {
        continue;
      }

      const progress = frame.isLoopPause ? 1 : tracingRevealProgress(frame, strokeNum);
      const isFullyRevealed = strokeNum < frame.completedStrokeCount || progress >= 1;

      if (isFullyRevealed) {
        if (strokePath) {
          this.paintTracingStrokeFill(context, strokePath, positioner, strokeColor);
        } else {
          this.paintTracingPolyline(
            context,
            sample.densified,
            positioner,
            strokeColor,
            lineWidth,
            1,
          );
        }
        continue;
      }

      if (progress <= 0) {
        continue;
      }

      const points = sliceHanziPolylineByProgress(sample.densified, progress);
      this.paintTracingPolyline(context, points, positioner, strokeColor, lineWidth, 1);
    }

    if (!frame.tip || frame.isLoopPause) {
      return;
    }

    const activeSample = this.tracingSamples[frame.activeStrokeIndex];
    const progress = tracingRevealProgress(frame, frame.activeStrokeIndex);
    if (progress >= 1) {
      return;
    }

    const lookbackPoints = activeSample
      ? sliceHanziPolylineByProgress(activeSample.densified, Math.max(0, progress - 0.04))
      : [];
    const canvasTip = positioner.toCanvas(frame.tip.point);
    const canvasTail = positioner.toCanvas(lookbackPoints.at(-1) ?? frame.tip.point);
    const angleRad = Math.atan2(canvasTip.y - canvasTail.y, canvasTip.x - canvasTail.x);
    const brushRadius = Math.max(3.5, positioner.scale * 0.22);

    context.save();
    context.globalAlpha = 1;
    context.fillStyle = strokeColor;
    context.translate(canvasTip.x, canvasTip.y);
    context.rotate(angleRad);
    context.beginPath();
    context.ellipse(0, 0, brushRadius * 1.15, brushRadius * 0.72, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private paintTracingStrokeFill(
    context: CanvasRenderingContext2D,
    pathD: string,
    positioner: HanziPositioner,
    color: string,
  ): void {
    context.save();
    context.globalAlpha = 1;
    context.fillStyle = color;
    applyHanziCanvasPathTransform(context, positioner);
    context.fill(new Path2D(pathD));
    context.restore();
  }

  private paintTracingPolyline(
    context: CanvasRenderingContext2D,
    points: readonly HanziPoint[],
    positioner: HanziPositioner,
    color: string,
    width: number,
    alpha: number,
  ): void {
    if (points.length < 2) {
      return;
    }

    const canvasPoints = points.map((point) => positioner.toCanvas(point));
    context.save();
    context.strokeStyle = color;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = width;
    context.globalAlpha = alpha;
    context.beginPath();
    context.moveTo(canvasPoints[0]!.x, canvasPoints[0]!.y);
    for (let index = 1; index < canvasPoints.length; index += 1) {
      context.lineTo(canvasPoints[index]!.x, canvasPoints[index]!.y);
    }
    context.stroke();
    context.restore();
  }

  private resolvePrimaryColor(): string {
    return this.resolveThemeColor('--mat-sys-primary', '#6750a4');
  }
}

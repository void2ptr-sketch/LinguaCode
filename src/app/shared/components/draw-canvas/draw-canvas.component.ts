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
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { paintCalligraphyPolyline } from '../../../core/data/draw-calligraphy-paint.utils';
import {
  resolveStrokeAnimationFrame,
  slicePolylineAtProgress,
} from '../../../core/data/draw-stroke-path.utils';
import { HanziDataService } from '../../../core/hanzi-engine/hanzi-data.service';
import type { HanziCharacterModel } from '../../../core/hanzi-engine/hanzi-character.model';
import type { HanziLoadState, HanziPoint } from '../../../core/hanzi-engine/hanzi-character.types';
import { HanziPositioner, mapPointsToCanvas } from '../../../core/hanzi-engine/hanzi-positioner';
import {
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
} from '../../../core/hanzi-engine/hanzi-render.utils';
import type { DrawCanvasMode } from '../../../core/models/draw-practice.types';
import type { DrawCanvasPoint, DrawStrokePath } from './draw-canvas.types';

export type DrawRadicalHint = {
  readonly character: string;
  readonly color: string;
};

const DEFAULT_SURFACE_SIZE = 280;
const GHOST_FONT_RATIO = 0.72;

@Component({
  selector: 'app-draw-canvas',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './draw-canvas.component.html',
  styleUrl: './draw-canvas.component.scss',
})
export class DrawCanvasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hanziData = inject(HanziDataService);

  readonly ghostCharacter = input<string | null>(null);
  readonly radicalHints = input<readonly DrawRadicalHint[]>([]);
  readonly radicalAriaLabel = input<string | null>(null);
  readonly canvasMode = input<DrawCanvasMode>('memory');
  readonly disabled = input(false);
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

  readonly hanziStrokes = computed(() => this.hanziModel()?.strokes ?? []);

  readonly svgViewBox = computed(
    () => `0 0 ${this.surfaceWidth()} ${this.surfaceHeight()}`,
  );

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
      this.hanziDataRequired() &&
      this.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0 &&
      this.ghostOpacity() > 0,
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

  readonly ghostOpacity = computed(() => {
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
  private tracingMedianSamples: HanziPoint[][] = [];
  private tracingAnimationStart = 0;
  private tracingAnimationFrameId = 0;

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
      this.observeCanvasResize();
    });

    effect(() => {
      const character = this.ghostCharacter()?.trim() ?? '';
      this.radicalHints();
      this.canvasMode();
      this.syncHanziCharacter(character);
    });

    effect(() => {
      this.hanziModel();
      this.canvasMode();
      this.syncTracingAnimation();
      this.redrawAll();
    });

    this.destroyRef.onDestroy(() => {
      this.stopTracingAnimation();
    });
  }

  medianPath(points: readonly HanziPoint[]): string {
    return medianToSvgPath(points);
  }

  medianLabel(points: readonly HanziPoint[]): HanziPoint {
    return medianLabelPoint(points);
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
    const context = this.context ?? canvas?.getContext('2d') ?? null;
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.paintRadicalHints(context, canvas.width, canvas.height);
    this.paintTracingAnimation(context);
    this.paintStrokes(context);
  }

  private paintStrokes(context: CanvasRenderingContext2D): void {
    for (const stroke of this.strokes) {
      this.paintStroke(context, stroke);
    }

    if (this.activeStroke.length > 0) {
      this.paintStroke(context, this.activeStroke);
    }
  }

  private paintStroke(context: CanvasRenderingContext2D, stroke: DrawStrokePath): void {
    if (stroke.length === 0) {
      return;
    }

    const baseWidth = Math.max(3.5, this.surfaceWidth() * 0.022);
    paintCalligraphyPolyline(context, stroke, {
      baseWidth,
      color: '#1a1a1a',
      taper: true,
    });
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

  private fittedRadicalLayout(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    characters: readonly string[],
  ): { fontSize: number; advances: readonly number[]; gap: number } {
    const maxWidth = width * 0.9;
    const maxHeight = height * 0.85;
    let fontSize = this.ghostFontSize(width);
    const fontFamily = this.ghostFontFamily();

    for (let attempt = 0; attempt < 12; attempt += 1) {
      context.font = `${fontSize}px ${fontFamily}`;
      const advances = characters.map((character) => context.measureText(character).width);
      const gap = Math.max(2, Math.round(fontSize * 0.06));
      const totalWidth =
        advances.reduce((sum, advance) => sum + advance, 0) +
        gap * Math.max(characters.length - 1, 0);
      const textHeight = fontSize * 1.05;

      if (totalWidth <= maxWidth && textHeight <= maxHeight) {
        return { fontSize, advances, gap };
      }

      const widthScale = maxWidth / Math.max(totalWidth, 1);
      const heightScale = maxHeight / Math.max(textHeight, 1);
      const nextSize = Math.floor(fontSize * Math.min(widthScale, heightScale) * 0.98);
      if (nextSize >= fontSize || nextSize < 12) {
        return { fontSize: Math.max(nextSize, 12), advances, gap };
      }

      fontSize = nextSize;
    }

    context.font = `${fontSize}px ${fontFamily}`;
    const advances = characters.map((character) => context.measureText(character).width);
    return {
      fontSize,
      advances,
      gap: Math.max(2, Math.round(fontSize * 0.06)),
    };
  }

  private paintRadicalHints(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.canvasMode() !== 'radicals') {
      return;
    }

    const hints = this.radicalHints();
    if (hints.length === 0) {
      return;
    }

    const characters = hints.map((hint) => hint.character);
    context.save();
    const layout = this.fittedRadicalLayout(context, width, height, characters);
    context.font = `${layout.fontSize}px ${this.ghostFontFamily()}`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';

    const totalWidth =
      layout.advances.reduce((sum, advance) => sum + advance, 0) +
      layout.gap * Math.max(hints.length - 1, 0);
    let x = (width - totalWidth) / 2;
    const y = height / 2;

    for (let index = 0; index < hints.length; index += 1) {
      const hint = hints[index];
      context.globalAlpha = 0.38;
      context.fillStyle = hint.color;
      context.fillText(hint.character, x, y);
      x += (layout.advances[index] ?? 0) + (index < hints.length - 1 ? layout.gap : 0);
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
    this.stopTracingAnimation();

    if (!this.showTracingAnimation()) {
      return;
    }

    const model = this.hanziModel();
    if (!model) {
      return;
    }

    this.tracingMedianSamples = model.strokes.map((stroke) => [...stroke.points]);
    this.tracingAnimationStart = performance.now();
    this.tracingAnimationFrameId = requestAnimationFrame(() => this.runTracingAnimation());
  }

  private stopTracingAnimation(): void {
    if (this.tracingAnimationFrameId) {
      cancelAnimationFrame(this.tracingAnimationFrameId);
      this.tracingAnimationFrameId = 0;
    }
  }

  private runTracingAnimation(): void {
    if (!this.showTracingAnimation()) {
      return;
    }

    this.redrawAll();
    this.tracingAnimationFrameId = requestAnimationFrame(() => this.runTracingAnimation());
  }

  private paintTracingAnimation(context: CanvasRenderingContext2D): void {
    if (!this.showTracingAnimation() || this.tracingMedianSamples.length === 0) {
      return;
    }

    const positioner = this.hanziPositioner();
    const elapsedMs = performance.now() - this.tracingAnimationStart;
    const frame = resolveStrokeAnimationFrame(
      elapsedMs,
      this.tracingMedianSamples.length,
      this.tracingMedianSamples,
    );
    const lineWidth = Math.max(2.5, positioner.scale * 0.42);
    const brushRadius = Math.max(3, positioner.scale * 0.2);
    const strokeColor = this.resolvePrimaryColor();

    for (let index = 0; index < frame.completedStrokeCount; index += 1) {
      this.paintTracingPolyline(
        context,
        this.tracingMedianSamples[index] ?? [],
        positioner,
        lineWidth * 0.85,
        0.28,
        strokeColor,
      );
    }

    const activeSamples = this.tracingMedianSamples[frame.activeStrokeIndex] ?? [];
    const activePolyline = slicePolylineAtProgress(activeSamples, frame.activeProgress);
    if (activePolyline.length > 0) {
      this.paintTracingPolyline(context, activePolyline, positioner, lineWidth, 0.92, strokeColor);
    }

    if (frame.tip) {
      const tip = positioner.toCanvas(frame.tip);
      context.save();
      context.globalAlpha = 1;
      context.fillStyle = strokeColor;
      context.beginPath();
      context.arc(tip.x, tip.y, brushRadius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  }

  private paintTracingPolyline(
    context: CanvasRenderingContext2D,
    points: readonly HanziPoint[],
    positioner: HanziPositioner,
    lineWidth: number,
    alpha: number,
    strokeColor: string,
  ): void {
    if (points.length === 0) {
      return;
    }

    const canvasPoints = mapPointsToCanvas(points, positioner);
    paintCalligraphyPolyline(context, canvasPoints, {
      baseWidth: lineWidth,
      color: strokeColor,
      alpha,
      taper: true,
    });
  }

  private resolvePrimaryColor(): string {
    const canvas = this.canvasRef()?.nativeElement;
    const fromCanvas = canvas
      ? getComputedStyle(canvas).getPropertyValue('--mat-sys-primary').trim()
      : '';
    if (fromCanvas) {
      return fromCanvas;
    }

    return (
      getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary').trim() ||
      '#6750a4'
    );
  }
}

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

import {
  mapViewBoxPoint,
  resolveGhostFontSize,
  resolveGhostGuideTransform,
  resolveGhostInkTransform,
  resolveSvgGuideGroupTransform,
  type GhostGuideTransform,
} from '../../../core/data/draw-ghost-layout.utils';
import { paintCalligraphyPolyline } from '../../../core/data/draw-calligraphy-paint.utils';
import {
  resolveStrokeAnimationFrame,
  sampleGuidePath,
  slicePolylineAtProgress,
  type ViewBoxPoint,
} from '../../../core/data/draw-stroke-path.utils';
import type { DrawCanvasMode, DrawStrokeGuide } from '../../../core/models/draw-practice.types';
import type { DrawCanvasPoint, DrawStrokePath } from './draw-canvas.types';

export type DrawRadicalHint = {
  readonly character: string;
  readonly color: string;
};

@Component({
  selector: 'app-draw-canvas',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './draw-canvas.component.html',
  styleUrl: './draw-canvas.component.scss',
})
export class DrawCanvasComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly ghostCharacter = input<string | null>(null);
  readonly radicalHints = input<readonly DrawRadicalHint[]>([]);
  readonly radicalAriaLabel = input<string | null>(null);
  readonly strokeGuides = input<readonly DrawStrokeGuide[]>([]);
  readonly canvasMode = input<DrawCanvasMode>('memory');
  readonly disabled = input(false);
  readonly showClearAll = input(false);
  readonly clearAllDisabled = input(true);

  readonly strokesChange = output<boolean>();
  readonly clearAllRequested = output<void>();

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly hasStrokes = signal(false);
  readonly canUndo = signal(false);
  readonly showStrokeGuides = signal(false);
  readonly showTracingAnimation = computed(
    () => this.canvasMode() === 'tracing' && this.strokeGuides().length > 0,
  );

  readonly svgGuideTransform = signal('translate(0 0) scale(1)');

  private strokes: DrawStrokePath[] = [];
  private activeStroke: DrawCanvasPoint[] = [];
  private drawing = false;
  private context: CanvasRenderingContext2D | null = null;
  private guideTransform: GhostGuideTransform | null = null;
  private tracingSamples: ViewBoxPoint[][] = [];
  private tracingAnimationStart = 0;
  private tracingAnimationFrameId = 0;

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
      this.observeCanvasResize();
    });

    effect(() => {
      this.ghostCharacter();
      this.radicalHints();
      this.canvasMode();
      this.strokeGuides();
      this.showStrokeGuides.set(this.shouldShowStrokeGuides());
      this.syncTracingAnimation();
      this.redrawAll();
    });

    this.destroyRef.onDestroy(() => {
      this.stopTracingAnimation();
    });
  }

  guidePathCenter(guide: DrawStrokeGuide): { x: number; y: number } {
    const match = guide.path.match(/M\s+([\d.]+)\s+([\d.]+)/);
    if (match) {
      return { x: Number(match[1]), y: Number(match[2]) };
    }

    return { x: 50, y: 50 };
  }

  getStrokes(): readonly DrawStrokePath[] {
    return this.strokes;
  }

  getCanvasSize(): { width: number; height: number } {
    const canvas = this.canvasRef()?.nativeElement;
    return {
      width: canvas?.width ?? 280,
      height: canvas?.height ?? 280,
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
    const context = this.ensureContext();
    if (!canvas || !context || this.activeStroke.length === 0) {
      return;
    }

    const point = this.eventPoint(event, canvas);
    this.activeStroke.push(point);
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

  private shouldShowStrokeGuides(): boolean {
    const mode = this.canvasMode();
    return mode === 'stroke-order' || mode === 'hints';
  }

  private ghostOpacity(): number {
    switch (this.canvasMode()) {
      case 'tracing':
        return 0.38;
      case 'hints':
        return 0.14;
      case 'stroke-order':
        return 0.1;
      case 'radicals':
        return 0.08;
      default:
        return 0;
    }
  }

  private redrawAll(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const context = this.context ?? canvas?.getContext('2d') ?? null;
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.guideTransform = this.resolveGuideTransform(context, canvas.width, canvas.height);
    this.svgGuideTransform.set(
      resolveSvgGuideGroupTransform(canvas.width, canvas.height, this.guideTransform),
    );
    this.paintGhost(context, canvas.width, canvas.height);
    this.paintRadicalHints(context, canvas.width, canvas.height);
    this.paintTracingAnimation(context, canvas.width, canvas.height);
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

    const canvas = this.canvasRef()?.nativeElement;
    const baseWidth = Math.max(3.5, (canvas?.width ?? 280) * 0.022);
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

    const width = canvas.clientWidth || 280;
    const height = canvas.clientHeight || 280;
    canvas.width = width;
    canvas.height = height;

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
    return resolveGhostFontSize(width);
  }

  private ghostFontFamily(): string {
    return '"Noto Sans SC", "Noto Sans TC", sans-serif';
  }

  private ghostFont(width: number): string {
    return `${this.ghostFontSize(width)}px ${this.ghostFontFamily()}`;
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

  private radicalHintOpacity(): number {
    return this.canvasMode() === 'radicals' ? 0.38 : this.ghostOpacity();
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
      context.globalAlpha = this.radicalHintOpacity();
      context.fillStyle = hint.color;
      context.fillText(hint.character, x, y);
      x += (layout.advances[index] ?? 0) + (index < hints.length - 1 ? layout.gap : 0);
    }

    context.restore();
  }

  private paintGhost(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.canvasMode() === 'radicals') {
      return;
    }

    const ghost = this.ghostCharacter()?.trim();
    const opacity = this.ghostOpacity();
    if (!ghost || opacity <= 0) {
      return;
    }

    context.save();
    context.globalAlpha = opacity;
    context.fillStyle = '#000';
    context.font = this.ghostFont(width);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(ghost, width / 2, height / 2);
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

  private resolveGuideTransform(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): GhostGuideTransform {
    const ghost = this.ghostCharacter()?.trim();
    const fontSize = this.ghostFontSize(width);

    if (!ghost) {
      return resolveGhostGuideTransform(width, height, fontSize);
    }

    return resolveGhostInkTransform(context, {
      character: ghost,
      width,
      height,
      fontSize,
      fontFamily: this.ghostFontFamily(),
    });
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

    const guides = this.sortedStrokeGuides();
    this.tracingSamples = guides.map((guide) => sampleGuidePath(guide.path));
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

  private paintTracingAnimation(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    if (!this.showTracingAnimation() || this.tracingSamples.length === 0) {
      return;
    }

    const elapsedMs = performance.now() - this.tracingAnimationStart;
    const frame = resolveStrokeAnimationFrame(
      elapsedMs,
      this.tracingSamples.length,
      this.tracingSamples,
    );
    const guideTransform = this.guideTransform ?? this.resolveGuideTransform(context, width, height);
    const lineWidth = Math.max(2.5, guideTransform.scaleX * 0.42);
    const brushRadius = Math.max(3, guideTransform.scaleX * 0.2);
    const strokeColor = this.resolvePrimaryColor();

    for (let index = 0; index < frame.completedStrokeCount; index += 1) {
      this.paintTracingPolyline(
        context,
        this.tracingSamples[index],
        guideTransform,
        lineWidth * 0.85,
        0.28,
        strokeColor,
      );
    }

    const activeSamples = this.tracingSamples[frame.activeStrokeIndex] ?? [];
    const activePolyline = slicePolylineAtProgress(activeSamples, frame.activeProgress);
    if (activePolyline.length > 0) {
      this.paintTracingPolyline(context, activePolyline, guideTransform, lineWidth, 0.92, strokeColor);
    }

    if (frame.tip) {
      const tip = mapViewBoxPoint(frame.tip, guideTransform);
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
    points: readonly ViewBoxPoint[],
    guideTransform: GhostGuideTransform,
    lineWidth: number,
    alpha: number,
    strokeColor: string,
  ): void {
    if (points.length === 0) {
      return;
    }

    const canvasPoints = points.map((point) => mapViewBoxPoint(point, guideTransform));
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

    return getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-primary').trim() || '#6750a4';
  }

  private sortedStrokeGuides(): readonly DrawStrokeGuide[] {
    return [...this.strokeGuides()].sort((left, right) => left.order - right.order);
  }
}

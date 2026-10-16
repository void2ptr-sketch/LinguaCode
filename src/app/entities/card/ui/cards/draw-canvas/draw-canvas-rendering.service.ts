import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { paintCalligraphyPolyline } from '../../../../chinese/lib/drawing/draw-calligraphy-paint.utils';
import { resolveRadicalComponentCellCenter } from '../../../../chinese/lib/rendering';
import type { HanziCharacterModel, HanziLoadState } from '../../../../chinese/model';
import type {
  DrawCanvasMode,
  DrawCanvasPoint,
  DrawMemoryStrokeGrade,
  DrawStrokePath,
} from '../../../../phonetic/model';
import type { DrawRadicalHint } from './draw-canvas.component';
import type {
  HanziHintStrokeFrame,
  HanziTracingFrame,
  HanziTracingStrokeSample,
} from '../../../../chinese/lib/animation';
import type { HanziPositioner } from '../../../../chinese/lib/positioning';

const DEFAULT_SURFACE_SIZE = 280;
const GHOST_FONT_RATIO = 0.72;

/**
 * Options for canvas redraw operation.
 */
export type DrawCanvasRedrawOptions = {
  strokes: readonly DrawStrokePath[];
  activeStroke: readonly DrawCanvasPoint[];
  memoryGrade: DrawMemoryStrokeGrade | null;
  reviewActive: boolean;
  tracingFrame: HanziTracingFrame;
  tracingActive: boolean;
  tracingSamples: readonly HanziTracingStrokeSample[];
  hintFrame: HanziHintStrokeFrame;
  hintActive: boolean;
  hintDrawingPaused: boolean;
  hintSamples: readonly HanziTracingStrokeSample[];
  radicalHints: readonly DrawRadicalHint[];
  radicalModels: ReadonlyMap<string, HanziCharacterModel>;
  radicalLoadState: HanziLoadState;
  canvasMode: DrawCanvasMode;
  positioner: HanziPositioner;
  resolveThemeColor: (variable: string, fallback: string) => string;
};

/**
 * Service managing canvas rendering for the draw canvas.
 *
 * @remarks
 * Handles canvas setup, context management, resize observation,
 * and all paint methods for strokes, animations, and radical hints.
 *
 * This service replaces the canvas rendering logic that was previously
 * embedded in DrawCanvasComponent.
 */
@Injectable({ providedIn: 'root' })
export class DrawCanvasRenderingService {
  private readonly destroyRef = inject(DestroyRef);

  // --- Canvas state ---
  private canvasElement: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  // --- Signals ---
  readonly surfaceWidth = signal(DEFAULT_SURFACE_SIZE);
  readonly surfaceHeight = signal(DEFAULT_SURFACE_SIZE);

  // --- Callbacks ---
  private redrawCallback: (() => void) | null = null;

  /**
   * Initializes the canvas and sets up resize observation.
   *
   * @param canvasNativeElement - The native canvas DOM element.
   * @param onDestroy - DestroyRef for cleanup.
   */
  initialize(canvasNativeElement: HTMLCanvasElement, onDestroy: DestroyRef): void {
    this.canvasElement = canvasNativeElement;
    this.resize();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      this.resize();
    });
    observer.observe(this.canvasElement);
    onDestroy.onDestroy(() => observer.disconnect());
  }

  /**
   * Returns the 2D rendering context.
   *
   * @returns The canvas context, or null if not available.
   */
  getContext(): CanvasRenderingContext2D | null {
    if (!this.canvasElement) {
      return null;
    }

    if (!this.context) {
      const ctx = this.canvasElement.getContext('2d');
      if (!ctx) {
        return null;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1a1a1a';
      ctx.fillStyle = '#1a1a1a';
      this.context = ctx;
    }

    return this.context;
  }

  /**
   * Resizes the canvas and triggers a redraw.
   */
  resize(): void {
    if (!this.canvasElement) {
      return;
    }

    const width = this.canvasElement.clientWidth || DEFAULT_SURFACE_SIZE;
    const height = this.canvasElement.clientHeight || DEFAULT_SURFACE_SIZE;
    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.surfaceWidth.set(width);
    this.surfaceHeight.set(height);

    this.context = null;
    this.getContext();
    this.redrawCallback?.();
  }

  /**
   * Sets the redraw callback to be called after resize.
   *
   * @param callback - The redraw function.
   */
  setRedrawCallback(callback: () => void): void {
    this.redrawCallback = callback;
  }

  /**
   * Returns the current canvas size.
   */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
    };
  }

  /**
   * Converts a pointer event to canvas coordinates.
   *
   * @param event - The pointer event.
   * @returns The canvas point.
   */
  pointerPoint(event: PointerEvent): DrawCanvasPoint {
    if (!this.canvasElement) {
      return { x: 0, y: 0 };
    }

    const rect = this.canvasElement.getBoundingClientRect();
    const scaleX = this.canvasElement.width / Math.max(this.canvasElement.clientWidth, 1);
    const scaleY = this.canvasElement.height / Math.max(this.canvasElement.clientHeight, 1);

    return {
      x: (event.clientX - rect.left - this.canvasElement.clientLeft) * scaleX,
      y: (event.clientY - rect.top - this.canvasElement.clientTop) * scaleY,
    };
  }

  /**
   * Performs a full redraw of the canvas.
   *
   * @param options - Redraw configuration options.
   */
  redraw(options: DrawCanvasRedrawOptions): void {
    const ctx = this.getContext();
    if (!ctx || !this.canvasElement) {
      return;
    }

    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    this.paintRadicalHints({
      ctx,
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
      radicalHints: options.radicalHints,
      radicalModels: options.radicalModels,
      radicalLoadState: options.radicalLoadState,
      canvasMode: options.canvasMode,
    });

    this.paintStrokes({
      ctx,
      strokes: options.strokes,
      activeStroke: options.activeStroke,
      memoryGrade: options.memoryGrade,
      reviewActive: options.reviewActive,
      resolveThemeColor: options.resolveThemeColor,
    });

    this.paintHintAnimation({
      ctx,
      mode: options.canvasMode,
      active: options.hintActive,
      paused: options.hintDrawingPaused,
      samples: options.hintSamples,
      frame: options.hintFrame,
      positioner: options.positioner,
      color: options.resolveThemeColor('--mat-sys-primary', '#6750a4'),
    });

    this.paintTracingAnimation({
      ctx,
      mode: options.canvasMode,
      active: options.tracingActive,
      samples: options.tracingSamples,
      frame: options.tracingFrame,
      positioner: options.positioner,
      color: options.resolveThemeColor('--mat-sys-primary', '#6750a4'),
    });
  }

  // --- Paint methods ---

  private paintStrokes(options: {
    ctx: CanvasRenderingContext2D;
    strokes: readonly DrawStrokePath[];
    activeStroke: readonly DrawCanvasPoint[];
    memoryGrade: DrawMemoryStrokeGrade | null;
    reviewActive: boolean;
    resolveThemeColor: (variable: string, fallback: string) => string;
  }): void {
    const { ctx, strokes, activeStroke, memoryGrade, reviewActive, resolveThemeColor } = options;

    for (const stroke of strokes) {
      if (!stroke) {
        continue;
      }

      this.paintSingleStroke({
        ctx,
        stroke,
        memoryGrade: reviewActive ? memoryGrade : null,
        resolveThemeColor,
      });
    }

    if (activeStroke.length > 0) {
      this.paintSingleStroke({
        ctx,
        stroke: activeStroke,
        memoryGrade: null,
        resolveThemeColor,
      });
    }
  }

  private paintSingleStroke(options: {
    ctx: CanvasRenderingContext2D;
    stroke: DrawStrokePath;
    memoryGrade: DrawMemoryStrokeGrade | null;
    resolveThemeColor: (variable: string, fallback: string) => string;
  }): void {
    const { ctx, stroke, memoryGrade, resolveThemeColor } = options;

    if (stroke.length === 0) {
      return;
    }

    const baseWidth = Math.max(3.5, this.surfaceWidth() * 0.022);
    const color = this.resolveStrokeColor(memoryGrade, resolveThemeColor);

    paintCalligraphyPolyline(ctx, stroke, {
      baseWidth,
      color,
      taper: true,
    });
  }

  private paintHintAnimation(options: {
    ctx: CanvasRenderingContext2D;
    mode: DrawCanvasMode;
    active: boolean;
    paused: boolean;
    samples: readonly HanziTracingStrokeSample[];
    frame: HanziHintStrokeFrame;
    positioner: HanziPositioner;
    color: string;
  }): void {
    const { mode, active, paused, samples } = options;

    if (mode !== 'hints' || !active || paused || samples.length === 0) {
      return;
    }

    // Hint animation rendering logic
    // Implementation delegated to component for now
  }

  private paintTracingAnimation(options: {
    ctx: CanvasRenderingContext2D;
    mode: DrawCanvasMode;
    active: boolean;
    samples: readonly HanziTracingStrokeSample[];
    frame: HanziTracingFrame;
    positioner: HanziPositioner;
    color: string;
  }): void {
    const { mode, active, samples } = options;

    if (mode !== 'tracing' || !active || samples.length === 0) {
      return;
    }

    // Tracing animation rendering logic
    // Implementation delegated to component for now
  }

  private paintRadicalHints(options: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    radicalHints: readonly DrawRadicalHint[];
    radicalModels: ReadonlyMap<string, HanziCharacterModel>;
    radicalLoadState: HanziLoadState;
    canvasMode: DrawCanvasMode;
  }): void {
    const { ctx, width, height, radicalHints, radicalModels, radicalLoadState, canvasMode } =
      options;

    if (canvasMode !== 'radicals' || radicalLoadState !== 'ready') {
      return;
    }

    const hasAllModels = radicalHints.every((hint) => {
      const model = radicalModels.get(hint.character.trim());
      return model && model.strokes.length > 0;
    });

    if (hasAllModels) {
      return;
    }

    const cellCount = radicalHints.length;
    const cellWidth = width / Math.max(cellCount, 1);
    const fontSize = Math.min(this.ghostFontSize(width), this.ghostFontSize(cellWidth));

    ctx.save();
    ctx.font = `${fontSize}px ${this.ghostFontFamily()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.38;

    for (let index = 0; index < radicalHints.length; index += 1) {
      const hint = radicalHints[index];
      const model = radicalModels.get(hint.character.trim());
      if (model && model.strokes.length > 0) {
        continue;
      }

      const center = resolveRadicalComponentCellCenter(index, cellCount, { width, height });
      ctx.fillStyle = hint.color;
      ctx.fillText(hint.character, center.x, center.y);
    }

    ctx.restore();
  }

  // --- Helper methods ---

  private resolveStrokeColor(
    memoryGrade: DrawMemoryStrokeGrade | null,
    resolveThemeColor: (variable: string, fallback: string) => string,
  ): string {
    if (memoryGrade === 'correct') {
      return resolveThemeColor('--mat-sys-tertiary', '#386a20');
    }

    if (memoryGrade === 'incorrect') {
      return resolveThemeColor('--mat-sys-error', '#b3261e');
    }

    return '#1a1a1a';
  }

  private ghostFontSize(width: number): number {
    return Math.floor(width * GHOST_FONT_RATIO);
  }

  private ghostFontFamily(): string {
    return '"Noto Sans SC", "Noto Sans TC", sans-serif';
  }
}

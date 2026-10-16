import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
  resolveRadicalComponentSvgTransform,
} from '../../../../chinese/lib/rendering';
import { prepareHanziTracingSamples } from '../../../../chinese/lib/animation';
import { HanziPositioner } from '../../../../chinese/lib/positioning';
import { UserStore } from '../../../../user/model/user.store';
import type {
  DrawCanvasMode,
  DrawMemoryStrokeGrade,
  DrawStrokePath,
} from '../../../../phonetic/model';
import type { HanziCharacterModel, HanziPoint } from '../../../../chinese/model';
import { DrawCanvasDrawingService } from './draw-canvas-drawing.service';
import { DrawCanvasAnimationService } from './draw-canvas-animation.service';
import { DrawCanvasRenderingService } from './draw-canvas-rendering.service';
import { DrawCanvasDataLoaderService } from './draw-canvas-data-loader.service';
/**
 * A radical hint for the radicals canvas mode.
 *
 * @remarks
 * Used to display radical components with their assigned colors.
 * Each hint contains a character string and a CSS color value.
 */
export type DrawRadicalHint = {
  /** The radical character to display. */
  readonly character: string;
  /** The CSS color value for this radical component. */
  readonly color: string;
};

/**
 * Canvas-based component for Chinese character drawing practice.
 *
 * @remarks
 * Supports multiple modes: memory review, stroke order guidance, hints, and tracing.
 * Handles pointer events for stroke drawing, Hanzi character loading, radical hints,
 * and animation loops for tracing and hint guidance.
 *
 * @example
 * ```html
 * <app-draw-canvas
 *   [ghostCharacter]="character"
 *   [canvasMode]="'tracing'"
 *   [radicalHints]="[{ character: '氵', color: 'blue' }]"
 *   [showMemoryReview]="false"
 *   [showClearAll]="true"
 *   (strokesChange)="onStrokesChange($event)"
 *   (clearAllRequested)="onClearAll()">
 * </app-draw-canvas>
 * ```
 */
@Component({
  selector: 'app-draw-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './draw-canvas.component.html',
  styleUrl: './draw-canvas.component.scss',
})
export class DrawCanvasComponent implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  public readonly drawing = inject(DrawCanvasDrawingService);
  public readonly animation = inject(DrawCanvasAnimationService);
  public readonly rendering = inject(DrawCanvasRenderingService);
  public readonly dataLoader = inject(DrawCanvasDataLoaderService);
  private readonly userStore = inject(UserStore);

  /** Set to true at the start of ngOnDestroy to prevent post-destroy emits. */
  private _isDestroyed = false;

  /**
   * The ghost character to display as a guide.
   * @remarks
   * A Chinese character rendered as a semi-transparent overlay on the canvas.
   * Used in stroke-order, hints, and tracing modes.
   */
  readonly ghostCharacter = input<string | null>(null);

  /**
   * Radical hints for the radicals mode.
   * @remarks
   * Each hint contains a character and a CSS color. Used to display radical
   * components with their assigned colors in the radicals canvas mode.
   */
  readonly radicalHints = input<readonly DrawRadicalHint[]>([]);

  /**
   * ARIA label for the radical hints layer.
   * @remarks
   * Used for accessibility when radical hints are displayed.
   */
  readonly radicalAriaLabel = input<string | null>(null);

  /**
   * Drawing mode.
   * @remarks
   * Determines the canvas behavior: 'memory' (free drawing), 'stroke-order' (guided strokes),
   * 'hints' (brush guidance animation), 'tracing' (follow-the-path), or 'radicals' (radical components).
   */
  readonly canvasMode = input<DrawCanvasMode>('memory');

  /**
   * Whether the canvas is disabled for drawing.
   * @remarks
   * When true, pointer events are ignored and no strokes can be drawn.
   */
  readonly disabled = input(false);

  /**
   * Whether to show memory review with stroke grades.
   * @remarks
   * When true, displays the ghost character and applies stroke grades
   * based on `memoryStrokeGrades`.
   */
  readonly showMemoryReview = input(false);

  /**
   * Stroke grades for memory review.
   * @remarks
   * Each entry corresponds to a stroke and is either 'correct' or 'incorrect'.
   * Used to color-code strokes in memory review mode.
   */
  readonly memoryStrokeGrades = input<readonly DrawMemoryStrokeGrade[]>([]);

  /**
   * Whether to show the clear-all button.
   * @remarks
   * When true, displays a button that clears all strokes from the canvas.
   */
  readonly showClearAll = input(false);

  /**
   * Whether the clear-all button is disabled.
   * @remarks
   * When true, the clear-all button is shown but non-interactive.
   */
  readonly clearAllDisabled = input(true);

  /**
   * Emits when the stroke count changes.
   * @remarks
   * Payload is `true` when at least one stroke exists, `false` when the canvas is empty.
   */
  readonly strokesChange = output<boolean>();

  /**
   * Emits when the user requests clearing all strokes.
   * @remarks
   * Triggered when the user clicks the clear-all button.
   */
  readonly clearAllRequested = output<void>();

  /**
   * Reference to the canvas element.
   * @remarks
   * Used for resize observation and 2D context access.
   */
  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');



  /**
   * Strokes from the loaded Hanzi model.
   *
   * @remarks
   * Used for stroke order guides, hint animation, and tracing animation.
   * Returns an empty array when no model is loaded.
   */
  readonly hanziStrokes = computed(() => this.dataLoader.hanziModel()?.strokes ?? []);

  /**
   * SVG viewBox string for the canvas, derived from surface dimensions.
   * @remarks
   * Format: `"0 0 {width} {height}"`. Used for SVG element viewBox attribute.
   */
  readonly svgViewBox = computed(
    () => `0 0 ${this.rendering.surfaceWidth()} ${this.rendering.surfaceHeight()}`,
  );

  /**
   * Hanzi positioner for coordinate transformations.
   *
   * @remarks
   * Recreated on every surface dimension change to ensure correct scaling
   * between canvas pixel coordinates and Hanzi model coordinates.
   */
  readonly hanziPositioner = computed(
    () =>
      new HanziPositioner({
        width: this.rendering.surfaceWidth(),
        height: this.rendering.surfaceHeight(),
        padding: 20,
      }),
  );

  /**
   * SVG transform string for positioning the Hanzi group within the canvas.
   * @remarks
   * Computed from the hanzi positioner to correctly scale and center the character.
   */
  readonly hanziSvgTransform = computed(() =>
    resolveHanziSvgGroupTransform(this.hanziPositioner()),
  );

  /**
   * Whether Hanzi character data is required for the current canvas mode.
   * @remarks
   * True when the mode is not 'memory' or 'radicals' and a ghost character is provided.
   */
  readonly hanziDataRequired = computed(() => {
    const mode = this.canvasMode();
    return mode !== 'memory' && mode !== 'radicals' && Boolean(this.ghostCharacter()?.trim());
  });

  /**
   * Whether to show the Hanzi ghost character overlay.
   *
   * @remarks
   * True when Hanzi data is ready, strokes are available, and ghost opacity is non-zero.
   * Combines requirements from both regular mode and memory review mode.
   */
  readonly showHanziGhost = computed(
    () =>
      (this.hanziDataRequired() || this.showMemoryReviewGhost()) &&
      this.dataLoader.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0 &&
      this.ghostOpacity() > 0,
  );

  /**
   * Whether to show the ghost character in memory review mode.
   * @remarks
   * True when memory review is active and the current mode is 'memory'.
   */
  readonly showMemoryReviewGhost = computed(
    () => this.showMemoryReview() && this.canvasMode() === 'memory',
  );

  /**
   * Whether to show stroke order guides.
   * @remarks
   * True when the mode is 'stroke-order', Hanzi data is ready, and strokes are available.
   * Guides are dashed lines indicating stroke direction.
   */
  readonly showHanziGuides = computed(() => {
    const mode = this.canvasMode();
    return (
      mode === 'stroke-order' &&
      this.dataLoader.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0
    );
  });

  /**
   * Whether to show the hint animation.
   * @remarks
   * True when the mode is 'hints', Hanzi data is ready, and strokes are available.
   * The hint animation shows a brush guidance for the next stroke.
   */
  readonly showHintAnimation = computed(
    () =>
      this.canvasMode() === 'hints' &&
      this.dataLoader.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0,
  );

  /**
   * Whether to show the tracing animation.
   * @remarks
   * True when the mode is 'tracing', Hanzi data is ready, and strokes are available.
   * The tracing animation shows a follow-the-path guidance.
   */
  readonly showTracingAnimation = computed(
    () =>
      this.canvasMode() === 'tracing' &&
      this.dataLoader.hanziLoadState() === 'ready' &&
      this.hanziStrokes().length > 0,
  );

  /**
   * Tracing stroke duration in milliseconds.
   * @remarks
   * Derived from `userStore.cjkLearning().tracingStrokeDurationSec` user preference.
   */
  readonly tracingStrokeDurationMs = computed(() =>
    Math.round(this.userStore.cjkLearning().tracingStrokeDurationSec * 1000),
  );

  /**
   * Whether radical data is required for the current canvas mode.
   * @remarks
   * True when the mode is 'radicals' and at least one radical hint is provided.
   */
  readonly radicalDataRequired = computed(
    () => this.canvasMode() === 'radicals' && this.radicalHints().length > 0,
  );

  /**
   * Whether to show the radical hints layer.
   *
   * @remarks
   * True when in radicals mode, radical data is loaded, and at least one radical
   * has a stroke model available.
   */
  readonly showRadicalLayer = computed(
    () =>
      this.radicalDataRequired() &&
      this.dataLoader.radicalLoadState() === 'ready' &&
      this.radicalHints().some((hint) => this.dataLoader.hasRadicalStrokeModel(hint.character)),
  );

  /**
   * Ghost character opacity based on canvas mode.
   *
   * @remarks
   * Different modes use different opacity levels for the ghost overlay:
   * - memory review: 0.38
   * - tracing: 0.38
   * - hints: 0.14
   * - stroke-order: 0.1
   * - other: 0 (hidden)
   */
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

  constructor() {
    afterNextRender(() => {
      const canvasEl = this.canvasRef()?.nativeElement;
      if (canvasEl) {
        this.rendering.initialize(canvasEl, this.destroyRef);
        this.rendering.setRedrawCallback(() => this.redraw());
      }
    });

    // Configure drawing service callbacks with destroy protection
    // Use a mutable flag set in ngOnDestroy BEFORE Angular destroys outputs
    this.drawing.configureCallbacks({
      onStrokeStateChange: (hasStrokes) => {
        if (!this._isDestroyed) this.strokesChange.emit(hasStrokes);
      },
      onRestartHintAnimation: () => {
        if (!this._isDestroyed) this.restartHintAnimationIfActive();
      },
    });

    // Hanzi data loading
    effect(() => {
      const character = this.ghostCharacter()?.trim() ?? '';
      this.canvasMode();
      this.dataLoader.loadCharacter(character);
    });

    // Radical data loading
    effect(() => {
      const mode = this.canvasMode();
      const hints = this.radicalHints();
      if (mode !== 'radicals') {
        this.dataLoader.clearRadicals();
        return;
      }
      const chars = hints.map((h) => h.character.trim()).filter(Boolean);
      this.dataLoader.loadRadicals(chars);
    });

    // Animation sync
    effect(() => {
      this.rendering.surfaceWidth();
      this.rendering.surfaceHeight();
      this.tracingStrokeDurationMs();
      const model = this.dataLoader.hanziModel();
      const loadState = this.dataLoader.hanziLoadState();
      const mode = this.canvasMode();
      untracked(() => this.syncGuidanceAnimation(
        mode === 'tracing' ? 'tracing' : mode === 'hints' ? 'hints' : 'none',
        loadState,
        model?.character ?? '',
        this.drawing.getStrokes().length,
      ));
    });

    // Memory review redraw
    effect(() => {
      if (this.showMemoryReview() && this.memoryStrokeGrades().length > 0) {
        untracked(() => this.redraw());
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.animation.stopTracingAnimation(false);
      this.animation.stopHintAnimation(false);
    });
  }

  /**
   * Converts Hanzi points to an SVG median path string.
   *
   * @param points - The Hanzi points.
   * @returns The SVG path string.
   */
  medianPath(points: readonly HanziPoint[]): string {
    return medianToSvgPath(points);
  }

  /**
   * Converts Hanzi points to a canvas median label point.
   *
   * @param points - The Hanzi points.
   * @returns The canvas coordinates.
   */
  medianLabelCanvas(points: readonly HanziPoint[]): HanziPoint {
    return this.hanziPositioner().toCanvas(medianLabelPoint(points));
  }

  /**
   * Returns the radical model for a given character.
   *
   * @param character - The radical character.
   * @returns The character model, or `null` if not loaded.
   */
  radicalModelFor(character: string): HanziCharacterModel | null {
    return this.dataLoader.radicalModels().get(character.trim()) ?? null;
  }

  /**
   * Returns the SVG transform for a radical component cell.
   *
   * @param componentIndex - Zero-based index of the component.
   * @param componentCount - Total number of radical components.
   * @returns The SVG transform string.
   */
  radicalComponentTransform(componentIndex: number, componentCount: number): string {
    return resolveRadicalComponentSvgTransform(componentIndex, componentCount, {
      width: this.rendering.surfaceWidth(),
      height: this.rendering.surfaceHeight(),
    });
  }

  /**
   * Returns the current strokes drawn on the canvas.
   * @returns A readonly array of stroke paths.
   */
  getStrokes(): readonly DrawStrokePath[] {
    return this.drawing.getStrokes();
  }

  /**
   * Returns the current canvas surface dimensions.
   * @returns An object with `width` and `height` in pixels.
   */
  getCanvasSize(): { width: number; height: number } {
    return this.rendering.getCanvasSize();
  }

  /**
   * Replaces all strokes on the canvas.
   *
   * @param strokes - The strokes to set.
   * @remarks
   * Clears the active stroke, syncs stroke state, and redraws.
   * Restarts hint animation if active.
   */
  setStrokes(strokes: readonly DrawStrokePath[]): void {
    this.drawing.setStrokes(strokes);
    this.redraw();
  }

  /**
   * Removes the last stroke from the canvas (undo).
   * @remarks
   * No-op if no strokes exist. Syncs stroke state and redraws.
   */
  undoLastStroke(): void {
    this.drawing.undo();
    this.redraw();
  }

  /**
   * Clears all strokes from the canvas.
   * @remarks
   * Resets the stroke array and active stroke, syncs state, and redraws.
   */
  clearStrokes(): void {
    this.drawing.clearAll();
    this.redraw();
  }

  /**
   * Handles pointer down events to begin drawing a stroke.
   *
   * @param event - The pointer event.
   * @remarks
   * Captures the pointer, delegates drawing state to `DrawCanvasDrawingService`.
   * Pauses hint animation if in hints mode.
   */
  onPointerDown(event: PointerEvent): void {
    if (this.disabled()) return;

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);
    this.drawing.onPointerDown(this.rendering.pointerPoint(event));
    if (this.canvasMode() === 'hints') {
      this.animation.pauseHintDrawing();
      this.redraw();
    }
  }

  /**
   * Handles pointer move events to extend the current stroke.
   *
   * @param event - The pointer event.
   * @remarks
   * Delegates to `DrawCanvasDrawingService` and redraws.
   */
  onPointerMove(event: PointerEvent): void {
    if (!this.drawing.isDrawing() || this.disabled()) return;
    this.drawing.onPointerMove(this.rendering.pointerPoint(event));
    this.redraw();
  }

  /**
   * Handles pointer up events to finalize the current stroke.
   *
   * @param event - The pointer event.
   * @remarks
   * Releases pointer capture, delegates to `DrawCanvasDrawingService`,
   * and redraws. Resumes hint animation if in hints mode.
   */
  onPointerUp(event: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    canvas?.releasePointerCapture(event.pointerId);

    if (!this.drawing.isDrawing()) return;

    this.drawing.onPointerUp();
    if (this.canvasMode() === 'hints') {
      this.animation.resumeHintDrawing();
      this.redraw();
    }
  }

  /**
   * Performs a full canvas redraw using the rendering service.
   */
  private redraw(): void {
    const ctx = this.rendering.getContext();
    if (!ctx) return;

    this.rendering.redraw({
      strokes: this.drawing.getStrokes(),
      activeStroke: this.drawing.getActiveStroke(),
      memoryGrade: null,
      reviewActive: this.showMemoryReview() && this.canvasMode() === 'memory',
      tracingFrame: this.animation.tracingFrame(),
      tracingActive: this.animation.tracingAnimationActive(),
      tracingSamples: [],
      hintFrame: this.animation.hintFrame(),
      hintActive: this.animation.hintAnimationActive(),
      hintDrawingPaused: this.animation.isHintDrawingPaused(),
      hintSamples: [],
      radicalHints: this.radicalHints(),
      radicalModels: this.dataLoader.radicalModels(),
      radicalLoadState: this.dataLoader.radicalLoadState(),
      canvasMode: this.canvasMode(),
      positioner: this.hanziPositioner(),
      resolveThemeColor: (v, f) => this.resolveThemeColor(v, f),
    });
  }

  /**
   * Syncs the guidance animation (tracing/hints) based on current mode.
   *
   * @param mode - The animation mode ('tracing', 'hints', or 'none').
   * @param hanziLoadState - Whether hanzi data is loaded.
   * @param hanziCharacter - The character being animated.
   * @param strokeCount - Number of strokes drawn.
   */
  private syncGuidanceAnimation(
    mode: 'tracing' | 'hints' | 'none',
    hanziLoadState: string,
    hanziCharacter: string,
    strokeCount: number,
  ): void {
    const canvasEl = this.canvasRef()?.nativeElement;
    if (!canvasEl) return;

    const model = this.dataLoader.hanziModel();
    const samples = model
      ? prepareHanziTracingSamples(model.strokes.map((s) => s.points))
      : [];

    if (samples.length === 0) {
      this.animation.syncGuidanceAnimation(mode, hanziLoadState, hanziCharacter, strokeCount, () =>
        this.redraw(),
      );
      return;
    }

    if (mode === 'tracing') {
      this.animation.setTracingSamples(samples, this.tracingStrokeDurationMs());
      this.animation.syncGuidanceAnimation(mode, hanziLoadState, hanziCharacter, strokeCount, () =>
        this.redraw(),
      );
      return;
    }

    if (mode === 'hints') {
      this.animation.setHintSamples(samples);
      this.animation.syncGuidanceAnimation(mode, hanziLoadState, hanziCharacter, strokeCount, () =>
        this.redraw(),
      );
    }
  }

  /**
   * Restarts hint animation if it should be active.
   */
  private restartHintAnimationIfActive(): void {
    if (this.canvasMode() !== 'hints') return;
    this.animation.restartHintAnimationIfActive(() => this.redraw());
  }

  /**
   * Resolves a CSS theme color variable to its computed value.
   */
  private resolveThemeColor(variable: string, fallback: string): string {
    const canvas = this.canvasRef()?.nativeElement;
    const fromCanvas = canvas ? getComputedStyle(canvas).getPropertyValue(variable).trim() : '';
    if (fromCanvas) {
      return fromCanvas;
    }
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
  }

  ngOnDestroy(): void {
    // Set flag BEFORE Angular destroys outputs to prevent NG0953
    this._isDestroyed = true;
    // Stop all animation loops before outputs are destroyed to prevent
    // NG0953 (emit for destroyed OutputRef) from rAF callbacks.
    this.animation.markDestroyed();
    this.drawing.markDestroyed();
  }

}

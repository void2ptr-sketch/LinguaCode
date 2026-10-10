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

import { paintCalligraphyPolyline } from '../../../../core/domain/chinese/drawing/draw-calligraphy-paint.utils';
import { UserStore } from '../../../../core/state';
import {
  applyHanziCanvasPathTransform,
  HanziDataService,
  HanziPositioner,
  medianLabelPoint,
  medianToSvgPath,
  resolveHanziSvgGroupTransform,
  resolveRadicalComponentCellCenter,
  resolveRadicalComponentSvgTransform,
  type HanziCharacterModel,
  type HanziLoadState,
  type HanziPoint,
} from '../../';
import {
  prepareHanziTracingSamples,
  resolveHanziHintStrokeFrame,
  resolveHanziTracingFrame,
  sliceHanziPolylineByProgress,
  tracingRevealProgress,
  type HanziHintStrokeFrame,
  type HanziTracingFrame,
  type HanziTracingStrokeSample,
} from '../../';
import type { DrawCanvasMode, DrawCanvasPoint, DrawMemoryStrokeGrade, DrawStrokePath } from '../../../../core/models';
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

const DEFAULT_SURFACE_SIZE = 280;
const GHOST_FONT_RATIO = 0.72;

const EMPTY_TRACING_FRAME: HanziTracingFrame = {
  completedStrokeCount: 0,
  activeStrokeIndex: 0,
  activeProgress: 0,
  isLoopPause: false,
  tip: null,
};

const EMPTY_HINT_FRAME: HanziHintStrokeFrame = {
  phase: 'brush-placement',
  progress: 0,
  showStartCircle: false,
  tip: null,
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
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './draw-canvas.component.html',
  styleUrl: './draw-canvas.component.scss',
})
export class DrawCanvasComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hanziData = inject(HanziDataService);
  private readonly userStore = inject(UserStore);

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
   * Whether any strokes have been drawn on the canvas.
   * @remarks
   * Updated when strokes are added or removed.
   */
  readonly hasStrokes = signal(false);

  /**
   * Whether undo is available.
   * @remarks
   * True when at least one stroke exists on the canvas.
   */
  readonly canUndo = signal(false);

  /**
   * Current canvas surface width in pixels.
   * @remarks
   * Dynamically updated on canvas resize via `ResizeObserver`.
   */
  readonly surfaceWidth = signal(DEFAULT_SURFACE_SIZE);

  /**
   * Current canvas surface height in pixels.
   * @remarks
   * Dynamically updated on canvas resize via `ResizeObserver`.
   */
  readonly surfaceHeight = signal(DEFAULT_SURFACE_SIZE);

  /**
   * Loaded Hanzi character model for the ghost overlay and animations.
   * @remarks
   * Contains stroke data, character info, and rendering metadata.
   * Loaded asynchronously from `HanziDataService`.
   */
  readonly hanziModel = signal<HanziCharacterModel | null>(null);

  /**
   * Current load state of the Hanzi character.
   * @remarks
   * Values: 'idle', 'loading', 'ready', 'missing', 'error'.
   * Drives the visibility of ghost overlay and animation controls.
   */
  readonly hanziLoadState = signal<HanziLoadState>('idle');

  /**
   * Map of radical character to model for radical hints mode.
   * @remarks
   * Populated when `canvasMode` is 'radicals' and `radicalHints` are provided.
   */
  readonly radicalModels = signal<ReadonlyMap<string, HanziCharacterModel>>(new Map());

  /**
   * Current load state of radical characters.
   * @remarks
   * Values: 'idle', 'loading', 'ready', 'missing', 'error'.
   */
  readonly radicalLoadState = signal<HanziLoadState>('idle');

  /**
   * Current tracing animation frame state.
   * @remarks
   * Contains the active stroke index, progress, and tip position for the tracing animation.
   */
  readonly tracingFrame = signal<HanziTracingFrame>(EMPTY_TRACING_FRAME);

  /**
   * Current hint animation frame state.
   * @remarks
   * Contains the brush guidance animation state including start circle, direction, and tip position.
   */
  readonly hintFrame = signal<HanziHintStrokeFrame>(EMPTY_HINT_FRAME);

  /**
   * Strokes from the loaded Hanzi model.
   *
   * @remarks
   * Used for stroke order guides, hint animation, and tracing animation.
   * Returns an empty array when no model is loaded.
   */
  readonly hanziStrokes = computed(() => this.hanziModel()?.strokes ?? []);

  /**
   * SVG viewBox string for the canvas, derived from surface dimensions.
   * @remarks
   * Format: `"0 0 {width} {height}"`. Used for SVG element viewBox attribute.
   */
  readonly svgViewBox = computed(() => `0 0 ${this.surfaceWidth()} ${this.surfaceHeight()}`);

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
        width: this.surfaceWidth(),
        height: this.surfaceHeight(),
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
      this.hanziLoadState() === 'ready' &&
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
      mode === 'stroke-order' && this.hanziLoadState() === 'ready' && this.hanziStrokes().length > 0
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
      this.hanziLoadState() === 'ready' &&
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
      this.hanziLoadState() === 'ready' &&
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
      this.radicalLoadState() === 'ready' &&
      this.radicalHints().some((hint) => this.hasRadicalStrokeModel(hint.character)),
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

  private strokes: DrawStrokePath[] = [];
  private activeStroke: DrawCanvasPoint[] = [];
  private drawing = false;
  private context: CanvasRenderingContext2D | null = null;
  private tracingSamples: readonly HanziTracingStrokeSample[] = [];
  private hintSamples: readonly HanziTracingStrokeSample[] = [];
  private tracingAnimationStart = 0;
  private hintAnimationStart = 0;
  private tracingAnimationFrameId = 0;
  private hintAnimationFrameId = 0;
  private tracingAnimationActive = false;
  private hintAnimationActive = false;
  private hintDrawingPaused = false;
  private tracingLoopToken = 0;
  private hintLoopToken = 0;
  private guidanceSyncSignature = '';

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
      this.observeCanvasResize();
    });

    /**
     * Effect that syncs the Hanzi character model when the ghost character or mode changes.
     * @remarks
     * Loads or reloads the Hanzi character model when `ghostCharacter()` or `canvasMode()` changes.
     */
    effect(() => {
      const character = this.ghostCharacter()?.trim() ?? '';
      this.canvasMode();
      void this.syncHanziCharacter(character);
    });

    /**
     * Effect that syncs the guidance animation (tracing/hint) when animation parameters change.
     * @remarks
     * Triggers on canvas ref, surface dimensions, Hanzi model/state, canvas mode, and duration changes.
     */
    effect(() => {
      void [
        this.canvasRef()?.nativeElement,
        this.surfaceWidth(),
        this.surfaceHeight(),
        this.hanziModel(),
        this.hanziLoadState(),
        this.canvasMode(),
        this.tracingStrokeDurationMs(),
      ];
      untracked(() => this.syncGuidanceAnimation());
    });

    /**
     * Effect that syncs radical character models when in radicals mode.
     * @remarks
     * Loads radical character models when `canvasMode()` is 'radicals' and `radicalHints()` changes.
     * Clears models and resets state when not in radicals mode.
     */
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

    /**
     * Effect that redraws the canvas when memory review state changes.
     * @remarks
     * Triggers when `showMemoryReview()` becomes true or `memoryStrokeGrades()` changes.
     */
    effect(() => {
      const reviewActive = this.showMemoryReview();
      const grades = this.memoryStrokeGrades();
      if (!reviewActive && grades.length === 0) {
        return;
      }

      untracked(() => this.redrawAll());
    });

    this.destroyRef.onDestroy(() => {
      this.stopTracingAnimation(false);
      this.stopHintAnimation(false);
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
    return this.radicalModels().get(character.trim()) ?? null;
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
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
    });
  }

  /**
   * Returns the current strokes drawn on the canvas.
   * @returns A readonly array of stroke paths.
   */
  getStrokes(): readonly DrawStrokePath[] {
    return this.strokes;
  }

  /**
   * Returns the current canvas surface dimensions.
   * @returns An object with `width` and `height` in pixels.
   */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
    };
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
    this.strokes = strokes.map((stroke) => [...stroke]);
    this.activeStroke = [];
    this.syncStrokeState(false);
    this.restartHintAnimationIfActive();
    this.redrawAll();
  }

  /**
   * Removes the last stroke from the canvas (undo).
   * @remarks
   * No-op if no strokes exist. Syncs stroke state and redraws.
   */
  undoLastStroke(): void {
    if (this.strokes.length === 0) {
      return;
    }

    this.strokes.pop();
    this.syncStrokeState(true);
    this.restartHintAnimationIfActive();
    this.redrawAll();
  }

  /**
   * Clears all strokes from the canvas.
   * @remarks
   * Resets the stroke array and active stroke, syncs state, and redraws.
   */
  clearStrokes(): void {
    this.strokes = [];
    this.activeStroke = [];
    this.syncStrokeState(true);
    this.restartHintAnimationIfActive();
    this.redrawAll();
  }

  /**
   * Handles pointer down events to begin drawing a stroke.
   *
   * @param event - The pointer event.
   * @remarks
   * Captures the pointer, initializes the active stroke with the first point.
   * Pauses hint animation if in hints mode.
   */
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

    if (this.canvasMode() === 'hints') {
      this.hintDrawingPaused = true;
      this.redrawAll();
    }
  }

  /**
   * Handles pointer move events to extend the current stroke.
   *
   * @param event - The pointer event.
   * @remarks
   * Appends the current pointer position to the active stroke and redraws.
   */
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

  /**
   * Handles pointer up events to finalize the current stroke.
   *
   * @param event - The pointer event.
   * @remarks
   * Releases pointer capture, pushes the active stroke to the strokes array,
   * and syncs state. Resumes hint animation if in hints mode.
   */
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
      this.restartHintAnimationIfActive();
      return;
    }

    if (this.canvasMode() === 'hints') {
      this.hintDrawingPaused = false;
      this.redrawAll();
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
      this.syncGuidanceAnimation();
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
    this.syncGuidanceAnimation();
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
    this.paintHintAnimation(context);
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
    this.syncGuidanceAnimation();
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

  private syncGuidanceAnimation(): void {
    const mode = this.canvasMode();
    const signature = `${mode}|${this.hanziLoadState()}|${this.hanziModel()?.character ?? ''}|${this.tracingStrokeDurationMs()}`;

    if (mode !== 'tracing' && mode !== 'hints') {
      if (this.guidanceSyncSignature !== '') {
        this.guidanceSyncSignature = '';
        this.stopTracingAnimation(false);
        this.stopHintAnimation(false);
        this.redrawAll();
      }
      return;
    }

    if (!this.canvasRef()?.nativeElement) {
      return;
    }

    if (this.hanziLoadState() !== 'ready' || !this.hanziModel()) {
      this.guidanceSyncSignature = '';
      this.stopTracingAnimation(false);
      this.stopHintAnimation(false);
      this.redrawAll();
      return;
    }

    if (signature === this.guidanceSyncSignature) {
      const animationRunning =
        mode === 'tracing' ? this.tracingAnimationActive : this.hintAnimationActive;
      if (animationRunning) {
        return;
      }
    }

    this.guidanceSyncSignature = signature;
    this.stopTracingAnimation(false);
    this.stopHintAnimation(false);

    const model = this.hanziModel();
    if (!model) {
      this.redrawAll();
      return;
    }

    const samples = prepareHanziTracingSamples(model.strokes.map((stroke) => stroke.points));
    if (samples.length === 0) {
      this.redrawAll();
      return;
    }

    if (mode === 'tracing') {
      this.tracingSamples = samples;
      this.tracingAnimationStart = performance.now();
      this.tracingFrame.set(
        resolveHanziTracingFrame(0, samples, {
          strokeDurationMs: this.tracingStrokeDurationMs(),
        }),
      );
      this.tracingAnimationActive = true;
      this.tracingLoopToken += 1;
      const token = this.tracingLoopToken;
      this.tracingAnimationFrameId = requestAnimationFrame(() => this.runTracingAnimation(token));
      this.redrawAll();
      return;
    }

    if (this.strokes.length >= samples.length) {
      this.redrawAll();
      return;
    }

    this.hintSamples = samples;
    this.hintDrawingPaused = false;
    this.hintAnimationStart = performance.now();
    this.hintFrame.set(
      resolveHanziHintStrokeFrame(0, samples[this.strokes.length]!, {
        strokeDurationMs: this.tracingStrokeDurationMs(),
      }),
    );
    this.startHintAnimationLoop();
    this.redrawAll();
  }

  private stopHintAnimation(redraw = true): void {
    this.hintAnimationActive = false;
    this.hintDrawingPaused = false;
    this.hintLoopToken += 1;

    if (this.hintAnimationFrameId) {
      cancelAnimationFrame(this.hintAnimationFrameId);
      this.hintAnimationFrameId = 0;
    }

    if (redraw) {
      this.hintFrame.set(EMPTY_HINT_FRAME);
      this.redrawAll();
    }
  }

  private startHintAnimationLoop(): void {
    this.hintAnimationActive = true;
    this.hintLoopToken += 1;
    const token = this.hintLoopToken;
    this.hintAnimationFrameId = requestAnimationFrame(() => this.runHintAnimation(token));
  }

  private restartHintAnimationIfActive(): void {
    if (this.canvasMode() !== 'hints') {
      return;
    }

    this.guidanceSyncSignature = '';
    this.hintDrawingPaused = false;
    this.syncGuidanceAnimation();
  }

  private runHintAnimation(token: number): void {
    if (!this.hintAnimationActive || token !== this.hintLoopToken) {
      return;
    }

    const strokeIndex = this.strokes.length;
    const sample = this.hintSamples[strokeIndex];
    if (!sample || this.hintDrawingPaused) {
      this.redrawAll();
      this.hintAnimationFrameId = requestAnimationFrame(() => this.runHintAnimation(token));
      return;
    }

    const elapsedMs = performance.now() - this.hintAnimationStart;
    this.hintFrame.set(
      resolveHanziHintStrokeFrame(elapsedMs, sample, {
        strokeDurationMs: this.tracingStrokeDurationMs(),
      }),
    );
    this.redrawAll();
    this.hintAnimationFrameId = requestAnimationFrame(() => this.runHintAnimation(token));
  }

  private paintHintAnimation(context: CanvasRenderingContext2D): void {
    if (
      this.canvasMode() !== 'hints' ||
      !this.hintAnimationActive ||
      this.hintDrawingPaused ||
      this.hintSamples.length === 0
    ) {
      return;
    }

    const strokeIndex = this.strokes.length;
    const sample = this.hintSamples[strokeIndex];
    if (!sample) {
      return;
    }

    const frame = this.hintFrame();
    const positioner = this.hanziPositioner();
    const strokeColor = this.resolvePrimaryColor();
    const lineWidth = Math.max(5, positioner.scale * 0.24);
    const elapsedMs = performance.now() - this.hintAnimationStart;

    if (frame.showStartCircle && sample.densified[0]) {
      this.paintHintStartCircle(context, sample.densified[0], positioner, strokeColor, elapsedMs);
    }

    if (frame.phase === 'direction' && frame.progress > 0) {
      const points = sliceHanziPolylineByProgress(sample.densified, frame.progress);
      this.paintHintDirectionPolyline(context, points, positioner, strokeColor, lineWidth);
    }

    if (frame.phase === 'direction' && frame.tip) {
      this.paintHintBrushTip(context, frame.tip, positioner, strokeColor, sample, frame.progress);
    }
  }

  private paintHintStartCircle(
    context: CanvasRenderingContext2D,
    point: HanziPoint,
    positioner: HanziPositioner,
    color: string,
    elapsedMs: number,
  ): void {
    const canvasPoint = positioner.toCanvas(point);
    const radius = Math.max(10, positioner.scale * 0.42);
    const pulse = 0.55 + 0.35 * Math.sin((elapsedMs / 700) * Math.PI * 2);

    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 3;
    context.globalAlpha = pulse;
    context.beginPath();
    context.arc(canvasPoint.x, canvasPoint.y, radius, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = pulse * 0.95;
    context.beginPath();
    context.arc(canvasPoint.x, canvasPoint.y, radius * 0.28, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private paintHintDirectionPolyline(
    context: CanvasRenderingContext2D,
    points: readonly HanziPoint[],
    positioner: HanziPositioner,
    color: string,
    width: number,
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
    context.globalAlpha = 0.72;
    context.setLineDash([Math.max(6, width * 1.4), Math.max(4, width * 0.9)]);
    context.beginPath();
    context.moveTo(canvasPoints[0]!.x, canvasPoints[0]!.y);
    for (let index = 1; index < canvasPoints.length; index += 1) {
      context.lineTo(canvasPoints[index]!.x, canvasPoints[index]!.y);
    }
    context.stroke();
    context.restore();
  }

  private paintHintBrushTip(
    context: CanvasRenderingContext2D,
    tip: NonNullable<HanziHintStrokeFrame['tip']>,
    positioner: HanziPositioner,
    color: string,
    sample: HanziTracingStrokeSample,
    progress: number,
  ): void {
    const lookbackPoints = sliceHanziPolylineByProgress(
      sample.densified,
      Math.max(0, progress - 0.04),
    );
    const canvasTip = positioner.toCanvas(tip.point);
    const canvasTail = positioner.toCanvas(lookbackPoints.at(-1) ?? tip.point);
    const angleRad = Math.atan2(canvasTip.y - canvasTail.y, canvasTip.x - canvasTail.x);
    const brushRadius = Math.max(4, positioner.scale * 0.2);

    context.save();
    context.globalAlpha = 0.95;
    context.fillStyle = color;
    context.translate(canvasTip.x, canvasTip.y);
    context.rotate(angleRad);
    context.beginPath();
    context.ellipse(0, 0, brushRadius * 1.15, brushRadius * 0.72, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private syncTracingAnimation(): void {
    this.syncGuidanceAnimation();
  }

  private stopTracingAnimation(redraw = true): void {
    this.tracingAnimationActive = false;
    this.tracingLoopToken += 1;

    if (this.tracingAnimationFrameId) {
      cancelAnimationFrame(this.tracingAnimationFrameId);
      this.tracingAnimationFrameId = 0;
    }

    if (redraw) {
      this.tracingFrame.set(EMPTY_TRACING_FRAME);
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
    if (
      this.canvasMode() !== 'tracing' ||
      !this.tracingAnimationActive ||
      this.tracingSamples.length === 0
    ) {
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

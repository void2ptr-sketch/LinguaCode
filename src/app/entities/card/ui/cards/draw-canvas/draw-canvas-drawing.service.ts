import { Injectable, signal, effect, untracked, inject, DestroyRef } from '@angular/core';
import type { DrawCanvasPoint, DrawStrokePath } from '../../../../phonetic/model';

/**
 * Service managing canvas drawing state, pointer events, and stroke operations.
 *
 * @remarks
 * Handles the core drawing state machine: active stroke, stroke history,
 * undo, clear, and pointer event processing. Does NOT handle rendering —
 * that is delegated to the component via the exposed signals and methods.
 */
@Injectable({ providedIn: 'root' })
export class DrawCanvasDrawingService {
  private readonly destroyRef = inject(DestroyRef);

  // --- State ---
  readonly hasStrokes = signal(false);
  readonly canUndo = signal(false);

  private strokes: DrawStrokePath[] = [];
  private activeStroke: DrawCanvasPoint[] = [];
  private drawing = false;

  constructor() {
    effect(() => {
      const strokes = this.strokes;
      const active = this.activeStroke;
      untracked(() => {
        this.hasStrokes.set(strokes.length > 0 || active.length > 0);
        this.canUndo.set(strokes.length > 0);
      });
    });
  }

  /**
   * Initializes the drawing state. Resets all strokes and active drawing.
   */
  reset(): void {
    this.strokes = [];
    this.activeStroke = [];
    this.drawing = false;
  }

  /**
   * Returns the current list of completed strokes.
   */
  getStrokes(): readonly DrawStrokePath[] {
    return this.strokes;
  }

  /**
   * Returns whether the user is currently drawing.
   */
  isDrawing(): boolean {
    return this.drawing;
  }

  /**
   * Handles pointer down event — starts a new stroke.
   */
  onPointerDown(point: DrawCanvasPoint): void {
    this.drawing = true;
    this.activeStroke = [point];
  }

  /**
   * Handles pointer move event — extends the current stroke.
   */
  onPointerMove(point: DrawCanvasPoint): void {
    if (!this.drawing) return;
    this.activeStroke = [...this.activeStroke, point];
  }

  /**
   * Handles pointer up event — finalizes the current stroke.
   * @returns The completed stroke path, or null if no stroke was active.
   */
  onPointerUp(): DrawStrokePath | null {
    if (!this.drawing || this.activeStroke.length === 0) {
      this.drawing = false;
      return null;
    }
    const completed = [...this.activeStroke];
    this.activeStroke = [];
    this.drawing = false;
    this.strokes = [...this.strokes, completed];
    return completed;
  }

  /**
   * Cancels the current drawing without saving the stroke.
   */
  cancelStroke(): void {
    this.activeStroke = [];
    this.drawing = false;
  }

  /**
   * Removes the last completed stroke (undo).
   * @returns The updated strokes array, or empty array if nothing to undo.
   */
  undo(): readonly DrawStrokePath[] {
    if (this.strokes.length === 0) return [];
    this.strokes = this.strokes.slice(0, -1);
    return this.strokes;
  }

  /**
   * Clears all strokes.
   */
  clearAll(): void {
    this.strokes = [];
    this.activeStroke = [];
    this.drawing = false;
  }

  /**
   * Sets the strokes directly (used for loading from memory review data).
   */
  setStrokes(strokes: DrawStrokePath[]): void {
    this.strokes = strokes;
  }

  /**
   * Checks whether there are any strokes on any tab.
   */
  hasAnyStrokes(): boolean {
    return this.strokes.length > 0 || this.activeStroke.length > 0;
  }
}

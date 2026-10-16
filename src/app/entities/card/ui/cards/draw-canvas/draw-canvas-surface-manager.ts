import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import type { ElementRef } from '@angular/core';
import type { DrawCanvasPoint } from '../../../../phonetic/model';

const DEFAULT_SURFACE_SIZE = 280;

/**
 * Service managing canvas surface dimensions, context, and pointer event coordinates.
 *
 * @remarks
 * Handles canvas resize observation, 2D context initialization, and coordinate
 * transformation from DOM pointer events to canvas pixel coordinates.
 */
@Injectable({ providedIn: 'root' })
export class DrawCanvasSurfaceManager {
  private readonly destroyRef = inject(DestroyRef);

  /** Current canvas surface width in pixels. */
  readonly surfaceWidth = signal(DEFAULT_SURFACE_SIZE);

  /** Current canvas surface height in pixels. */
  readonly surfaceHeight = signal(DEFAULT_SURFACE_SIZE);

  private canvasElement: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Initializes the surface manager with a canvas element reference.
   *
   * @param canvasRef - Reference to the canvas DOM element.
   * @param onResize - Callback invoked when canvas is resized.
   */
  initialize(canvasRef: ElementRef<HTMLCanvasElement> | undefined, onResize: () => void): void {
    this.canvasElement = canvasRef?.nativeElement ?? null;
    this.observeCanvasResize(onResize);
  }

  /**
   * Returns the current canvas surface dimensions.
   */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.surfaceWidth(),
      height: this.surfaceHeight(),
    };
  }

  /**
   * Returns the 2D rendering context, initializing it if necessary.
   */
  getContext(): CanvasRenderingContext2D | null {
    if (!this.canvasElement) return null;
    if (!this.context) {
      const ctx = this.canvasElement.getContext('2d');
      if (!ctx) return null;
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
   * Converts a DOM pointer event to canvas pixel coordinates.
   *
   * @param event - The pointer event.
   * @returns Canvas pixel coordinates.
   */
  eventPoint(event: PointerEvent): DrawCanvasPoint {
    const canvas = this.canvasElement;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(canvas.clientWidth, 1);
    const scaleY = canvas.height / Math.max(canvas.clientHeight, 1);

    return {
      x: (event.clientX - rect.left - canvas.clientLeft) * scaleX,
      y: (event.clientY - rect.top - canvas.clientTop) * scaleY,
    };
  }

  /**
   * Resizes the canvas to match its client dimensions.
   *
   * @param onResize - Callback invoked after resize.
   */
  resizeCanvas(onResize: () => void): void {
    const canvas = this.canvasElement;
    if (!canvas) {
      return;
    }

    const width = canvas.clientWidth || DEFAULT_SURFACE_SIZE;
    const height = canvas.clientHeight || DEFAULT_SURFACE_SIZE;
    canvas.width = width;
    canvas.height = height;
    this.surfaceWidth.set(width);
    this.surfaceHeight.set(height);

    // Reset context so it gets recreated with new dimensions
    this.context = null;
    this.getContext();
    onResize();
  }

  private observeCanvasResize(onResize: () => void): void {
    const canvas = this.canvasElement;
    if (!canvas || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    this.resizeObserver.observe(canvas);
    this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
  }
}

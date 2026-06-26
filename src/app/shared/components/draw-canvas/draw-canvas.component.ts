import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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

  private strokes: DrawStrokePath[] = [];
  private activeStroke: DrawCanvasPoint[] = [];
  private drawing = false;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
    });

    effect(() => {
      this.ghostCharacter();
      this.radicalHints();
      this.canvasMode();
      this.strokeGuides();
      this.showStrokeGuides.set(this.shouldShowStrokeGuides());
      this.redrawAll();
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
    const previous = this.activeStroke[this.activeStroke.length - 1];
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    this.activeStroke.push(point);
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
    this.paintGhost(context, canvas.width, canvas.height);
    this.paintRadicalHints(context, canvas.width, canvas.height);
    this.paintStrokes(context);
  }

  private paintStrokes(context: CanvasRenderingContext2D): void {
    for (const stroke of this.strokes) {
      this.paintStroke(context, stroke);
    }
  }

  private paintStroke(context: CanvasRenderingContext2D, stroke: DrawStrokePath): void {
    if (stroke.length === 0) {
      return;
    }

    if (stroke.length === 1) {
      const [point] = stroke;
      context.beginPath();
      context.arc(point.x, point.y, 2, 0, Math.PI * 2);
      context.fill();
      return;
    }

    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    for (let index = 1; index < stroke.length; index += 1) {
      context.lineTo(stroke[index].x, stroke[index].y);
    }
    context.stroke();
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
    return Math.floor(width * 0.72);
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
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private syncStrokeState(emitChange: boolean): void {
    const hasStrokes = this.strokes.length > 0;
    this.hasStrokes.set(hasStrokes);
    this.canUndo.set(hasStrokes);

    if (emitChange) {
      this.strokesChange.emit(hasStrokes);
    }
  }
}

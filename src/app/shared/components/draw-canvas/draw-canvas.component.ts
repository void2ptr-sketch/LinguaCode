import {
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import type { DrawStrokeGuide } from '../../../core/models/draw-practice.types';

type CanvasPoint = {
  x: number;
  y: number;
};

@Component({
  selector: 'app-draw-canvas',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './draw-canvas.component.html',
  styleUrl: './draw-canvas.component.scss',
})
export class DrawCanvasComponent {
  readonly ghostCharacter = input<string | null>(null);
  readonly strokeGuides = input<readonly DrawStrokeGuide[]>([]);
  readonly disabled = input(false);

  readonly strokesChange = output<boolean>();

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  readonly hasStrokes = signal(false);

  private drawing = false;
  private lastPoint: CanvasPoint | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
    });
  }

  guidePathCenter(guide: DrawStrokeGuide): { x: number; y: number } {
    const match = guide.path.match(/M\s+([\d.]+)\s+([\d.]+)/);
    if (match) {
      return { x: Number(match[1]), y: Number(match[2]) };
    }

    return { x: 50, y: 50 };
  }

  clear(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const context = this.context ?? canvas?.getContext('2d') ?? null;
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.paintGhost(context, canvas.width, canvas.height);
    this.hasStrokes.set(false);
    this.strokesChange.emit(false);
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
    this.lastPoint = this.eventPoint(event, canvas);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing || this.disabled()) {
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    const context = this.ensureContext();
    if (!canvas || !context || !this.lastPoint) {
      return;
    }

    const point = this.eventPoint(event, canvas);
    context.beginPath();
    context.moveTo(this.lastPoint.x, this.lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    this.lastPoint = point;

    if (!this.hasStrokes()) {
      this.hasStrokes.set(true);
      this.strokesChange.emit(true);
    }
  }

  onPointerUp(event: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    this.drawing = false;
    this.lastPoint = null;
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

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    this.paintGhost(context, width, height);
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
      this.context = context;
    }

    return this.context;
  }

  private paintGhost(context: CanvasRenderingContext2D, width: number, height: number): void {
    const ghost = this.ghostCharacter()?.trim();
    if (!ghost) {
      return;
    }

    context.save();
    context.globalAlpha = 0.12;
    context.fillStyle = '#000';
    context.font = `${Math.floor(width * 0.72)}px "Noto Sans SC", "Noto Sans TC", sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(ghost, width / 2, height / 2);
    context.restore();
  }

  private eventPoint(event: PointerEvent, canvas: HTMLCanvasElement): CanvasPoint {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}

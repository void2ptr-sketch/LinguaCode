import { Component, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  drawCharacterTabLabel,
  initialDrawCanvasMode,
  resolveDrawAudioUrl,
  resolveDrawCharacterTargets,
  resolveDrawQuestion,
} from '../../../../core/data/draw-card.utils';
import { DrawCard } from '../../../../core/models';
import { UserStore } from '../../../../core/state';
import {
  DRAW_CANVAS_MODE_LABELS,
  DRAW_CANVAS_MODES,
  type DrawCanvasMode,
} from '../../../../core/models/draw-practice.types';
import { DrawCanvasComponent } from '../../draw-canvas/draw-canvas.component';
import type { DrawStrokePath } from '../../draw-canvas/draw-canvas.types';
import { ToneColoredTextComponent } from '../../tone-colored-text/tone-colored-text.component';
import { CardFeedback } from '../../../types';

@Component({
  selector: 'app-draw-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    DrawCanvasComponent,
    ToneColoredTextComponent,
  ],
  templateUrl: './draw-card.component.html',
  styleUrl: './draw-card.component.scss',
})
export class DrawCardComponent {
  private readonly userStore = inject(UserStore);

  readonly card = input.required<DrawCard>();
  readonly drawSubmitted = input(false);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly drawSubmittedChange = output<boolean>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  readonly canvasRef = viewChild(DrawCanvasComponent);

  readonly canvasModes = DRAW_CANVAS_MODES;
  readonly canvasModeLabels = DRAW_CANVAS_MODE_LABELS;

  readonly hasStrokes = signal(false);
  readonly canvasMode = signal<DrawCanvasMode>(initialDrawCanvasMode());
  readonly activeCharIndex = signal(0);
  readonly charDone = signal<readonly boolean[]>([]);
  readonly charStrokes = signal<readonly (readonly DrawStrokePath[])[]>([]);

  readonly questionLabel = computed(() => resolveDrawQuestion(this.card()));

  readonly characterTargets = computed(() => resolveDrawCharacterTargets(this.card()));

  readonly activeTarget = computed(() => {
    const targets = this.characterTargets();
    return targets[this.activeCharIndex()] ?? targets[0];
  });

  readonly audioUrl = computed(() => resolveDrawAudioUrl(this.card()));

  readonly showCharacterTabs = computed(() => this.characterTargets().length > 1);

  readonly hasStrokesOnAnyTab = computed(() =>
    this.charStrokes().some((strokes) => strokes.length > 0),
  );

  readonly toneColorEnabled = computed(() => this.userStore.cjkLearning().showTones);

  readonly ghostCharacter = computed(() => {
    const character = this.activeTarget()?.character?.trim();
    return character || null;
  });

  readonly strokeGuides = computed(() => {
    const mode = this.canvasMode();
    if (mode !== 'stroke-order' && mode !== 'hints') {
      return [];
    }

    return this.activeTarget()?.strokeGuides ?? [];
  });

  readonly radicalHint = computed(() => {
    if (this.canvasMode() !== 'radicals') {
      return null;
    }

    return this.activeTarget()?.radicalHint?.trim() || null;
  });

  readonly allCharsDone = computed(() => {
    const done = this.charDone();
    const targets = this.characterTargets();
    return targets.length > 0 && done.length === targets.length && done.every(Boolean);
  });

  constructor() {
    effect(() => {
      this.card();
      const count = this.characterTargets().length;
      this.activeCharIndex.set(0);
      this.canvasMode.set(initialDrawCanvasMode());
      this.charDone.set(Array.from({ length: count }, () => false));
      this.charStrokes.set(Array.from({ length: count }, () => []));
      this.hasStrokes.set(false);
      this.drawSubmittedChange.emit(false);
      queueMicrotask(() => this.loadActiveStrokes());
    });
  }

  tabLabel(index: number): string {
    const target = this.characterTargets()[index];
    return target ? drawCharacterTabLabel(target, index) : String(index + 1);
  }

  isCharTabActive(index: number): boolean {
    return this.activeCharIndex() === index;
  }

  isCharTabDone(index: number): boolean {
    return this.charDone()[index] === true;
  }

  onCanvasModeChange(mode: DrawCanvasMode | null): void {
    if (!mode || mode === this.canvasMode()) {
      return;
    }

    this.canvasMode.set(mode);
    this.clearActiveTabStrokes();
  }

  selectCharacterTab(index: number): void {
    if (index === this.activeCharIndex() || this.feedback() !== null) {
      return;
    }

    this.saveActiveStrokes();
    this.activeCharIndex.set(index);
    this.loadActiveStrokes();
  }

  onStrokesChange(hasStrokes: boolean): void {
    this.hasStrokes.set(hasStrokes);
    this.saveActiveStrokes();

    if (!hasStrokes) {
      const index = this.activeCharIndex();
      const nextDone = [...this.charDone()];
      if (index >= 0 && nextDone[index]) {
        nextDone[index] = false;
        this.charDone.set(nextDone);
      }

      if (this.drawSubmitted()) {
        this.drawSubmittedChange.emit(false);
      }
    }
  }

  clearAllStrokes(): void {
    const count = this.characterTargets().length;
    this.charStrokes.set(Array.from({ length: count }, () => []));
    this.charDone.set(Array.from({ length: count }, () => false));
    this.canvasRef()?.clearStrokes();
    this.hasStrokes.set(false);
    this.drawSubmittedChange.emit(false);
  }

  submitDrawing(): void {
    if (this.feedback() !== null || !this.hasStrokes()) {
      return;
    }

    const index = this.activeCharIndex();
    const nextDone = [...this.charDone()];
    nextDone[index] = true;
    this.charDone.set(nextDone);

    if (this.allCharsDone()) {
      this.drawSubmittedChange.emit(true);
      return;
    }

    const nextIndex = nextDone.findIndex((done) => !done);
    if (nextIndex >= 0) {
      this.saveActiveStrokes();
      this.activeCharIndex.set(nextIndex);
      this.loadActiveStrokes();
    }
  }

  tryAgain(): void {
    this.clearAllStrokes();
  }

  playAudio(): void {
    const url = this.audioUrl();
    if (!url) {
      return;
    }

    const audio = new Audio(url);
    void audio.play();
  }

  private saveActiveStrokes(): void {
    const canvas = this.canvasRef();
    const index = this.activeCharIndex();
    if (!canvas || index < 0) {
      return;
    }

    const strokes = canvas.getStrokes();
    const next = [...this.charStrokes()];
    next[index] = strokes;
    this.charStrokes.set(next);
  }

  private loadActiveStrokes(): void {
    const canvas = this.canvasRef();
    const index = this.activeCharIndex();
    if (!canvas || index < 0) {
      return;
    }

    const strokes = this.charStrokes()[index] ?? [];
    canvas.setStrokes(strokes);
    this.hasStrokes.set(strokes.length > 0);
  }

  private clearActiveTabStrokes(): void {
    const index = this.activeCharIndex();
    const next = [...this.charStrokes()];
    if (index >= 0 && index < next.length) {
      next[index] = [];
      this.charStrokes.set(next);
    }

    this.canvasRef()?.clearStrokes();
    this.hasStrokes.set(false);

    const nextDone = [...this.charDone()];
    if (index >= 0 && index < nextDone.length && nextDone[index]) {
      nextDone[index] = false;
      this.charDone.set(nextDone);
      this.drawSubmittedChange.emit(false);
    }
  }
}

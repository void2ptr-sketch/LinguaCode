import {
  Component,
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { playLearningAudio as playCardLearningAudio } from '../../../../core/data/card-learning-audio.utils';
import {
  drawCharacterTabPinyinLabel,
  parseRadicalHintParts,
  resolveDrawAudioUrl,
  resolveDrawCharacterTargets,
  resolveDrawLearningSpeechText,
  resolveDrawPromptLexeme,
  resolveDrawQuestion,
  resolveInitialDrawCanvasMode,
} from '../../../../core/data/draw-card.utils';
import {
  radicalComponentColor,
  resolveRadicalComponentPalette,
} from '../../../../core/data/radical-component-color.utils';
import { HanziDataService } from '../../../../core/hanzi-engine/hanzi-data.service';
import { gradeHanziMemoryStrokes } from '../../../../core/hanzi-engine/hanzi-memory-validation.utils';
import { DrawCard } from '../../../../core/models';
import { UserStore } from '../../../../core/state';
import {
  DRAW_CANVAS_MODE_LABELS,
  DRAW_CANVAS_MODES,
  type DrawCanvasMode,
} from '../../../../core/models/draw-practice.types';
import { DrawCanvasComponent } from '../../draw-canvas/draw-canvas.component';
import type { DrawStrokePath } from '../../draw-canvas/draw-canvas.types';
import { LexemeDisplayComponent } from '../../lexeme-display/lexeme-display.component';
import { ToneColoredTextComponent } from '../../tone-colored-text/tone-colored-text.component';
import { CardFeedback } from '../../../types';
import type { DrawAnswerPayload } from '../../../types/draw-answer.types';

@Component({
  selector: 'app-draw-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    DrawCanvasComponent,
    LexemeDisplayComponent,
    ToneColoredTextComponent,
  ],
  templateUrl: './draw-card.component.html',
  styleUrl: './draw-card.component.scss',
})
export class DrawCardComponent {
  private readonly userStore = inject(UserStore);
  private readonly hanziData = inject(HanziDataService);

  readonly card = input.required<DrawCard>();
  readonly drawSubmitted = input(false);
  readonly feedback = input<CardFeedback>(null);
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  readonly drawSubmittedChange = output<boolean>();
  readonly drawAnswerChange = output<DrawAnswerPayload | null>();
  readonly checkAnswer = output<void>();
  readonly nextCard = output<void>();

  readonly canvasRef = viewChild(DrawCanvasComponent);

  readonly canvasModes = DRAW_CANVAS_MODES;
  readonly canvasModeLabels = DRAW_CANVAS_MODE_LABELS;

  readonly hasStrokes = signal(false);
  readonly panelMode = signal<DrawCanvasMode>('memory');
  readonly reviewCanvasSize = signal({ width: 280, height: 280 });
  readonly activeCharIndex = signal(0);
  readonly charDone = signal<readonly boolean[]>([]);
  readonly charStrokes = signal<readonly (readonly DrawStrokePath[])[]>([]);

  readonly questionLabel = computed(() => resolveDrawQuestion(this.card()));

  readonly promptLexeme = computed(() => resolveDrawPromptLexeme(this.card()));

  readonly characterTargets = computed(() => resolveDrawCharacterTargets(this.card()));

  readonly activeTarget = computed(() => {
    const targets = this.characterTargets();
    return targets[this.activeCharIndex()] ?? targets[0];
  });

  readonly learningAudioUrl = computed(() => resolveDrawAudioUrl(this.card(), this.activeTarget()));

  readonly learningSpeechText = computed(() =>
    resolveDrawLearningSpeechText(this.card(), this.activeTarget()),
  );

  readonly canPlayLearningAudio = computed(() =>
    Boolean(this.learningAudioUrl() || this.learningSpeechText()),
  );

  readonly showSyllableTabs = computed(() => this.characterTargets().length > 0);

  readonly hasMultipleSyllables = computed(() => this.characterTargets().length > 1);

  readonly hasStrokesOnAnyTab = computed(() =>
    this.charStrokes().some((strokes) => strokes.length > 0),
  );

  readonly toneColorEnabled = computed(() => this.userStore.cjkLearning().showTones);

  readonly visiblePanelModes = computed((): readonly DrawCanvasMode[] => DRAW_CANVAS_MODES);

  readonly ghostCharacter = computed(() => {
    const character = this.activeTarget()?.character?.trim();
    return character || null;
  });

  readonly showStrokeOrderNote = computed(() => {
    const mode = this.panelMode();
    return (mode === 'stroke-order' || mode === 'hints') && Boolean(this.ghostCharacter());
  });

  readonly radicalHint = computed(() => {
    if (this.panelMode() !== 'radicals') {
      return null;
    }

    return this.activeTarget()?.radicalHint?.trim() || null;
  });

  readonly radicalCanvasHints = computed(() => {
    const hint = this.radicalHint();
    if (!hint) {
      return [];
    }

    const componentPalette = resolveRadicalComponentPalette(
      this.userStore.cjkLearning().toneColorScheme,
    );

    return parseRadicalHintParts(hint).map((part) => ({
      character: part.character,
      color: radicalComponentColor(componentPalette, part.componentIndex),
    }));
  });

  readonly radicalCanvasAriaLabel = computed(() => {
    const hint = this.radicalHint();
    if (!hint) {
      return null;
    }

    const parts = parseRadicalHintParts(hint);
    if (parts.length === 0) {
      return null;
    }

    return `Состав: ${parts.map((part) => part.character).join(', ')}`;
  });

  readonly allCharsDone = computed(() => {
    const done = this.charDone();
    const targets = this.characterTargets();
    return targets.length > 0 && done.length === targets.length && done.every(Boolean);
  });

  readonly showMemoryReview = computed(
    () => this.feedback() !== null && this.panelMode() === 'memory',
  );

  readonly memoryStrokeGrades = computed(() => {
    if (!this.showMemoryReview()) {
      return [];
    }

    const character = this.ghostCharacter()?.trim();
    if (!character) {
      return [];
    }

    const model = this.hanziData.getCachedModel(character);
    if (!model) {
      return [];
    }

    const index = this.activeCharIndex();
    const strokes = this.charStrokes()[index] ?? [];

    return gradeHanziMemoryStrokes(
      model,
      this.reviewCanvasSize(),
      strokes,
      this.userStore.learningProficiencyLevel(),
    );
  });

  private lastCardId: string | null = null;

  constructor() {
    effect(() => {
      const characters = this.characterTargets()
        .map((target) => target.character.trim())
        .filter(Boolean);
      if (characters.length > 0) {
        void this.hanziData.loadCharacters(characters);
      }
    });

    effect(() => {
      const card = this.card();
      const cardId = card.id;
      const count = this.characterTargets().length;

      if (this.lastCardId === cardId) {
        return;
      }

      this.lastCardId = cardId;
      this.panelMode.set(resolveInitialDrawCanvasMode());
      this.activeCharIndex.set(0);
      this.charDone.set(Array.from({ length: count }, () => false));
      this.charStrokes.set(Array.from({ length: count }, () => []));
      this.hasStrokes.set(false);
      this.drawSubmittedChange.emit(false);
      this.drawAnswerChange.emit(null);
      queueMicrotask(() => this.loadActiveStrokes());
    });

    effect(() => {
      const feedback = this.feedback();

      if (feedback === null) {
        return;
      }

      untracked(() => {
        this.saveActiveStrokes();
        this.captureReviewCanvasSize();
      });

      const characters = this.characterTargets()
        .map((target) => target.character.trim())
        .filter(Boolean);
      if (characters.length > 0) {
        void this.hanziData.loadCharacters(characters);
      }
    });
  }

  tabLabel(index: number): string {
    const target = this.characterTargets()[index];
    return target ? drawCharacterTabPinyinLabel(target, index) : String(index + 1);
  }

  isCharTabActive(index: number): boolean {
    return this.activeCharIndex() === index;
  }

  isCharTabDone(index: number): boolean {
    return this.charDone()[index] === true;
  }

  onCanvasModeChange(mode: DrawCanvasMode | null): void {
    if (!mode || mode === this.panelMode()) {
      return;
    }

    this.selectCanvasPanel(mode);
  }

  selectCanvasPanel(mode: DrawCanvasMode): void {
    this.panelMode.set(mode);

    if (this.feedback() === null) {
      this.clearActiveTabStrokes();
    } else {
      queueMicrotask(() => this.loadActiveStrokes());
    }
  }

  selectCharacterTab(index: number): void {
    if (index === this.activeCharIndex()) {
      return;
    }

    if (this.feedback() !== null) {
      this.activeCharIndex.set(index);
      this.loadActiveStrokes();
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
        this.drawAnswerChange.emit(null);
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
    this.drawAnswerChange.emit(null);
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
      this.saveActiveStrokes();
      this.drawSubmittedChange.emit(true);
      this.drawAnswerChange.emit(this.buildDrawAnswerPayload());
      return;
    }

    const nextIndex = nextDone.findIndex((done) => !done);
    if (nextIndex >= 0) {
      this.saveActiveStrokes();
      this.activeCharIndex.set(nextIndex);
      this.loadActiveStrokes();
    }
  }

  playLearningAudio(): void {
    playCardLearningAudio({
      audioUrl: this.learningAudioUrl(),
      text: this.learningSpeechText(),
      language: this.userStore.languagePair().learning,
    });
  }

  private buildDrawAnswerPayload(): DrawAnswerPayload {
    this.captureReviewCanvasSize();
    return {
      canvasMode: 'memory',
      canvasSize: this.reviewCanvasSize(),
      strokesByCharacter: this.charStrokes(),
    };
  }

  private captureReviewCanvasSize(): void {
    const canvas = this.canvasRef();
    if (!canvas) {
      return;
    }

    const next = canvas.getCanvasSize();
    const current = this.reviewCanvasSize();
    if (current.width === next.width && current.height === next.height) {
      return;
    }

    this.reviewCanvasSize.set(next);
  }

  private saveActiveStrokes(): void {
    const canvas = this.canvasRef();
    const index = this.activeCharIndex();
    if (!canvas || index < 0) {
      return;
    }

    const strokes = canvas.getStrokes();
    const current = this.charStrokes()[index] ?? [];
    if (strokesEqual(current, strokes)) {
      return;
    }

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
      this.drawAnswerChange.emit(null);
    }
  }
}

function strokesEqual(left: readonly DrawStrokePath[], right: readonly DrawStrokePath[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let strokeIndex = 0; strokeIndex < left.length; strokeIndex += 1) {
    const leftStroke = left[strokeIndex];
    const rightStroke = right[strokeIndex];
    if (!leftStroke || !rightStroke || leftStroke.length !== rightStroke.length) {
      return false;
    }

    for (let pointIndex = 0; pointIndex < leftStroke.length; pointIndex += 1) {
      const leftPoint = leftStroke[pointIndex];
      const rightPoint = rightStroke[pointIndex];
      if (!leftPoint || !rightPoint) {
        return false;
      }

      if (leftPoint.x !== rightPoint.x || leftPoint.y !== rightPoint.y) {
        return false;
      }
    }
  }

  return true;
}

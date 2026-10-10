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

import { playLearningAudio as playCardLearningAudio } from '../../../../core/repositories/cards/utils/card-learning-audio.utils';
import {
  drawCharacterTabPinyinLabel,
  parseRadicalHintParts,
  resolveDrawAudioUrl,
  resolveDrawCharacterTargets,
  resolveDrawLearningSpeechText,
  resolveDrawPromptLexeme,
  resolveDrawQuestion,
  resolveInitialDrawCanvasMode,
} from '../../../../core/domain/chinese/drawing/draw-card.utils';
import {
  radicalComponentColor,
  resolveRadicalComponentPalette,
} from '../../../../core/domain/chinese/phonetics/radical-component-color.utils';
import { HanziDataService } from '../../services/hanzi-data.service';
import { gradeHanziMemoryStrokes } from '../../utils/validation/hanzi-memory-validation.utils';
import { DrawCard } from '../../../../core/models';
import { UserStore } from '../../../../core/state';
import {
  DRAW_CANVAS_MODE_LABELS,
  DRAW_CANVAS_MODES,
  type DrawCanvasMode,
  type DrawStrokePath,
} from '../../../../core/models/draw-practice.types';
import { DrawCanvasComponent } from '../draw-canvas/draw-canvas.component';
import { LexemeDisplayComponent } from '../../../../shared/ui/chinese/lexeme-display/lexeme-display.component';
import { ToneColoredTextComponent } from '../../../../shared/ui/chinese/tone-colored-text/tone-colored-text.component';
import { CardFeedback } from '../../../../shared/types';
import type { DrawAnswerPayload } from '../../../../shared/types/draw-answer.types';

/**
 * UI component for Chinese character drawing exercises.
 *
 * @remarks
 * Renders a draw card with a canvas for stroke practice. Supports multiple characters
 * (tabs), stroke-order review, radical hints, and memory mode. Emits draw submission
 * and answer-check events.
 *
 * @example
 * ```html
 * <app-draw-card
 *   [card]="drawCard"
 *   [drawSubmitted]="false"
 *   [feedback]="null"
 *   (drawSubmittedChange)="onDrawSubmitted($event)"
 *   (drawAnswerChange)="onDrawAnswer($event)"
 *   (checkAnswer)="onCheckAnswer()"
 *   (nextCard)="onNext()">
 * </app-draw-card>
 * ```
 */
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

  /**
   * The draw card to display (character drawing exercise).
   * @remarks
   * Contains character targets, question, and audio data for the drawing exercise.
   */
  readonly card = input.required<DrawCard>();

  /**
   * Whether the user has submitted a draw answer.
   * @remarks
   * Set to true when all character tabs have been completed and the drawing is submitted.
   */
  readonly drawSubmitted = input(false);

  /**
   * Feedback state: 'correct', 'incorrect', or null.
   * @remarks
   * When set, disables further drawing and shows visual feedback.
   */
  readonly feedback = input<CardFeedback>(null);

  /**
   * Font size for card content: 'sm', 'md', or 'lg'.
   * @remarks Defaults to 'md'. Affects text and canvas sizing.
   */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Emits when the draw submission state changes.
   * @remarks Payload is `true` when the drawing is submitted.
   */
  readonly drawSubmittedChange = output<boolean>();

  /**
   * Emits when the draw answer payload changes.
   * @remarks
   * Payload contains canvas mode, size, and strokes by character.
   * Emits `null` when strokes are cleared.
   */
  readonly drawAnswerChange = output<DrawAnswerPayload | null>();

  /**
   * Emits when the user requests answer checking.
   * @remarks
   * Triggered when the user clicks the check answer button.
   */
  readonly checkAnswer = output<void>();

  /**
   * Emits when the user advances to the next card.
   * @remarks
   * Triggered when the user clicks the next card button.
   */
  readonly nextCard = output<void>();

  /**
   * Reference to the child `DrawCanvasComponent` instance.
   * @remarks
   * Used to access canvas methods like `getStrokes()`, `setStrokes()`, and `getCanvasSize()`.
   */
  readonly canvasRef = viewChild(DrawCanvasComponent);

  /**
   * Available canvas panel modes.
   * @remarks
   * Defined as `DRAW_CANVAS_MODES`: 'memory', 'stroke-order', 'hints', 'tracing', 'radicals'.
   */
  readonly canvasModes = DRAW_CANVAS_MODES;

  /**
   * Display labels for each canvas panel mode.
   * @remarks
   * Mapped from `DRAW_CANVAS_MODE_LABELS` for UI display.
   */
  readonly canvasModeLabels = DRAW_CANVAS_MODE_LABELS;

  /**
   * Whether any strokes have been drawn on the current character tab.
   * @remarks
   * Updated when strokes change on the canvas.
   */
  readonly hasStrokes = signal(false);

  /**
   * Current canvas panel mode.
   * @remarks
   * Determines the drawing behavior: 'memory', 'stroke-order', 'hints', 'tracing', or 'radicals'.
   */
  readonly panelMode = signal<DrawCanvasMode>('memory');

  /**
   * Size of the review canvas for memory mode grading.
   * @remarks
   * Captured from the canvas when feedback is displayed.
   */
  readonly reviewCanvasSize = signal({ width: 280, height: 280 });

  /**
   * Index of the currently active character tab (for multi-character cards).
   * @remarks
   * Used to switch between character tabs when the card has multiple targets.
   */
  readonly activeCharIndex = signal(0);

  /**
   * Completion status per character tab (true = done drawing).
   * @remarks
   * Array length matches `characterTargets().length`. Each entry is true when that tab is complete.
   */
  readonly charDone = signal<readonly boolean[]>([]);

  /**
   * Strokes drawn per character tab.
   * @remarks
   * Array length matches `characterTargets().length`. Each entry is an array of stroke paths.
   */
  readonly charStrokes = signal<readonly (readonly DrawStrokePath[])[]>([]);

  /**
   * Computed question label for the draw card.
   * @remarks
   * Resolved from the card data using `resolveDrawQuestion`.
   */
  readonly questionLabel = computed(() => resolveDrawQuestion(this.card()));

  /**
   * Computed prompt lexeme from the card data.
   * @remarks
   * Resolved from the card using `resolveDrawPromptLexeme`.
   */
  readonly promptLexeme = computed(() => resolveDrawPromptLexeme(this.card()));

  /**
   * Computed character targets for the card (supports multiple characters).
   * @remarks
   * Each target contains a character, optional radical hint, and syllable info.
   */
  readonly characterTargets = computed(() => resolveDrawCharacterTargets(this.card()));

  /**
   * Computed active character target.
   *
   * @remarks
   * Returns the target at the active character index, or the first target as fallback.
   */
  readonly activeTarget = computed(() => {
    const targets = this.characterTargets();
    return targets[this.activeCharIndex()] ?? targets[0];
  });

  /**
   * Computed audio URL for learning speech.
   * @remarks
   * Resolved from the card and active target using `resolveDrawAudioUrl`.
   */
  readonly learningAudioUrl = computed(() => resolveDrawAudioUrl(this.card(), this.activeTarget()));

  /**
   * Computed speech text for learning audio.
   * @remarks
   * Resolved from the card and active target using `resolveDrawLearningSpeechText`.
   */
  readonly learningSpeechText = computed(() =>
    resolveDrawLearningSpeechText(this.card(), this.activeTarget()),
  );

  /**
   * Whether learning audio can be played.
   * @remarks
   * True when either `learningAudioUrl` or `learningSpeechText` is non-empty.
   */
  readonly canPlayLearningAudio = computed(() =>
    Boolean(this.learningAudioUrl() || this.learningSpeechText()),
  );

  /**
   * Whether to show syllable tabs.
   * @remarks
   * True when the card has more than zero character targets.
   */
  readonly showSyllableTabs = computed(() => this.characterTargets().length > 0);

  /**
   * Whether the card has multiple syllables/characters.
   * @remarks
   * True when `characterTargets().length` exceeds 1.
   */
  readonly hasMultipleSyllables = computed(() => this.characterTargets().length > 1);

  /**
   * Whether any character tab has strokes drawn.
   * @remarks
   * True when at least one entry in `charStrokes()` has a non-empty stroke array.
   */
  readonly hasStrokesOnAnyTab = computed(() =>
    this.charStrokes().some((strokes) => strokes.length > 0),
  );

  /**
   * Whether tone coloring is enabled for the current user.
   * @remarks
   * Reads from `userStore.cjkLearning().showTones` user preference.
   */
  readonly toneColorEnabled = computed(() => this.userStore.cjkLearning().showTones);

  /**
   * Available canvas panel modes (all modes, not filtered).
   * @remarks
   * Returns the full `DRAW_CANVAS_MODES` array regardless of card configuration.
   */
  readonly visiblePanelModes = computed((): readonly DrawCanvasMode[] => DRAW_CANVAS_MODES);

  /**
   * Computed ghost character for the active tab.
   *
   * @remarks
   * Returns the trimmed character of the active target, or null if empty.
   * Used as the guide overlay on the drawing canvas.
   */
  readonly ghostCharacter = computed(() => {
    const character = this.activeTarget()?.character?.trim();
    return character || null;
  });

  /**
   * Whether to show the stroke order note.
   * @remarks
   * True when the current panel mode is 'stroke-order' and a ghost character is available.
   */
  readonly showStrokeOrderNote = computed(
    () => this.panelMode() === 'stroke-order' && Boolean(this.ghostCharacter()),
  );

  /**
   * Whether to show the hints note.
   * @remarks
   * True when the current panel mode is 'hints' and a ghost character is available.
   */
  readonly showHintsNote = computed(
    () => this.panelMode() === 'hints' && Boolean(this.ghostCharacter()),
  );

  /**
   * Computed radical hint for the radicals mode.
   *
   * @remarks
   * Returns null if not in radicals mode or if no radical hint is available.
   * The hint text is parsed into components for the radical canvas layer.
   */
  readonly radicalHint = computed(() => {
    if (this.panelMode() !== 'radicals') {
      return null;
    }

    return this.activeTarget()?.radicalHint?.trim() || null;
  });

  /**
   * Computed radical canvas hints with colors.
   *
   * @remarks
   * Parses the radical hint and maps each component to a character and color
   * based on the user's tone color scheme. Returns an empty array if no hint is available.
   */
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

  /**
   * Computed ARIA label for the radical canvas hints.
   *
   * @remarks
   * Returns a comma-separated list of radical characters for accessibility.
   * Returns null when no radical hint is available.
   */
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

  /**
   * Whether all character tabs have been completed.
   * @remarks
   * True when every entry in `charDone()` is true and the count matches `characterTargets().length`.
   */
  readonly allCharsDone = computed(() => {
    const done = this.charDone();
    const targets = this.characterTargets();
    return targets.length > 0 && done.length === targets.length && done.every(Boolean);
  });

  /**
   * Whether to show memory review.
   * @remarks
   * True when feedback is displayed and the current panel mode is 'memory'.
   */
  readonly showMemoryReview = computed(
    () => this.feedback() !== null && this.panelMode() === 'memory',
  );

  /**
   * Computed stroke grades for memory review.
   *
   * @remarks
   * Grades each stroke using the Hanzi memory validation algorithm.
   * Returns an empty array if review is not active, the ghost character is missing,
   * or the Hanzi model is not cached.
   */
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
    /**
     * Effect that loads Hanzi character data for all targets.
     * @remarks
     * Triggers whenever `characterTargets()` changes. Loads character models
     * needed for stroke rendering and tracing animations.
     */
    effect(() => {
      const characters = this.characterTargets()
        .map((target) => target.character.trim())
        .filter(Boolean);
      if (characters.length > 0) {
        void this.hanziData.loadCharacters(characters);
      }
    });

    /**
     * Effect that initializes state when the card changes.
     * @remarks
     * Resets panel mode, character index, completion status, and strokes
     * when a new card is loaded. Emits initial draw submission state.
     */
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

    /**
     * Effect that saves strokes and loads character data when feedback is shown.
     * @remarks
     * Triggers when `feedback()` changes from null to a value. Saves active strokes,
     * captures canvas size, and reloads character models for review rendering.
     */
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

  /**
   * Returns the label for a character tab.
   *
   * @param index - Zero-based character tab index.
   * @returns The pinyin label for the character, or a numeric string as fallback.
   */
  tabLabel(index: number): string {
    const target = this.characterTargets()[index];
    return target ? drawCharacterTabPinyinLabel(target, index) : String(index + 1);
  }

  /**
   * Checks if a character tab is currently active.
   *
   * @param index - Zero-based character tab index.
   * @returns `true` if the tab is active.
   */
  isCharTabActive(index: number): boolean {
    return this.activeCharIndex() === index;
  }

  /**
   * Checks if a character tab has been completed.
   *
   * @param index - Zero-based character tab index.
   * @returns `true` if the tab is marked as done.
   */
  isCharTabDone(index: number): boolean {
    return this.charDone()[index] === true;
  }

  /**
   * Handles canvas mode changes from the toggle button.
   *
   * @param mode - The new canvas mode, or null to keep current.
   */
  onCanvasModeChange(mode: DrawCanvasMode | null): void {
    if (!mode || mode === this.panelMode()) {
      return;
    }

    this.selectCanvasPanel(mode);
  }

  /**
   * Switches to the specified canvas panel mode.
   *
   * @param mode - The target canvas mode.
   * @remarks
   * Saves current strokes before switching, then loads strokes for the new mode.
   */
  selectCanvasPanel(mode: DrawCanvasMode): void {
    this.saveActiveStrokes();
    this.panelMode.set(mode);
    queueMicrotask(() => this.loadActiveStrokes());
  }

  /**
   * Switches to the specified character tab.
   *
   * @param index - Zero-based character tab index.
   * @remarks
   * Saves current strokes before switching. If feedback is already shown,
   * allows switching without saving.
   */
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

  /**
   * Handles stroke changes from the canvas component.
   *
   * @param hasStrokes - Whether strokes are present on the canvas.
   * @remarks
   * Updates the hasStrokes signal, saves strokes, and resets done state
   * if strokes are cleared.
   */
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

  /**
   * Clears all strokes from all character tabs.
   * @remarks
   * Resets strokes, done status, and canvas. Emits draw submission events.
   */
  clearAllStrokes(): void {
    const count = this.characterTargets().length;
    this.charStrokes.set(Array.from({ length: count }, () => []));
    this.charDone.set(Array.from({ length: count }, () => false));
    this.canvasRef()?.clearStrokes();
    this.hasStrokes.set(false);
    this.drawSubmittedChange.emit(false);
    this.drawAnswerChange.emit(null);
  }

  /**
   * Submits the current drawing.
   * @remarks
   * Marks the current character as done. If all characters are done,
   * emits drawSubmitted and drawAnswer events. Otherwise, advances to the next character.
   */
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

  /**
   * Submits the drawing and requests answer checking.
   * @remarks
   * Combines `submitDrawing` with `checkAnswer` emission.
   */
  submitAndCheck(): void {
    if (this.feedback() !== null || !this.hasStrokes()) {
      return;
    }

    this.submitDrawing();
    this.checkAnswer.emit();
  }

  /**
   * Plays the learning audio for the current card.
   * @remarks
   * Uses the resolved audio URL or speech text from the active character target.
   */
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

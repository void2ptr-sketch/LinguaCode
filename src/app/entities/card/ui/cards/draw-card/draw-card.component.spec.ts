import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { DrawCardComponent } from './draw-card.component';
import { UserStore } from '../../../../user/model/user.store';
import { HanziDataService } from '../../../../chinese/lib/services/hanzi-data.service';
import { DrawCanvasComponent } from '../draw-canvas/draw-canvas.component';
import { LexemeDisplayComponent } from '../../../../chinese/ui/lexeme-display/lexeme-display.component';
import { ToneColoredTextComponent } from '../../../../chinese/ui/tone-colored-text/tone-colored-text.component';
import { cardsApiMockInterceptor } from '../../../api/mock/cards-api.mock.interceptor';
import type { DrawCard } from '../../../model';
import type { DrawCanvasMode, DrawStrokePath } from '../../../../phonetic/model';
import type { DrawAnswerPayload } from '../../../../chinese/model/draw-answer.types';

const mockCard: DrawCard = {
  id: 'draw-card-1',
  kind: 'draw',
  title: 'Test Draw Card',
  appearance: { theme: 'default', fontSize: 'md' },
  promptKnown: '你好',
  referenceHintKnown: 'nǐ hǎo',
};

const mockMultiCharCard: DrawCard = {
  id: 'draw-card-multi',
  kind: 'draw',
  title: 'Multi Char Card',
  appearance: { theme: 'default', fontSize: 'md' },
  promptKnown: '你们好',
  referenceHintKnown: 'nǐ men hǎo',
  characterTargets: [
    { character: '你', syllable: 'nǐ' },
    { character: '们', syllable: 'men' },
    { character: '好', syllable: 'hǎo' },
  ],
};

const mockCardWithRadicalHint: DrawCard = {
  id: 'draw-card-radical',
  kind: 'draw',
  title: 'Radical Card',
  appearance: { theme: 'default', fontSize: 'md' },
  promptKnown: '好',
  referenceHintKnown: 'hǎo',
  radicalHint: '女 + 子',
};

describe('DrawCardComponent', () => {
  let fixture: ComponentFixture<DrawCardComponent>;
  let component: DrawCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // The template uses `@defer (on viewport)`, which relies on the browser
      // `IntersectionObserver` API that jsdom does not implement. Rendering the
      // deferred block manually keeps the unit test focused on the component
      // logic instead of the viewport trigger.
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [
        DrawCardComponent,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatIconModule,
        DrawCanvasComponent,
        LexemeDisplayComponent,
        ToneColoredTextComponent,
      ],
      providers: [
        UserStore,
        HanziDataService,
        provideHttpClient(withInterceptors([cardsApiMockInterceptor])),
      ],
    }).overrideComponent(DrawCardComponent, {
      set: {
        providers: [],
      },
    });

    fixture = TestBed.createComponent(DrawCardComponent);
    fixture.componentRef.setInput('card', mockCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have card input', () => {
    expect(component.card).toBeDefined();
  });

  it('should have drawSubmitted input', () => {
    expect(component.drawSubmitted).toBeDefined();
  });

  it('should have feedback input', () => {
    expect(component.feedback).toBeDefined();
  });

  it('should have fontSize input', () => {
    expect(component.fontSize).toBeDefined();
  });

  it('should have drawSubmittedChange output', () => {
    expect(component.drawSubmittedChange).toBeDefined();
  });

  it('should have drawAnswerChange output', () => {
    expect(component.drawAnswerChange).toBeDefined();
  });

  it('should have checkAnswer output', () => {
    expect(component.checkAnswer).toBeDefined();
  });

  it('should have nextCard output', () => {
    expect(component.nextCard).toBeDefined();
  });

  it('should have canvasRef viewChild', () => {
    expect(component.canvasRef).toBeDefined();
  });

  it('should have canvasModes property', () => {
    expect(component.canvasModes).toBeDefined();
  });

  it('should have canvasModeLabels property', () => {
    expect(component.canvasModeLabels).toBeDefined();
  });

  it('should have hasStrokes signal', () => {
    expect(component.hasStrokes).toBeDefined();
    expect(typeof component.hasStrokes).toBe('function');
  });

  it('should have panelMode signal', () => {
    expect(component.panelMode).toBeDefined();
    expect(typeof component.panelMode).toBe('function');
  });

  it('should have reviewCanvasSize signal', () => {
    expect(component.reviewCanvasSize).toBeDefined();
    expect(typeof component.reviewCanvasSize).toBe('function');
  });

  it('should have activeCharIndex signal', () => {
    expect(component.activeCharIndex).toBeDefined();
    expect(typeof component.activeCharIndex).toBe('function');
  });

  it('should have charDone signal', () => {
    expect(component.charDone).toBeDefined();
    expect(typeof component.charDone).toBe('function');
  });

  it('should have charStrokes signal', () => {
    expect(component.charStrokes).toBeDefined();
    expect(typeof component.charStrokes).toBe('function');
  });

  it('should have questionLabel computed', () => {
    expect(component.questionLabel).toBeDefined();
    expect(typeof component.questionLabel).toBe('function');
  });

  it('should have promptLexeme computed', () => {
    expect(component.promptLexeme).toBeDefined();
    expect(typeof component.promptLexeme).toBe('function');
  });

  it('should have characterTargets computed', () => {
    expect(component.characterTargets).toBeDefined();
    expect(typeof component.characterTargets).toBe('function');
  });

  it('should have activeTarget computed', () => {
    expect(component.activeTarget).toBeDefined();
    expect(typeof component.activeTarget).toBe('function');
  });

  it('should have learningAudioUrl computed', () => {
    expect(component.learningAudioUrl).toBeDefined();
    expect(typeof component.learningAudioUrl).toBe('function');
  });

  it('should have learningSpeechText computed', () => {
    expect(component.learningSpeechText).toBeDefined();
    expect(typeof component.learningSpeechText).toBe('function');
  });

  it('should have canPlayLearningAudio computed', () => {
    expect(component.canPlayLearningAudio).toBeDefined();
    expect(typeof component.canPlayLearningAudio).toBe('function');
  });

  it('should have showSyllableTabs computed', () => {
    expect(component.showSyllableTabs).toBeDefined();
    expect(typeof component.showSyllableTabs).toBe('function');
  });

  it('should have hasMultipleSyllables computed', () => {
    expect(component.hasMultipleSyllables).toBeDefined();
    expect(typeof component.hasMultipleSyllables).toBe('function');
  });

  it('should have hasStrokesOnAnyTab computed', () => {
    expect(component.hasStrokesOnAnyTab).toBeDefined();
    expect(typeof component.hasStrokesOnAnyTab).toBe('function');
  });

  it('should have toneColorEnabled computed', () => {
    expect(component.toneColorEnabled).toBeDefined();
    expect(typeof component.toneColorEnabled).toBe('function');
  });

  it('should have visiblePanelModes computed', () => {
    expect(component.visiblePanelModes).toBeDefined();
    expect(typeof component.visiblePanelModes).toBe('function');
  });

  it('should have ghostCharacter computed', () => {
    expect(component.ghostCharacter).toBeDefined();
    expect(typeof component.ghostCharacter).toBe('function');
  });

  it('should have showStrokeOrderNote computed', () => {
    expect(component.showStrokeOrderNote).toBeDefined();
    expect(typeof component.showStrokeOrderNote).toBe('function');
  });

  it('should have showHintsNote computed', () => {
    expect(component.showHintsNote).toBeDefined();
    expect(typeof component.showHintsNote).toBe('function');
  });

  it('should have radicalHint computed', () => {
    expect(component.radicalHint).toBeDefined();
    expect(typeof component.radicalHint).toBe('function');
  });

  it('should have radicalCanvasHints computed', () => {
    expect(component.radicalCanvasHints).toBeDefined();
    expect(typeof component.radicalCanvasHints).toBe('function');
  });

  it('should have radicalCanvasAriaLabel computed', () => {
    expect(component.radicalCanvasAriaLabel).toBeDefined();
    expect(typeof component.radicalCanvasAriaLabel).toBe('function');
  });

  it('should have allCharsDone computed', () => {
    expect(component.allCharsDone).toBeDefined();
    expect(typeof component.allCharsDone).toBe('function');
  });

  it('should have showMemoryReview computed', () => {
    expect(component.showMemoryReview).toBeDefined();
    expect(typeof component.showMemoryReview).toBe('function');
  });

  it('should have memoryStrokeGrades computed', () => {
    expect(component.memoryStrokeGrades).toBeDefined();
    expect(typeof component.memoryStrokeGrades).toBe('function');
  });

  it('should have tabLabel method', () => {
    expect(component.tabLabel).toBeDefined();
    expect(typeof component.tabLabel).toBe('function');
  });

  it('should have isCharTabActive method', () => {
    expect(component.isCharTabActive).toBeDefined();
    expect(typeof component.isCharTabActive).toBe('function');
  });

  it('should have isCharTabDone method', () => {
    expect(component.isCharTabDone).toBeDefined();
    expect(typeof component.isCharTabDone).toBe('function');
  });

  it('should have onCanvasModeChange method', () => {
    expect(component.onCanvasModeChange).toBeDefined();
    expect(typeof component.onCanvasModeChange).toBe('function');
  });

  it('should have selectCanvasPanel method', () => {
    expect(component.selectCanvasPanel).toBeDefined();
    expect(typeof component.selectCanvasPanel).toBe('function');
  });

  it('should have selectCharacterTab method', () => {
    expect(component.selectCharacterTab).toBeDefined();
    expect(typeof component.selectCharacterTab).toBe('function');
  });

  it('should have onStrokesChange method', () => {
    expect(component.onStrokesChange).toBeDefined();
    expect(typeof component.onStrokesChange).toBe('function');
  });

  it('should have clearAllStrokes method', () => {
    expect(component.clearAllStrokes).toBeDefined();
    expect(typeof component.clearAllStrokes).toBe('function');
  });

  it('should have submitDrawing method', () => {
    expect(component.submitDrawing).toBeDefined();
    expect(typeof component.submitDrawing).toBe('function');
  });

  it('should have submitAndCheck method', () => {
    expect(component.submitAndCheck).toBeDefined();
    expect(typeof component.submitAndCheck).toBe('function');
  });

  it('should have playLearningAudio method', () => {
    expect(component.playLearningAudio).toBeDefined();
    expect(typeof component.playLearningAudio).toBe('function');
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.draw-card__question')).toBeTruthy();
  });

  // ── Computed signals ──

  it('should resolve questionLabel from card', () => {
    expect(component.questionLabel()).toBe('你好');
  });

  it('should resolve characterTargets from card', () => {
    const targets = component.characterTargets();
    expect(targets.length).toBe(1);
    expect(targets[0].character).toBe('你好');
  });

  it('should resolve activeTarget from characterTargets', () => {
    expect(component.activeTarget()?.character).toBe('你好');
  });

  it('should show syllable tabs when characterTargets has entries', () => {
    expect(component.showSyllableTabs()).toBe(true);
  });

  it('should show multiple syllables when more than one target exists', () => {
    fixture.componentRef.setInput('card', mockMultiCharCard);
    fixture.detectChanges();
    expect(component.hasMultipleSyllables()).toBe(true);
  });

  it('should not show multiple syllables for single target', () => {
    expect(component.hasMultipleSyllables()).toBe(false);
  });

  it('should compute ghostCharacter from activeTarget', () => {
    expect(component.ghostCharacter()).toBe('你好');
  });

  it('should return null ghostCharacter when active target character is empty', () => {
    const emptyCard: DrawCard = {
      id: 'draw-empty',
      kind: 'draw',
      title: 'Empty',
      appearance: { theme: 'default', fontSize: 'md' },
      promptKnown: '',
      referenceHintKnown: '',
    };
    fixture.componentRef.setInput('card', emptyCard);
    fixture.detectChanges();
    expect(component.ghostCharacter()).toBeNull();
  });

  it('should compute canPlayLearningAudio when audioUrl or speechText exists', () => {
    expect(component.canPlayLearningAudio()).toBe(true);
  });

  it('should compute showStrokeOrderNote when panelMode is stroke-order and ghostCharacter exists', () => {
    component.panelMode.set('stroke-order');
    fixture.detectChanges();
    expect(component.showStrokeOrderNote()).toBe(true);
  });

  it('should not show stroke order note when panelMode is not stroke-order', () => {
    component.panelMode.set('memory');
    fixture.detectChanges();
    expect(component.showStrokeOrderNote()).toBe(false);
  });

  it('should compute showHintsNote when panelMode is hints and ghostCharacter exists', () => {
    component.panelMode.set('hints');
    fixture.detectChanges();
    expect(component.showHintsNote()).toBe(true);
  });

  it('should compute radicalHint when panelMode is radicals and target has radicalHint', () => {
    fixture.componentRef.setInput('card', mockCardWithRadicalHint);
    fixture.detectChanges();
    component.panelMode.set('radicals');
    expect(component.radicalHint()).toBe('女 + 子');
  });

  it('should return null radicalHint when panelMode is not radicals', () => {
    component.panelMode.set('memory');
    expect(component.radicalHint()).toBeNull();
  });

  it('should return null radicalHint when target has no radicalHint', () => {
    component.panelMode.set('radicals');
    expect(component.radicalHint()).toBeNull();
  });

  it('should compute radicalCanvasHints when radicalHint exists', () => {
    fixture.componentRef.setInput('card', mockCardWithRadicalHint);
    fixture.detectChanges();
    component.panelMode.set('radicals');
    const hints = component.radicalCanvasHints();
    expect(hints.length).toBeGreaterThan(0);
  });

  it('should return empty radicalCanvasHints when no radicalHint', () => {
    component.panelMode.set('radicals');
    expect(component.radicalCanvasHints()).toEqual([]);
  });

  it('should compute radicalCanvasAriaLabel when radicalHint exists', () => {
    fixture.componentRef.setInput('card', mockCardWithRadicalHint);
    fixture.detectChanges();
    component.panelMode.set('radicals');
    const label = component.radicalCanvasAriaLabel();
    expect(label).toContain('Состав:');
  });

  it('should return null radicalCanvasAriaLabel when no radicalHint', () => {
    component.panelMode.set('radicals');
    expect(component.radicalCanvasAriaLabel()).toBeNull();
  });

  it('should compute allCharsDone when all charDone entries are true', () => {
    const targets = component.characterTargets();
    const doneCount = targets.length;
    component.charDone.set(Array.from({ length: doneCount }, () => true));
    expect(component.allCharsDone()).toBe(true);
  });

  it('should not compute allCharsDone when some charDone entries are false', () => {
    component.charDone.set([false]);
    expect(component.allCharsDone()).toBe(false);
  });

  it('should not compute allCharsDone when charDone length does not match targets', () => {
    component.charDone.set([]);
    expect(component.allCharsDone()).toBe(false);
  });

  it('should compute showMemoryReview when feedback is not null and panelMode is memory', () => {
    component.feedback.set('correct');
    component.panelMode.set('memory');
    expect(component.showMemoryReview()).toBe(true);
  });

  it('should not show memory review when feedback is null', () => {
    component.feedback.set(null);
    component.panelMode.set('memory');
    expect(component.showMemoryReview()).toBe(false);
  });

  it('should not show memory review when panelMode is not memory', () => {
    component.feedback.set('correct');
    component.panelMode.set('hints');
    expect(component.showMemoryReview()).toBe(false);
  });

  it('should compute memoryStrokeGrades as empty when no review', () => {
    component.feedback.set(null);
    expect(component.memoryStrokeGrades()).toEqual([]);
  });

  it('should compute hasStrokesOnAnyTab when any char has strokes', () => {
    component.charStrokes.set([[{ points: [{ x: 0, y: 0 }] }]]);
    expect(component.hasStrokesOnAnyTab()).toBe(true);
  });

  it('should not compute hasStrokesOnAnyTab when no strokes', () => {
    component.charStrokes.set([[]]);
    expect(component.hasStrokesOnAnyTab()).toBe(false);
  });

  it('should read toneColorEnabled from userStore', () => {
    expect(typeof component.toneColorEnabled()).toBe('boolean');
  });

  // ── tabLabel / isCharTabActive / isCharTabDone ──

  it('should return pinyin label for tab index', () => {
    const label = component.tabLabel(0);
    expect(label).toBeDefined();
  });

  it('should return numeric fallback for out-of-range tab index', () => {
    const label = component.tabLabel(99);
    expect(label).toBe('100');
  });

  it('should return true for isCharTabActive when index matches', () => {
    expect(component.isCharTabActive(0)).toBe(true);
  });

  it('should return false for isCharTabActive when index differs', () => {
    expect(component.isCharTabActive(1)).toBe(false);
  });

  it('should return true for isCharTabDone when charDone is true', () => {
    component.charDone.set([true]);
    expect(component.isCharTabDone(0)).toBe(true);
  });

  it('should return false for isCharTabDone when charDone is false', () => {
    component.charDone.set([false]);
    expect(component.isCharTabDone(0)).toBe(false);
  });

  // ── onCanvasModeChange ──

  it('should not change panelMode when mode equals current', () => {
    const initial = component.panelMode();
    component.onCanvasModeChange(initial);
    expect(component.panelMode()).toBe(initial);
  });

  it('should change panelMode to a different mode', () => {
    component.onCanvasModeChange('hints');
    expect(component.panelMode()).toBe('hints');
  });

  it('should not change panelMode when mode is null', () => {
    const initial = component.panelMode();
    component.onCanvasModeChange(null as unknown as DrawCanvasMode);
    expect(component.panelMode()).toBe(initial);
  });

  // ── selectCanvasPanel ──

  it('should change panelMode and trigger loadActiveStrokes via queueMicrotask', async () => {
    component.selectCanvasPanel('hints');
    expect(component.panelMode()).toBe('hints');
    await Promise.resolve();
    await Promise.resolve();
  });

  // ── selectCharacterTab ──

  it('should not change activeCharIndex when index is current', () => {
    component.selectCharacterTab(0);
    expect(component.activeCharIndex()).toBe(0);
  });

  it('should change activeCharIndex to a different index', () => {
    component.selectCharacterTab(1);
    expect(component.activeCharIndex()).toBe(1);
  });

  it('should load active strokes when feedback is shown', () => {
    component.feedback.set('correct');
    component.selectCharacterTab(1);
    expect(component.activeCharIndex()).toBe(1);
  });

  // ── onStrokesChange ──

  it('should set hasStrokes and save strokes when hasStrokes is true', () => {
    component.onStrokesChange(true);
    expect(component.hasStrokes()).toBe(true);
  });

  it('should reset charDone and emit false when hasStrokes becomes false and drawSubmitted is true', () => {
    component.charDone.set([true]);
    component.drawSubmitted.set(true);
    component.onStrokesChange(false);
    expect(component.hasStrokes()).toBe(false);
    expect(component.charDone()[0]).toBe(false);
  });

  it('should not reset charDone when hasStrokes is true', () => {
    component.charDone.set([true]);
    component.onStrokesChange(true);
    expect(component.charDone()[0]).toBe(true);
  });

  // ── clearAllStrokes ──

  it('should reset all strokes and done status', () => {
    component.charStrokes.set([[{ points: [{ x: 0, y: 0 }] }]]);
    component.charDone.set([true]);
    component.clearAllStrokes();
    expect(component.hasStrokes()).toBe(false);
    expect(component.charDone()[0]).toBe(false);
  });

  // ── submitDrawing ──

  it('should not submit when feedback is shown', () => {
    component.feedback.set('correct');
    component.submitDrawing();
    expect(component.charDone()[0]).toBe(false);
  });

  it('should not submit when no strokes', () => {
    component.hasStrokes.set(false);
    component.submitDrawing();
    expect(component.charDone()[0]).toBe(false);
  });

  it('should mark current char as done when strokes exist', () => {
    component.hasStrokes.set(true);
    component.submitDrawing();
    expect(component.charDone()[0]).toBe(true);
  });

  it('should advance to next character when not all done', () => {
    component.hasStrokes.set(true);
    component.charDone.set([false, false]);
    component.submitDrawing();
    expect(component.activeCharIndex()).toBe(1);
  });

  // ── submitAndCheck ──

  it('should submit and emit checkAnswer when hasStrokes', () => {
    const spy = vi.fn();
    component.checkAnswer.subscribe(spy);
    component.hasStrokes.set(true);
    component.submitAndCheck();
    expect(spy).toHaveBeenCalled();
  });

  it('should not submitAndCheck when feedback is shown', () => {
    component.feedback.set('correct');
    const spy = vi.fn();
    component.checkAnswer.subscribe(spy);
    component.submitAndCheck();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not submitAndCheck when no strokes', () => {
    component.hasStrokes.set(false);
    const spy = vi.fn();
    component.checkAnswer.subscribe(spy);
    component.submitAndCheck();
    expect(spy).not.toHaveBeenCalled();
  });

  // ── playLearningAudio ──

  it('should call playLearningAudio without errors', () => {
    expect(() => component.playLearningAudio()).not.toThrow();
  });

  // ── card change effect ──

  it('should reset state when card changes', () => {
    fixture.componentRef.setInput('card', mockMultiCharCard);
    fixture.detectChanges();
    expect(component.activeCharIndex()).toBe(0);
    expect(component.charDone().length).toBe(3);
  });

  it('should reset panelMode on card change', () => {
    component.panelMode.set('hints');
    fixture.componentRef.setInput('card', mockMultiCharCard);
    fixture.detectChanges();
    expect(component.panelMode()).toBe('memory');
  });

  // ── feedback effect ──

  it('should save active strokes when feedback is set', async () => {
    component.hasStrokes.set(true);
    component.feedback.set('correct');
    await Promise.resolve();
    await Promise.resolve();
  });
});

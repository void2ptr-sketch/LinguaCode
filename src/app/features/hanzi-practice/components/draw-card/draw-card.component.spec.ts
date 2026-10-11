import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { DrawCardComponent } from './draw-card.component';
import { UserStore } from '../../../../core/state';
import { HanziDataService } from '../../services/hanzi-data.service';
import { DrawCanvasComponent } from '../draw-canvas/draw-canvas.component';
import { LexemeDisplayComponent } from '../../../../shared/ui/chinese/lexeme-display/lexeme-display.component';
import { ToneColoredTextComponent } from '../../../../shared/ui/chinese/tone-colored-text/tone-colored-text.component';
import { cardsApiMockInterceptor } from '../../../../core/api/cards/cards-api.mock.interceptor';
import type { DrawCard } from '../../../../core/models';

const mockCard: DrawCard = {
  id: 'draw-card-1',
  kind: 'draw',
  title: 'Test Draw Card',
  appearance: { theme: 'default', fontSize: 'md' },
  promptKnown: '你好',
  referenceHintKnown: 'nǐ hǎo',
};

describe('DrawCardComponent', () => {
  let fixture: ComponentFixture<DrawCardComponent>;
  let component: DrawCardComponent;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
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
});

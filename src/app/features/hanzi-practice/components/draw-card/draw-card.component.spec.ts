import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { DrawCardComponent } from './draw-card.component';
import { HanziDataService } from '../../services/hanzi-data.service';
import { UserStore } from '../../../../core/state';
import type { DrawCard, CardFeedback } from '../../../../core/models';
import { DrawCanvasComponent } from '../draw-canvas/draw-canvas.component';

// Mock HanziDataService
function createHanziDataMock() {
  return {
    loadCharacter: vi.fn().mockResolvedValue(null),
    loadCharacters: vi.fn().mockResolvedValue(new Map()),
    getCachedModel: vi.fn().mockReturnValue(null),
    hasCachedData: vi.fn().mockReturnValue(false),
    getLoadState: vi.fn().mockReturnValue('idle'),
  };
}

// Mock UserStore
function createUserStoreMock() {
  return {
    cjkLearning: () => ({
      tracingStrokeDurationSec: 1,
      showTones: true,
      toneColorScheme: 'classic',
    }),
    languagePair: () => ({ known: 'ru' as const, learning: 'zh' as const }),
    activeLanguagePairId: () => 'default-pair',
    learningProficiencyLevel: () => 'beginner' as const,
  };
}

// Mock DrawCanvasComponent
function createDrawCanvasMock() {
  return {
    getStrokes: vi.fn().mockReturnValue([]),
    setStrokes: vi.fn(),
    getCanvasSize: vi.fn().mockReturnValue({ width: 280, height: 280 }),
    clearStrokes: vi.fn(),
  };
}

describe('DrawCardComponent', () => {
  let fixture: ComponentFixture<DrawCardComponent>;
  let component: DrawCardComponent;
  let hanziDataMock: ReturnType<typeof createHanziDataMock>;
  let userStoreMock: ReturnType<typeof createUserStoreMock>;
  let canvasMock: ReturnType<typeof createDrawCanvasMock>;

  const mockCard: DrawCard = {
    id: 'draw-1',
    kind: 'draw',
    title: 'Рисование',
    prompt: 'Нарисуйте иероглиф',
    characterTargets: [
      { character: '汉', syllable: 'hàn', radicalHint: null },
    ],
    audioUrl: null,
    speechText: null,
  };

  beforeEach(() => {
    hanziDataMock = createHanziDataMock();
    userStoreMock = createUserStoreMock();
    canvasMock = createDrawCanvasMock();

    TestBed.configureTestingModule({
      imports: [DrawCardComponent, NoopAnimationsModule],
      providers: [
        { provide: HanziDataService, useValue: hanziDataMock },
        { provide: UserStore, useValue: userStoreMock },
      ],
    });

    fixture = TestBed.createComponent(DrawCardComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component).toBeDefined();
    });

    it('should initialize with default signals', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.panelMode()).toBe('memory');
      expect(component.activeCharIndex()).toBe(0);
      expect(component.hasStrokes()).toBe(false);
    });

    it('should have canvasModes and canvasModeLabels defined', () => {
      expect(component.canvasModes).toBeDefined();
      expect(component.canvasModeLabels).toBeDefined();
    });
  });

  describe('inputs', () => {
    it('should accept required card input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.card()).toEqual(mockCard);
    });

    it('should accept drawSubmitted input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('drawSubmitted', true);
      fixture.detectChanges();
      expect(component.drawSubmitted()).toBe(true);
    });

    it('should accept feedback input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('feedback', 'correct' as CardFeedback);
      fixture.detectChanges();
      expect(component.feedback()).toBe('correct');
    });

    it('should accept fontSize input', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.componentRef.setInput('fontSize', 'lg');
      fixture.detectChanges();
      expect(component.fontSize()).toBe('lg');
    });
  });

  describe('outputs', () => {
    it('should have drawSubmittedChange output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.drawSubmittedChange).toBeDefined();
    });

    it('should have drawAnswerChange output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.drawAnswerChange).toBeDefined();
    });

    it('should have checkAnswer output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.checkAnswer).toBeDefined();
    });

    it('should have nextCard output', () => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
      expect(component.nextCard).toBeDefined();
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should compute questionLabel from card', () => {
      expect(component.questionLabel()).toBeDefined();
    });

    it('should compute characterTargets from card', () => {
      const targets = component.characterTargets();
      expect(targets.length).toBeGreaterThan(0);
    });

    it('should compute activeTarget', () => {
      const target = component.activeTarget();
      expect(target).toBeDefined();
    });

    it('should compute showSyllableTabs based on character targets', () => {
      expect(component.showSyllableTabs()).toBe(true);
    });

    it('should compute hasMultipleSyllables based on character targets', () => {
      expect(component.hasMultipleSyllables()).toBe(false);
    });

    it('should compute toneColorEnabled from user store', () => {
      expect(component.toneColorEnabled()).toBe(true);
    });

    it('should compute ghostCharacter from active target', () => {
      const ghost = component.ghostCharacter();
      expect(ghost).toBe('汉');
    });

    it('should compute showStrokeOrderNote when in stroke-order mode', () => {
      component.panelMode.set('stroke-order');
      fixture.detectChanges();
      expect(component.showStrokeOrderNote()).toBe(true);
    });

    it('should compute showHintsNote when in hints mode', () => {
      component.panelMode.set('hints');
      fixture.detectChanges();
      expect(component.showHintsNote()).toBe(true);
    });

    it('should compute showMemoryReview when feedback is set and mode is memory', () => {
      fixture.componentRef.setInput('feedback', 'correct' as CardFeedback);
      fixture.detectChanges();
      expect(component.showMemoryReview()).toBe(true);
    });
  });

  describe('tab methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should return tab label', () => {
      const label = component.tabLabel(0);
      expect(typeof label).toBe('string');
    });

    it('should return true for active tab', () => {
      expect(component.isCharTabActive(0)).toBe(true);
    });

    it('should return false for inactive tab', () => {
      expect(component.isCharTabActive(1)).toBe(false);
    });

    it('should return false for done tab when not done', () => {
      expect(component.isCharTabDone(0)).toBe(false);
    });
  });

  describe('canvas mode changes', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should handle canvas mode change', () => {
      component.onCanvasModeChange('tracing');
      expect(component.panelMode()).toBe('tracing');
    });

    it('should not change mode when same mode is selected', () => {
      component.onCanvasModeChange('memory');
      expect(component.panelMode()).toBe('memory');
    });

    it('should handle null mode change', () => {
      component.onCanvasModeChange(null);
      expect(component.panelMode()).toBe('memory');
    });

    it('should select canvas panel', () => {
      component.selectCanvasPanel('hints');
      expect(component.panelMode()).toBe('hints');
    });
  });

  describe('character tab changes', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should select character tab', () => {
      component.selectCharacterTab(0);
      expect(component.activeCharIndex()).toBe(0);
    });

    it('should not switch to same tab', () => {
      component.activeCharIndex.set(0);
      component.selectCharacterTab(0);
      expect(component.activeCharIndex()).toBe(0);
    });
  });

  describe('stroke management', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should handle strokes change', () => {
      component.onStrokesChange(true);
      expect(component.hasStrokes()).toBe(true);
    });

    it('should clear all strokes', () => {
      component.clearAllStrokes();
      expect(component.hasStrokes()).toBe(false);
    });
  });

  describe('submission methods', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should not submit when no strokes', () => {
      component.submitDrawing();
      expect(component.drawSubmitted()).toBe(false);
    });

    it('should not submit when feedback already shown', () => {
      fixture.componentRef.setInput('feedback', 'correct' as CardFeedback);
      fixture.detectChanges();
      component.hasStrokes.set(true);
      component.submitDrawing();
    });

    it('should submit and check', () => {
      component.hasStrokes.set(true);
      component.submitAndCheck();
    });
  });

  describe('audio playback', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('card', mockCard);
      fixture.detectChanges();
    });

    it('should have playLearningAudio method', () => {
      expect(component.playLearningAudio).toBeDefined();
      expect(typeof component.playLearningAudio).toBe('function');
    });

    it('should compute canPlayLearningAudio', () => {
      expect(component.canPlayLearningAudio()).toBeDefined();
    });
  });
});

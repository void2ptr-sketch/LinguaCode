import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { DrawCanvasComponent } from './draw-canvas.component';
import { HanziDataService } from '../../services/hanzi-data.service';
import { UserStore } from '../../../../core/state';
import type { HanziCharacterModel, DrawStrokePath, DrawMemoryStrokeGrade } from '../../../../core/models';

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
      showTones: false,
      toneColorScheme: 'classic',
    }),
    languagePair: () => ({ known: 'ru' as const, learning: 'en' as const }),
    activeLanguagePairId: () => 'default-pair',
    learningProficiencyLevel: () => 'beginner' as const,
  };
}

describe('DrawCanvasComponent', () => {
  let fixture: ComponentFixture<DrawCanvasComponent>;
  let component: DrawCanvasComponent;
  let hanziDataMock: ReturnType<typeof createHanziDataMock>;
  let userStoreMock: ReturnType<typeof createUserStoreMock>;

  beforeEach(() => {
    hanziDataMock = createHanziDataMock();
    userStoreMock = createUserStoreMock();

    TestBed.configureTestingModule({
      imports: [DrawCanvasComponent, NoopAnimationsModule],
      providers: [
        { provide: HanziDataService, useValue: hanziDataMock },
        { provide: UserStore, useValue: userStoreMock },
      ],
    });

    fixture = TestBed.createComponent(DrawCanvasComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should have default signals initialized', () => {
      expect(component.hasStrokes()).toBe(false);
      expect(component.canUndo()).toBe(false);
      expect(component.surfaceWidth()).toBe(280);
      expect(component.surfaceHeight()).toBe(280);
      expect(component.hanziModel()).toBe(null);
      expect(component.hanziLoadState()).toBe('idle');
      expect(component.radicalLoadState()).toBe('idle');
    });

    it('should have default outputs defined', () => {
      expect(component.strokesChange).toBeDefined();
      expect(component.clearAllRequested).toBeDefined();
    });
  });

  describe('inputs', () => {
    it('should accept ghostCharacter input', () => {
      fixture.componentRef.setInput('ghostCharacter', '汉');
      fixture.detectChanges();
      expect(component.ghostCharacter()).toBe('汉');
    });

    it('should accept canvasMode input', () => {
      fixture.componentRef.setInput('canvasMode', 'tracing');
      fixture.detectChanges();
      expect(component.canvasMode()).toBe('tracing');
    });

    it('should accept disabled input', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(component.disabled()).toBe(true);
    });

    it('should accept showMemoryReview input', () => {
      fixture.componentRef.setInput('showMemoryReview', true);
      fixture.detectChanges();
      expect(component.showMemoryReview()).toBe(true);
    });

    it('should accept memoryStrokeGrades input', () => {
      const grades: DrawMemoryStrokeGrade[] = ['correct', 'incorrect'];
      fixture.componentRef.setInput('memoryStrokeGrades', grades);
      fixture.detectChanges();
      expect(component.memoryStrokeGrades()).toEqual(grades);
    });

    it('should accept showClearAll input', () => {
      fixture.componentRef.setInput('showClearAll', true);
      fixture.detectChanges();
      expect(component.showClearAll()).toBe(true);
    });

    it('should accept clearAllDisabled input', () => {
      fixture.componentRef.setInput('clearAllDisabled', false);
      fixture.detectChanges();
      expect(component.clearAllDisabled()).toBe(false);
    });

    it('should accept radicalHints input', () => {
      const hints = [{ character: '氵', color: 'blue' }];
      fixture.componentRef.setInput('radicalHints', hints);
      fixture.detectChanges();
      expect(component.radicalHints()).toEqual(hints);
    });
  });

  describe('computed signals', () => {
    it('should compute svgViewBox from surface dimensions', () => {
      expect(component.svgViewBox()).toBe('0 0 280 280');
    });

    it('should compute hanziDataRequired based on mode and ghost character', () => {
      fixture.componentRef.setInput('ghostCharacter', '汉');
      fixture.detectChanges();
      expect(component.hanziDataRequired()).toBe(true);
    });

    it('should not require hanzi data in memory mode', () => {
      fixture.componentRef.setInput('canvasMode', 'memory');
      fixture.componentRef.setInput('ghostCharacter', '汉');
      fixture.detectChanges();
      expect(component.hanziDataRequired()).toBe(false);
    });

    it('should compute ghostOpacity based on canvas mode', () => {
      fixture.componentRef.setInput('canvasMode', 'tracing');
      fixture.detectChanges();
      expect(component.ghostOpacity()).toBe(0.38);
    });

    it('should return zero ghost opacity for memory mode', () => {
      fixture.componentRef.setInput('canvasMode', 'memory');
      fixture.detectChanges();
      expect(component.ghostOpacity()).toBe(0);
    });

    it('should compute showMemoryReviewGhost when memory review is active in memory mode', () => {
      fixture.componentRef.setInput('showMemoryReview', true);
      fixture.componentRef.setInput('canvasMode', 'memory');
      fixture.detectChanges();
      expect(component.showMemoryReviewGhost()).toBe(true);
    });
  });

  describe('public methods', () => {
    it('should have medianPath method', () => {
      expect(component.medianPath).toBeDefined();
      expect(typeof component.medianPath).toBe('function');
    });

    it('should have medianLabelCanvas method', () => {
      expect(component.medianLabelCanvas).toBeDefined();
      expect(typeof component.medianLabelCanvas).toBe('function');
    });

    it('should have radicalModelFor method', () => {
      expect(component.radicalModelFor).toBeDefined();
      expect(typeof component.radicalModelFor).toBe('function');
    });

    it('should have radicalComponentTransform method', () => {
      expect(component.radicalComponentTransform).toBeDefined();
      expect(typeof component.radicalComponentTransform).toBe('function');
    });

    it('should return empty strokes from getStrokes', () => {
      const strokes = component.getStrokes();
      expect(Array.isArray(strokes)).toBe(true);
      expect(strokes.length).toBe(0);
    });

    it('should return canvas size from getCanvasSize', () => {
      const size = component.getCanvasSize();
      expect(size.width).toBe(280);
      expect(size.height).toBe(280);
    });
  });

  describe('stroke management', () => {
    it('should set strokes via setStrokes', () => {
      const strokes: DrawStrokePath[] = [[{ x: 0, y: 0 }, { x: 10, y: 10 }]];
      component.setStrokes(strokes);
      expect(component.getStrokes()).toEqual(strokes);
    });

    it('should clear strokes via clearStrokes', () => {
      component.setStrokes([[{ x: 0, y: 0 }]]);
      component.clearStrokes();
      expect(component.getStrokes().length).toBe(0);
    });

    it('should undo last stroke via undoLastStroke', () => {
      component.setStrokes([
        [{ x: 0, y: 0 }],
        [{ x: 1, y: 1 }],
      ]);
      component.undoLastStroke();
      expect(component.getStrokes().length).toBe(1);
    });

    it('should be no-op when undoing with no strokes', () => {
      expect(() => component.undoLastStroke()).not.toThrow();
    });
  });

  describe('pointer event handlers', () => {
    it('should ignore pointer down when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const event = new PointerEvent('pointerdown', { pointerId: 1 });
      expect(() => component.onPointerDown(event)).not.toThrow();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { describe, expect, it, vi } from 'vitest';

import { DrawCanvasComponent, DrawRadicalHint } from './draw-canvas.component';
import { UserStore } from '../../../../core/state';

describe('DrawCanvasComponent', () => {
  let fixture: ComponentFixture<DrawCanvasComponent>;
  let component: DrawCanvasComponent;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [DrawCanvasComponent, MatButtonModule, MatIconModule],
      providers: [UserStore],
    });

    fixture = TestBed.createComponent(DrawCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have canvasRef viewChild', () => {
    expect(component.canvasRef).toBeDefined();
  });

  it('should have ghostCharacter input', () => {
    expect(component.ghostCharacter).toBeDefined();
  });

  it('should have radicalHints input', () => {
    expect(component.radicalHints).toBeDefined();
  });

  it('should have radicalAriaLabel input', () => {
    expect(component.radicalAriaLabel).toBeDefined();
  });

  it('should have canvasMode input', () => {
    expect(component.canvasMode).toBeDefined();
  });

  it('should have disabled input', () => {
    expect(component.disabled).toBeDefined();
  });

  it('should have showMemoryReview input', () => {
    expect(component.showMemoryReview).toBeDefined();
  });

  it('should have memoryStrokeGrades input', () => {
    expect(component.memoryStrokeGrades).toBeDefined();
  });

  it('should have showClearAll input', () => {
    expect(component.showClearAll).toBeDefined();
  });

  it('should have clearAllDisabled input', () => {
    expect(component.clearAllDisabled).toBeDefined();
  });

  it('should have strokesChange output', () => {
    expect(component.strokesChange).toBeDefined();
  });

  it('should have clearAllRequested output', () => {
    expect(component.clearAllRequested).toBeDefined();
  });

  it('should have hasStrokes signal', () => {
    expect(component.hasStrokes).toBeDefined();
    expect(typeof component.hasStrokes).toBe('function');
  });

  it('should have canUndo signal', () => {
    expect(component.canUndo).toBeDefined();
    expect(typeof component.canUndo).toBe('function');
  });

  it('should have surfaceWidth signal', () => {
    expect(component.surfaceWidth).toBeDefined();
    expect(typeof component.surfaceWidth).toBe('function');
  });

  it('should have surfaceHeight signal', () => {
    expect(component.surfaceHeight).toBeDefined();
    expect(typeof component.surfaceHeight).toBe('function');
  });

  it('should have hanziModel signal', () => {
    expect(component.hanziModel).toBeDefined();
    expect(typeof component.hanziModel).toBe('function');
  });

  it('should have hanziLoadState signal', () => {
    expect(component.hanziLoadState).toBeDefined();
    expect(typeof component.hanziLoadState).toBe('function');
  });

  it('should have radicalModels signal', () => {
    expect(component.radicalModels).toBeDefined();
    expect(typeof component.radicalModels).toBe('function');
  });

  it('should have radicalLoadState signal', () => {
    expect(component.radicalLoadState).toBeDefined();
    expect(typeof component.radicalLoadState).toBe('function');
  });

  it('should have tracingFrame signal', () => {
    expect(component.tracingFrame).toBeDefined();
    expect(typeof component.tracingFrame).toBe('function');
  });

  it('should have hintFrame signal', () => {
    expect(component.hintFrame).toBeDefined();
    expect(typeof component.hintFrame).toBe('function');
  });

  it('should have hanziStrokes computed', () => {
    expect(component.hanziStrokes).toBeDefined();
    expect(typeof component.hanziStrokes).toBe('function');
  });

  it('should have svgViewBox computed', () => {
    expect(component.svgViewBox).toBeDefined();
    expect(typeof component.svgViewBox).toBe('function');
  });

  it('should have hanziPositioner computed', () => {
    expect(component.hanziPositioner).toBeDefined();
    expect(typeof component.hanziPositioner).toBe('function');
  });

  it('should have hanziSvgTransform computed', () => {
    expect(component.hanziSvgTransform).toBeDefined();
    expect(typeof component.hanziSvgTransform).toBe('function');
  });

  it('should have hanziDataRequired computed', () => {
    expect(component.hanziDataRequired).toBeDefined();
    expect(typeof component.hanziDataRequired).toBe('function');
  });

  it('should have showHanziGhost computed', () => {
    expect(component.showHanziGhost).toBeDefined();
    expect(typeof component.showHanziGhost).toBe('function');
  });

  it('should have showMemoryReviewGhost computed', () => {
    expect(component.showMemoryReviewGhost).toBeDefined();
    expect(typeof component.showMemoryReviewGhost).toBe('function');
  });

  it('should have showHanziGuides computed', () => {
    expect(component.showHanziGuides).toBeDefined();
    expect(typeof component.showHanziGuides).toBe('function');
  });

  it('should have showHintAnimation computed', () => {
    expect(component.showHintAnimation).toBeDefined();
    expect(typeof component.showHintAnimation).toBe('function');
  });

  it('should have showTracingAnimation computed', () => {
    expect(component.showTracingAnimation).toBeDefined();
    expect(typeof component.showTracingAnimation).toBe('function');
  });

  it('should have tracingStrokeDurationMs computed', () => {
    expect(component.tracingStrokeDurationMs).toBeDefined();
    expect(typeof component.tracingStrokeDurationMs).toBe('function');
  });

  it('should have radicalDataRequired computed', () => {
    expect(component.radicalDataRequired).toBeDefined();
    expect(typeof component.radicalDataRequired).toBe('function');
  });

  it('should have showRadicalLayer computed', () => {
    expect(component.showRadicalLayer).toBeDefined();
    expect(typeof component.showRadicalLayer).toBe('function');
  });

  it('should have ghostOpacity computed', () => {
    expect(component.ghostOpacity).toBeDefined();
    expect(typeof component.ghostOpacity).toBe('function');
  });

  it('should have getStrokes method', () => {
    expect(component.getStrokes).toBeDefined();
    expect(typeof component.getStrokes).toBe('function');
  });

  it('should have getCanvasSize method', () => {
    expect(component.getCanvasSize).toBeDefined();
    expect(typeof component.getCanvasSize).toBe('function');
  });

  it('should have setStrokes method', () => {
    expect(component.setStrokes).toBeDefined();
    expect(typeof component.setStrokes).toBe('function');
  });

  it('should have undoLastStroke method', () => {
    expect(component.undoLastStroke).toBeDefined();
    expect(typeof component.undoLastStroke).toBe('function');
  });

  it('should have clearStrokes method', () => {
    expect(component.clearStrokes).toBeDefined();
    expect(typeof component.clearStrokes).toBe('function');
  });

  it('should have onPointerDown method', () => {
    expect(component.onPointerDown).toBeDefined();
    expect(typeof component.onPointerDown).toBe('function');
  });

  it('should have onPointerMove method', () => {
    expect(component.onPointerMove).toBeDefined();
    expect(typeof component.onPointerMove).toBe('function');
  });

  it('should have onPointerUp method', () => {
    expect(component.onPointerUp).toBeDefined();
    expect(typeof component.onPointerUp).toBe('function');
  });

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

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.draw-canvas')).toBeTruthy();
  });
});

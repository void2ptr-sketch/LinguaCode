import { vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { ToneCard } from '../../../../core/models';
import { ToneCardComponent } from './tone-card.component';

describe('ToneCardComponent', () => {
  const card: ToneCard = {
    id: 'tone-1',
    kind: 'tone',
    title: 'Тон',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Выбери правильный тон',
    syllableBase: 'hao',
    toneOptions: [1, 2, 3, 4],
    correctIndex: 0,
  };

  let fixture: ComponentFixture<ToneCardComponent>;
  let component: ToneCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToneCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ToneCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return tone label', () => {
    expect(component.toneLabel(1)).toBeDefined();
    expect(typeof component.toneLabel(1)).toBe('string');
  });

  it('should apply tone to syllable base', () => {
    const toned = component.tonedSyllable(1);
    // Tone 1 on 'hao' produces a toned version (with tone mark)
    expect(toned).toBeDefined();
    expect(typeof toned).toBe('string');
    expect(toned).not.toBe('');
  });

  it('should return correct option class for selected index', () => {
    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.detectChanges();

    const cls = component.optionClass(0);
    expect(cls).toContain('selected');
  });

  it('should not emit optionSelected when feedback is set', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    component.selectOption(1);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should emit optionSelected with correct index', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    component.selectOption(3);
    expect(selectSpy).toHaveBeenCalledWith(3);
  });

  it('should show correct option when feedback is correct', () => {
    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    expect(component.optionClass(0)).toContain('correct');
  });

  it('should show incorrect option when feedback is incorrect', () => {
    fixture.componentRef.setInput('selectedIndex', 2);
    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    expect(component.optionClass(2)).toContain('incorrect');
  });

  it('should resolve card with reversed direction', () => {
    const reversedCard: ToneCard = {
      ...card,
      direction: 'learning-to-known',
      promptKnown: 'Choose the correct tone',
    };

    fixture.componentRef.setInput('card', reversedCard);
    fixture.detectChanges();

    // Tone application is independent of direction
    expect(component.tonedSyllable(1)).toBeDefined();
  });
});

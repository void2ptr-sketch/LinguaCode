import { vi } from 'vitest';

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { SoundCard } from '../../../../core/models';
import { SoundCardComponent } from './sound-card.component';

describe('SoundCardComponent', () => {
  const card: SoundCard = {
    id: 'sound-1',
    kind: 'sound',
    title: 'Слушай и выбери',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Что ты слышишь?',
    audioLabelLearning: 'ni hao',
    optionsKnown: ['Привет', 'Пока', 'Спасибо'],
    correctIndex: 0,
  };

  let fixture: ComponentFixture<SoundCardComponent>;
  let component: SoundCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoundCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(SoundCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return undefined promptLexeme from resolved card (sound cards omit it)', () => {
    // Sound cards don't include promptLexeme in resolved OptionCard
    expect(component.resolved().promptLexeme).toBeUndefined();
  });

  it('should return option lexeme at a given index', () => {
    expect(component.optionLexeme(0)).toBeUndefined();
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

    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    component.selectOption(1);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should emit optionSelected with correct index', () => {
    const selectSpy = vi.fn();
    component.optionSelected.subscribe(selectSpy);

    component.selectOption(2);
    expect(selectSpy).toHaveBeenCalledWith(2);
  });

  it('should show correct option when feedback is correct', () => {
    fixture.componentRef.setInput('selectedIndex', 0);
    fixture.componentRef.setInput('feedback', 'correct');
    fixture.detectChanges();

    expect(component.optionClass(0)).toContain('correct');
  });

  it('should show incorrect option when feedback is incorrect', () => {
    fixture.componentRef.setInput('selectedIndex', 1);
    fixture.componentRef.setInput('feedback', 'incorrect');
    fixture.detectChanges();

    expect(component.optionClass(1)).toContain('incorrect');
  });

  it('should have hasAudioFile false when audioUrl is empty', () => {
    expect(component.hasAudioFile()).toBe(false);
  });

  it('should have hasAudioFile true when audioUrl is set', () => {
    const cardWithAudio: SoundCard = {
      ...card,
      audioUrl: 'https://example.com/audio.mp3',
    };
    fixture.componentRef.setInput('card', cardWithAudio);
    fixture.detectChanges();

    expect(component.hasAudioFile()).toBe(true);
  });

  it('should use promptLexeme for stimulusLexeme when available', () => {
    const cardWithLexeme: SoundCard = {
      ...card,
      promptLexeme: { primary: '你好', script: 'hani' },
    };
    fixture.componentRef.setInput('card', cardWithLexeme);
    fixture.detectChanges();

    const stim = component.stimulusLexeme();
    expect(stim.primary).toBe('你好');
    expect(stim.script).toBe('hani');
  });

  it('should construct stimulusLexeme from audioLabelLearning when promptLexeme is absent', () => {
    const cardWithoutLexeme: SoundCard = {
      ...card,
      promptLexeme: undefined,
    };
    fixture.componentRef.setInput('card', cardWithoutLexeme);
    fixture.detectChanges();

    expect(component.stimulusLexeme()).toEqual({ primary: 'ni hao', script: 'latn' });
  });

  it('should resolve card with reversed direction', () => {
    const reversedCard: SoundCard = {
      ...card,
      direction: 'learning-to-known',
      promptKnown: 'What do you hear?',
      optionsKnown: ['Hello', 'Bye', 'Thanks'],
    };

    fixture.componentRef.setInput('card', reversedCard);
    fixture.detectChanges();

    expect(component.resolved().prompt).toBe('What do you hear?');
  });
});

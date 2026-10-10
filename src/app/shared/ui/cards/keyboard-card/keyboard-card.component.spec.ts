import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { KeyboardCard } from '../../../../core/models';
import { KeyboardCardComponent } from './keyboard-card.component';

describe('KeyboardCardComponent', () => {
  const card: KeyboardCard = {
    id: 'keyboard-1',
    kind: 'keyboard',
    title: 'Введи ответ',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Как будет "привет" по-китайски?',
    acceptedAnswersKnown: ['你好', 'nihao'],
  };

  let fixture: ComponentFixture<KeyboardCardComponent>;
  let component: KeyboardCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyboardCardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyboardCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve resolvedPrompt', () => {
    // For known-to-learning direction, resolvedPrompt uses acceptedAnswersKnown[0]
    expect(component.resolvedPrompt()).toBe('你好');
  });

  it('should resolve promptLexeme', () => {
    // promptLexeme is derived from the card's promptLexeme
    // For cards without promptLexeme, it returns undefined
    expect(component.promptLexeme()).toBeUndefined();
  });

  it('should resolve promptLexeme when card.promptLexeme is set', () => {
    const cardWithLexeme: KeyboardCard = {
      ...card,
      promptLexeme: { primary: '你好', script: 'hani' },
    };
    fixture.componentRef.setInput('card', cardWithLexeme);
    fixture.detectChanges();

    expect(component.promptLexeme()).toEqual({ primary: '你好', script: 'hani' });
  });

  it('should return correctLabel', () => {
    const label = component.correctLabel();
    expect(label).toBeDefined();
  });

  it('should have answerMode resolved from card', () => {
    expect(component.answerMode()).toBeDefined();
  });

  it('should have usesIpaInput false for default mode', () => {
    expect(component.usesIpaInput()).toBe(false);
  });

  it('should have usesPinyinKeyboard true when accepted answers contain pinyin', () => {
    // Default answerMode is 'auto' which detects pinyin in accepted answers
    // 'nihao' looks like pinyin
    expect(component.usesPinyinKeyboard()).toBe(true);
  });

  it('should have usesIpaInput true when answerMode is ipa', () => {
    const ipaCard: KeyboardCard = {
      ...card,
      answerMode: 'ipa',
    };
    fixture.componentRef.setInput('card', ipaCard);
    fixture.detectChanges();

    expect(component.usesIpaInput()).toBe(true);
    expect(component.usesPinyinKeyboard()).toBe(false);
  });

  it('should have usesPinyinKeyboard true when answerMode is pinyin', () => {
    const pinyinCard: KeyboardCard = {
      ...card,
      answerMode: 'pinyin',
    };
    fixture.componentRef.setInput('card', pinyinCard);
    fixture.detectChanges();

    expect(component.usesPinyinKeyboard()).toBe(true);
    expect(component.usesIpaInput()).toBe(false);
  });

  it('should resolve card with reversed direction', () => {
    const reversedCard: KeyboardCard = {
      ...card,
      direction: 'learning-to-known',
      promptKnown: 'Как сказать привет по-китайски?',
    };

    fixture.componentRef.setInput('card', reversedCard);
    fixture.detectChanges();

    // For learning-to-known, resolvedPrompt uses extractQuotedLemma or promptLexeme
    expect(component.resolvedPrompt()).toBeDefined();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MediaCardFormComponent } from './media-card-form.component';
import type { SoundCardDraft } from '../../../../types';
import { emptyLexemeCardDraft, emptyOptionLexemes } from '../../../../types';

describe('MediaCardFormComponent', () => {
  let component: MediaCardFormComponent;
  let fixture: ComponentFixture<MediaCardFormComponent>;

  const emptyLexeme = emptyLexemeCardDraft();
  const emptyLexemes = emptyOptionLexemes(2);

  const soundDraft: SoundCardDraft = {
    kind: 'sound',
    title: 'Audio Test',
    promptKnown: 'Listen',
    audioLabelLearning: 'Hello',
    audioLabelLexeme: emptyLexeme.promptLexeme,
    optionsKnown: ['Привет', 'Пока'],
    optionsLexemes: emptyLexemes,
    correctIndex: 0,
    direction: 'known-to-learning',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    ...emptyLexeme,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaCardFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaCardFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', soundDraft);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('inputs', () => {
    it('should have required draft input', () => {
      expect(component.draft).toBeDefined();
    });

    it('should have knownLanguage input with default', () => {
      expect(component.knownLanguage).toBeDefined();
    });

    it('should have learningLanguage input with default', () => {
      expect(component.learningLanguage).toBeDefined();
    });

    it('should have isAdvanced input with default false', () => {
      expect(component.isAdvanced).toBeDefined();
    });
  });

  describe('outputs', () => {
    it('should have draftChange output', () => {
      expect(component.draftChange).toBeDefined();
    });
  });

  describe('updateDraft', () => {
    it('should emit draftChange', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      const newDraft = { ...soundDraft, title: 'Updated' };
      component.updateDraft(newDraft);
      expect(spy).toHaveBeenCalledWith(newDraft);
    });
  });

  describe('updateAudioLabelLearning', () => {
    it('should emit updated draft with new audio label learning', () => {
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateAudioLabelLearning('Bonjour');
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ audioLabelLearning: 'Bonjour' }));
    });

    it('should also sync audioLabelLexeme in basic mode', () => {
      fixture.componentRef.setInput('isAdvanced', false);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateAudioLabelLearning('Bonjour');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          audioLabelLearning: 'Bonjour',
          audioLabelLexeme: expect.any(Object),
        }),
      );
    });

    it('should not sync audioLabelLexeme in advanced mode', () => {
      fixture.componentRef.setInput('isAdvanced', true);
      const spy = vi.spyOn(component.draftChange, 'emit');
      component.updateAudioLabelLearning('Bonjour');
      const callArg = spy.mock.calls[0][0] as SoundCardDraft;
      expect(callArg.audioLabelLearning).toBe('Bonjour');
    });
  });
});

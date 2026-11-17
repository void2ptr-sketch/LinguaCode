import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CardFormContentTabComponent } from './card-form-content-tab.component';
import type { CardDraft } from '../../types';

const createBaseDraft = (kind: CardDraft['kind']): CardDraft =>
  ({
    kind,
    title: 'Test',
    direction: 'known-to-learning' as const,
    promptKnown: 'Q?',
    optionsLearning: ['A', 'B'],
    optionsKnown: ['A', 'B'],
    optionsLexemes: [],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptLexeme: {
      primary: '',
      script: 'latn',
      pinyin: '',
      zhuyin: '',
      palladius: '',
      ipa: '',
      audioUrl: '',
      acceptedReadings: '',
    },
    audioUrl: '',
  }) as CardDraft;

@Component({
  selector: 'app-host',
  standalone: true,
  imports: [CardFormContentTabComponent],
  template: ` <app-card-form-content-tab [draft]="draft" (draftChange)="onDraftChange($event)" /> `,
})
class HostComponent {
  draft: CardDraft = createBaseDraft('select');
  onDraftChange: (_v: CardDraft) => void = vi.fn();
}

describe('CardFormContentTabComponent', () => {
  let hostFixture: import('@angular/core/testing').ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: CardFormContentTabComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent, CardFormContentTabComponent],
    });

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();

    component = hostFixture.debugElement.children[0].componentInstance;
  });

  it('should have draft input', () => {
    expect(component.draft).toBeDefined();
  });

  it('should have draftChange output', () => {
    expect(component.draftChange).toBeDefined();
  });

  it('should render the title field', () => {
    const text = hostFixture.nativeElement.textContent || '';
    expect(text).toContain('Заголовок');
  });

  it('should expose promptKnown for kinds with the field', () => {
    host.draft = createBaseDraft('select');
    hostFixture.detectChanges();
    expect(component.promptKnown()).toBe('Q?');
  });

  it('should return null promptKnown for code-select', () => {
    host.draft = createBaseDraft('code-select');
    hostFixture.detectChanges();
    expect(component.promptKnown()).toBeNull();
  });

  it('should expose codePrompt for code-select', () => {
    host.draft = {
      ...createBaseDraft('code-select'),
      caption: 'Caption',
      prompt: { code: 'const x = 1;', language: 'typescript' },
    } as CardDraft;
    hostFixture.detectChanges();
    expect(component.codePrompt()).toEqual({ code: 'const x = 1;', language: 'typescript' });
  });

  it('should expose codePrompt for code-trace', () => {
    host.draft = {
      ...createBaseDraft('code-trace'),
      caption: 'Caption',
      question: 'What?',
      code: { code: 'print(1)', language: 'python' },
      outputOptions: ['1', '2'],
    } as unknown as CardDraft;
    hostFixture.detectChanges();
    expect(component.codePrompt()).toEqual({ code: 'print(1)', language: 'python' });
  });

  it('should expose toneDraft for tone kind', () => {
    host.draft = {
      ...createBaseDraft('tone'),
      syllableBase: 'ma',
      toneOptions: [1, 2, 3, 4],
    } as unknown as CardDraft;
    hostFixture.detectChanges();
    expect(component.toneDraft()?.syllableBase).toBe('ma');
  });

  it('should expose drawDraft for draw kind', () => {
    host.draft = {
      ...createBaseDraft('draw'),
      referenceHintKnown: 'hint',
      targetCharacter: '永',
      radicalHint: '',
      strokeGuides: [],
    } as unknown as CardDraft;
    hostFixture.detectChanges();
    expect(component.drawDraft()?.referenceHintKnown).toBe('hint');
  });

  it('should emit title on updateTitle', () => {
    host.draft = createBaseDraft('select');
    hostFixture.detectChanges();
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updateTitle('New Title');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
  });

  it('should emit promptKnown on updatePromptKnown for select', () => {
    host.draft = createBaseDraft('select');
    hostFixture.detectChanges();
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updatePromptKnown('New Prompt');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ promptKnown: 'New Prompt' }));
  });

  it('should not emit promptKnown for code-select', () => {
    host.draft = createBaseDraft('code-select');
    hostFixture.detectChanges();
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updatePromptKnown('New Prompt');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should update code prompt for code-select', () => {
    host.draft = {
      ...createBaseDraft('code-select'),
      caption: '',
      prompt: { code: 'old', language: 'javascript' },
    } as CardDraft;
    hostFixture.detectChanges();
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updateCode('new');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: { code: 'new', language: 'javascript' } }),
    );
  });

  it('should update syllable base for tone', () => {
    host.draft = {
      ...createBaseDraft('tone'),
      syllableBase: 'ma',
      toneOptions: [1, 2, 3, 4],
    } as unknown as CardDraft;
    hostFixture.detectChanges();
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updateSyllableBase('ba');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ syllableBase: 'ba' }));
  });

  it('should update reference hint for draw', () => {
    host.draft = {
      ...createBaseDraft('draw'),
      referenceHintKnown: 'old',
      targetCharacter: '永',
      radicalHint: '',
      strokeGuides: [],
    } as unknown as CardDraft;
    hostFixture.detectChanges();
    const spy = vi.spyOn(component.draftChange, 'emit');
    component.updateReferenceHintKnown('new');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ referenceHintKnown: 'new' }));
  });
});

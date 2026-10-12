import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { describe, expect, it } from 'vitest';

import { CardCreateWizardComponent } from './card-create-wizard.component';
import { ChoiceCardFormComponent } from '../card-form/kind-forms/choice-card-form/choice-card-form.component';
import { InputCardFormComponent } from '../card-form/kind-forms/input-card-form/input-card-form.component';
import { MediaCardFormComponent } from '../card-form/kind-forms/media-card-form/media-card-form.component';
import { PairsCardFormComponent } from '../card-form/kind-forms/pairs-card-form/pairs-card-form.component';
import type { ChoiceCardDraft } from '../card-form/kind-forms/choice-card-form/choice-card-form.component';
import type { CardAppearanceDraft } from '../../types';
import type { CardDirection } from '../../../../entities/language-pair/model/language-pair.types';

@Component({
  standalone: true,
  imports: [CardCreateWizardComponent],
  template: `<app-card-create-wizard
    [draft]="draft"
    (draftChange)="onDraftChange($event)"
    (expandToFull)="onExpand()"
  />`,
})
class TestHostComponent {
  draft: ChoiceCardDraft = {
    kind: 'select',
    title: 'Test Card',
    promptKnown: 'Hint text',
    optionsKnown: ['Option A', 'Option B'],
    optionsLearning: ['Вариант А', 'Вариант Б'],
    optionsLexemes: [
      {
        primary: 'Option A',
        script: 'latn',
        pinyin: '',
        zhuyin: '',
        palladius: '',
        ipa: '',
        audioUrl: '',
        acceptedReadings: '',
      },
      {
        primary: 'Option B',
        script: 'latn',
        pinyin: '',
        zhuyin: '',
        palladius: '',
        ipa: '',
        audioUrl: '',
        acceptedReadings: '',
      },
    ],
    correctIndex: 0,
    direction: 'kl' as CardDirection,
    appearance: {} as CardAppearanceDraft,
    promptLexeme: {
      primary: '测试',
      script: 'hani',
      pinyin: '',
      zhuyin: '',
      palladius: '',
      ipa: '',
      audioUrl: '',
      acceptedReadings: '',
    },
    audioUrl: '',
  };
  draftChangeValue: unknown = null;
  expandCount = 0;

  onDraftChange(event: unknown): void {
    this.draftChangeValue = event;
  }

  onExpand(): void {
    this.expandCount++;
  }
}

describe('CardCreateWizardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatStepperModule,
        ChoiceCardFormComponent,
        InputCardFormComponent,
        MediaCardFormComponent,
        PairsCardFormComponent,
      ],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.card-create-wizard')).toBeTruthy();
  });

  it('should show kind label from draft', () => {
    const paragraph = fixture.nativeElement.querySelector('.card-create-wizard__intro');
    // Kind labels are in Russian (e.g., "Выбор ответа" for select)
    expect(paragraph.textContent).toContain('Быстрое создание');
  });

  it('should render title input with draft title', () => {
    const titleInput = fixture.nativeElement.querySelector('mat-form-field input[matInput]');
    expect(titleInput.value).toBe('Test Card');
  });

  it('should render prompt textarea with draft promptKnown', () => {
    const textarea = fixture.nativeElement.querySelector('textarea[matInput]');
    expect(textarea.value).toBe('Hint text');
  });

  it('should emit expandToFull when expand button is clicked', () => {
    const expandButtons = fixture.nativeElement.querySelectorAll('button[type="button"]');
    const expandButton = Array.from(expandButtons).find((btn: unknown) => {
      const button = btn as HTMLElement;
      return button.textContent?.includes('Расширить');
    });
    expect(expandButton).toBeDefined();
    if (expandButton) {
      (expandButton as HTMLElement).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.expandCount).toBe(1);
    }
  });

  it('should have mat-stepper element', () => {
    const stepper = fixture.nativeElement.querySelector('mat-stepper');
    expect(stepper).toBeTruthy();
  });

  it('should have stepper step content', () => {
    // Angular Material stepper renders steps as divs with mat-step-content class
    const stepContents = fixture.nativeElement.querySelectorAll('[class*="step"]');
    expect(stepContents.length).toBeGreaterThan(0);
  });

  describe('updateDraft', () => {
    it('should emit draftChange when draft is updated', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      const newDraft = {
        ...fixture.componentInstance.draft,
        title: 'Updated Title',
      } as ChoiceCardDraft;
      wizardComponent.updateDraft(newDraft);
      fixture.detectChanges();

      expect(fixture.componentInstance.draftChangeValue).toEqual(newDraft);
    });
  });

  describe('updateTitle', () => {
    it('should emit updated draft with new title', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      wizardComponent.updateTitle('New Title');
      fixture.detectChanges();

      expect(fixture.componentInstance.draftChangeValue).toEqual({
        ...fixture.componentInstance.draft,
        title: 'New Title',
      });
    });
  });

  describe('updatePromptKnown', () => {
    it('should emit updated draft with new promptKnown for choice cards', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      wizardComponent.updatePromptKnown('New Hint');
      fixture.detectChanges();

      expect(fixture.componentInstance.draftChangeValue).toEqual({
        ...fixture.componentInstance.draft,
        promptKnown: 'New Hint',
      });
    });
  });

  describe('computed properties', () => {
    it('should have kindGroup computed', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      expect(wizardComponent.kindGroup()).toBeDefined();
    });

    it('should have variantHint computed', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      expect(wizardComponent.variantHint()).toBeDefined();
    });

    it('should have hasPrompt computed returning true for choice cards', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      expect(wizardComponent.hasPrompt()).toBe(true);
    });

    it('should have choiceDraft computed returning draft for choice kind', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      expect(wizardComponent.choiceDraft()).toBeTruthy();
    });

    it('should have inputDraft computed returning null for non-input kind', () => {
      const wizardComponent = fixture.debugElement.children[0].componentInstance;
      expect(wizardComponent.inputDraft()).toBeNull();
    });
  });
});

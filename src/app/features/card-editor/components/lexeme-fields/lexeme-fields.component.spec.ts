import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it, vi } from 'vitest';

import { LexemeFieldsComponent } from './lexeme-fields.component';
import type { LexemeDraftFields } from '../../../../core/data/chinese/lexeme-draft.utils';
import type { ContentLanguage } from '../../../../core/models';

describe('LexemeFieldsComponent', () => {
  let fixture: ComponentFixture<LexemeFieldsComponent>;
  let component: LexemeFieldsComponent;

  const defaultFields: LexemeDraftFields = {
    primary: '你好',
    pinyin: 'nǐ hǎo',
    palladius: 'ни хао',
    ipa: '/ni xɑʊ/',
    zhuyin: 'ㄋㄧˇ ㄏㄠˇ',
    acceptedReadings: '',
    script: 'hani',
    audioUrl: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LexemeFieldsComponent,
        FormsModule,
        MatButtonModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
      ],
    });
    fixture = TestBed.createComponent(LexemeFieldsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component).toBeDefined();
  });

  it('should render lexeme section', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.lexeme-fields');
    expect(section).toBeDefined();
  });

  it('should have default label', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.lexeme-fields__title');
    expect(title?.textContent).toBe('Лексема');
  });

  it('should render custom label', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('label', 'Промпт');
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.lexeme-fields__title');
    expect(title?.textContent).toBe('Промпт');
  });

  it('should apply compact class when compact is true', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.lexeme-fields');
    expect(section?.classList).toContain('lexeme-fields--compact');
  });

  it('should not apply compact class when compact is false', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('compact', false);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('.lexeme-fields');
    expect(section?.classList).not.toContain('lexeme-fields--compact');
  });

  it('should expose scriptOptions', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.scriptOptions).toBeDefined();
    expect(component.scriptOptions).toHaveLength(2);
    expect(component.scriptOptions[0].value).toBe('latn');
    expect(component.scriptOptions[1].value).toBe('hani');
  });

  it('should not be pairScoped when languages are null', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.pairScoped()).toBe(false);
  });

  it('should be pairScoped when both languages are set', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'en' as ContentLanguage);
    fixture.detectChanges();
    expect(component.pairScoped()).toBe(true);
  });

  it('should not be ruZhPair for non-Russian-Chinese', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'en' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'zh' as ContentLanguage);
    fixture.detectChanges();
    expect(component.ruZhPair()).toBe(false);
  });

  it('should be ruZhPair for Russian-Chinese', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'ru' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'zh' as ContentLanguage);
    fixture.detectChanges();
    expect(component.ruZhPair()).toBe(true);
  });

  it('should not be enLearningPair for non-English-learning', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'ru' as ContentLanguage);
    fixture.detectChanges();
    expect(component.enLearningPair()).toBe(false);
  });

  it('should be enLearningPair for English-learning', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'en' as ContentLanguage);
    fixture.detectChanges();
    expect(component.enLearningPair()).toBe(true);
  });

  it('should show legacy layout when not pairScoped', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.showLegacyLayout()).toBe(true);
  });

  it('should not show legacy layout when pairScoped', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'en' as ContentLanguage);
    fixture.detectChanges();
    expect(component.showLegacyLayout()).toBe(false);
  });

  it('should show pinyin in legacy layout', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.showPinyin()).toBe(true);
  });

  it('should show pinyin for ruZh pair', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'ru' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'zh' as ContentLanguage);
    fixture.detectChanges();
    expect(component.showPinyin()).toBe(true);
  });

  it('should show palladius in legacy layout', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.showPalladius()).toBe(true);
  });

  it('should show IPA in legacy layout', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.showIpa()).toBe(true);
  });

  it('should show IPA for English-learning pair', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'en' as ContentLanguage);
    fixture.detectChanges();
    expect(component.showIpa()).toBe(true);
  });

  it('should show script only in legacy layout', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.showScript()).toBe(true);
  });

  it('should not show script when pairScoped', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'en' as ContentLanguage);
    fixture.detectChanges();
    expect(component.showScript()).toBe(false);
  });

  it('should show advanced panel when pairScoped and not legacy', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.componentRef.setInput('knownLanguage', 'zh' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'en' as ContentLanguage);
    fixture.detectChanges();
    expect(component.showAdvancedPanel()).toBe(true);
  });

  it('should not show advanced panel in legacy layout', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    expect(component.showAdvancedPanel()).toBe(false);
  });

  it('should updateField emit change', () => {
    fixture.componentRef.setInput('fields', defaultFields);
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.updateField('pinyin', '新 пиньинь');

    expect(spy).toHaveBeenCalledWith({ ...defaultFields, pinyin: '新 пиньинь' });
  });

  it('should updatePrimary emit change with auto-detected script', () => {
    fixture.componentRef.setInput('fields', { ...defaultFields, primary: '', script: undefined as unknown as 'latn' });
    fixture.componentRef.setInput('knownLanguage', 'ru' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'zh' as ContentLanguage);
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.updatePrimary('测试');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as LexemeDraftFields;
    expect(emitted.primary).toBe('测试');
  });

  it('should updatePrimary without changing script if already set', () => {
    fixture.componentRef.setInput('fields', { ...defaultFields, primary: '你好', script: 'hani' });
    fixture.componentRef.setInput('knownLanguage', 'ru' as ContentLanguage);
    fixture.componentRef.setInput('learningLanguage', 'zh' as ContentLanguage);
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.updatePrimary('世界');

    expect(spy).toHaveBeenCalled();
    const emitted = spy.mock.lastCall?.[0] as LexemeDraftFields;
    expect(emitted.script).toBe('hani');
  });

  it('should fillPalladiusFromPinyin emit change', () => {
    fixture.componentRef.setInput('fields', { ...defaultFields, pinyin: 'ni hao' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.fillPalladiusFromPinyin();

    expect(spy).toHaveBeenCalled();
  });

  it('should not fillPalladiusFromPinyin when pinyin is empty', () => {
    fixture.componentRef.setInput('fields', { ...defaultFields, pinyin: '' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.fillPalladiusFromPinyin();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should fillIpaFromPinyin emit change', () => {
    fixture.componentRef.setInput('fields', { ...defaultFields, pinyin: 'ni hao' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.fillIpaFromPinyin();

    expect(spy).toHaveBeenCalled();
  });

  it('should not fillIpaFromPinyin when pinyin is empty', () => {
    fixture.componentRef.setInput('fields', { ...defaultFields, pinyin: '' });
    fixture.detectChanges();
    const spy = vi.fn();
    component.fieldsChange.subscribe(spy);

    component.fillIpaFromPinyin();

    expect(spy).not.toHaveBeenCalled();
  });
});

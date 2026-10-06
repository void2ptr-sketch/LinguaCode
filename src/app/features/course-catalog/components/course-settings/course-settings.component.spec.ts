import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import type { ToneMark } from '../../../../core/models/phonetic-content.types';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../../core/models/phonetic-content.types';
import type { ContentLanguage, UserLanguagePairEntry } from '../../../../core/models';
import { CourseCatalogSettingsComponent } from './course-settings.component';

function makePair(id: string, known: ContentLanguage, learning: ContentLanguage): UserLanguagePairEntry {
  return {
    id,
    pair: { known, learning },
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('CourseCatalogSettingsComponent', () => {
  let fixture: ComponentFixture<CourseCatalogSettingsComponent>;
  let component: CourseCatalogSettingsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCatalogSettingsComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseCatalogSettingsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('languagePairs', [makePair('pair-1', 'ru', 'en')]);
    fixture.componentRef.setInput('displayRomanizationsDraft', ['pinyin']);
    fixture.componentRef.setInput('answerRomanizationsDraft', ['pinyin', 'palladius']);
    fixture.componentRef.setInput('showIpaDraft', false);
    fixture.componentRef.setInput('ipaVariantLabelDraft', '');
    fixture.componentRef.setInput('answerModesDraft', ['orthography']);
    fixture.componentRef.setInput('toneColorEnabledDraft', false);
    fixture.componentRef.setInput('toneColorSchemeDraft', 'classic');
    fixture.componentRef.setInput('tracingStrokeDurationDraft', TRACING_STROKE_DURATION_BOUNDS.defaultSec);
    fixture.componentRef.setInput('romanizationOptions', []);
    fixture.componentRef.setInput('showCjkPreferences', false);
    fixture.componentRef.setInput('showPhoneticPreferences', false);
    fixture.componentRef.setInput('showTracingSettings', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render settings section', () => {
    const section = fixture.nativeElement.querySelector('.page-card__section');
    expect(section).toBeTruthy();
  });

  it('should render section title', () => {
    const title = fixture.nativeElement.querySelector('.page-card__section-title');
    expect(title?.textContent?.trim()).toBe('Настройка курса');
  });

  it('should render course label', () => {
    const label = fixture.nativeElement.querySelector('.settings-course-label__text');
    expect(label?.textContent?.trim()).toContain('Настройки для:');
  });

  it('should compute settingsEntry for selected pair', () => {
    const entry = component.languagePairs().find((p) => p.id === 'pair-1');
    expect(entry).toBeTruthy();
  });

  it('should compute settingsCourseLabel from entry', () => {
    const label = component.settingsCourseLabel();
    expect(typeof label).toBe('string');
  });

  it('should hide display settings when both CJK and phonetic are disabled', () => {
    fixture.componentRef.setInput('showCjkPreferences', false);
    fixture.componentRef.setInput('showPhoneticPreferences', false);
    fixture.detectChanges();

    const matrix = fixture.nativeElement.querySelector('app-course-display-settings-matrix');
    expect(matrix).toBeNull();
  });

  it('should show display settings when CJK preferences enabled', () => {
    fixture.componentRef.setInput('showCjkPreferences', true);
    fixture.detectChanges();

    const matrix = fixture.nativeElement.querySelector('app-course-display-settings-matrix');
    expect(matrix).toBeTruthy();
  });

  it('should show display settings when phonetic preferences enabled', () => {
    fixture.componentRef.setInput('showPhoneticPreferences', true);
    fixture.detectChanges();

    const matrix = fixture.nativeElement.querySelector('app-course-display-settings-matrix');
    expect(matrix).toBeTruthy();
  });

  it('should hide tone color section when CJK preferences disabled', () => {
    fixture.componentRef.setInput('showCjkPreferences', false);
    fixture.detectChanges();

    const toneSection = fixture.nativeElement.querySelector('.page-card__tone-colors');
    expect(toneSection).toBeNull();
  });

  it('should show tone color section when CJK preferences enabled', () => {
    fixture.componentRef.setInput('showCjkPreferences', true);
    fixture.detectChanges();

    const toneSection = fixture.nativeElement.querySelector('.page-card__tone-colors');
    expect(toneSection).toBeTruthy();
  });

  it('should hide tracing section when tracing settings disabled', () => {
    fixture.componentRef.setInput('showTracingSettings', false);
    fixture.detectChanges();

    const tracingSection = fixture.nativeElement.querySelector('.page-card__tracing-speed');
    expect(tracingSection).toBeNull();
  });

  it('should show tracing section when tracing settings enabled', () => {
    fixture.componentRef.setInput('showTracingSettings', true);
    fixture.detectChanges();

    const tracingSection = fixture.nativeElement.querySelector('.page-card__tracing-speed');
    expect(tracingSection).toBeTruthy();
  });

  it('should format tracing duration with one decimal place', () => {
    const formatted = component.formatTracingDurationSec(0.5);
    expect(formatted).toBe('0.5 с');
  });

  it('should format tracing duration with two decimal places when needed', () => {
    const formatted = component.formatTracingDurationSec(1.25);
    expect(formatted).toBe('1.3 с');
  });

  it('should return hint for classic tone color scheme', () => {
    fixture.componentRef.setInput('toneColorSchemeDraft', 'classic');
    fixture.detectChanges();
    const hint = component.toneColorSchemeHint();
    expect(typeof hint).toBe('string');
    expect(hint.length).toBeGreaterThan(0);
  });

  it('should return color for classic tone color scheme', () => {
    fixture.componentRef.setInput('toneColorSchemeDraft', 'classic');
    fixture.detectChanges();
    const color = component.tonePreviewColor(1 as ToneMark);
    expect(typeof color).toBe('string');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should have correct tracing duration bounds', () => {
    expect(component.tracingDurationMin).toBe(TRACING_STROKE_DURATION_BOUNDS.minSec);
    expect(component.tracingDurationMax).toBe(TRACING_STROKE_DURATION_BOUNDS.maxSec);
    expect(component.tracingDurationStep).toBe(TRACING_STROKE_DURATION_BOUNDS.stepSec);
  });

  it('should have tone preview marks array', () => {
    expect(component.tonePreviewMarks).toEqual([1, 2, 3, 4, 5]);
  });

  it('should return correct entry label', () => {
    const entry = makePair('pair-1', 'ru', 'en');
    const label = component.entryLabel(entry);
    expect(label).toBe('ru → en');
  });
});

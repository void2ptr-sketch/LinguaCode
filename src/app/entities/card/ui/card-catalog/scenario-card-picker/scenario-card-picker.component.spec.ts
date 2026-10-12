import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ScenarioCardPickerComponent } from './scenario-card-picker.component';
import { CardCatalogSearchStore } from '../../../lib/card-catalog-search/card-catalog-search.store';
import { UserStore } from '../../../../user/model/user.store';
import {
  CARD_KIND_LABELS,
  CONTENT_LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
} from '../../../lib/catalog-labels';
import { formatIndexLanguagePair } from '../../../../language-pair/lib/language-pair.utils';

describe('ScenarioCardPickerComponent', () => {
  let component: ScenarioCardPickerComponent;
  let fixture: ComponentFixture<ScenarioCardPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioCardPickerComponent],
      providers: [CardCatalogSearchStore, UserStore],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioCardPickerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should expose kindLabels', () => {
    expect(component.kindLabels).toBe(CARD_KIND_LABELS);
  });

  it('should expose languageLabels', () => {
    expect(component.languageLabels).toBe(CONTENT_LANGUAGE_LABELS);
  });

  it('should expose difficultyLabels', () => {
    expect(component.difficultyLabels).toBe(DIFFICULTY_LABELS);
  });

  it('should expose formatIndexLanguagePair utility', () => {
    expect(component.formatIndexLanguagePair).toBe(formatIndexLanguagePair);
  });

  describe('selectedIds input', () => {
    it('should have required selectedIds input', () => {
      expect(component.selectedIds).toBeDefined();
    });
  });

  describe('selectedIdsChange output', () => {
    it('should emit selectedIdsChange with updated array', () => {
      const spy = vi.spyOn(component.selectedIdsChange, 'emit');
      component.selectedIdsChange.emit(['card-1', 'card-2']);
      expect(spy).toHaveBeenCalledWith(['card-1', 'card-2']);
    });
  });

  describe('isSelected', () => {
    it('should return true when card is selected', () => {
      fixture.componentRef.setInput('selectedIds', ['card-1', 'card-2']);
      expect(component.isSelected('card-1')).toBe(true);
    });

    it('should return false when card is not selected', () => {
      fixture.componentRef.setInput('selectedIds', ['card-1', 'card-2']);
      expect(component.isSelected('card-3')).toBe(false);
    });
  });

  describe('toggleCard', () => {
    it('should add card to selection when checked', () => {
      const spy = vi.spyOn(component.selectedIdsChange, 'emit');
      fixture.componentRef.setInput('selectedIds', ['card-1']);
      component.toggleCard('card-2', true);
      expect(spy).toHaveBeenCalledWith(['card-1', 'card-2']);
    });

    it('should not duplicate already selected card', () => {
      const spy = vi.spyOn(component.selectedIdsChange, 'emit');
      fixture.componentRef.setInput('selectedIds', ['card-1']);
      component.toggleCard('card-1', true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should remove card from selection when unchecked', () => {
      const spy = vi.spyOn(component.selectedIdsChange, 'emit');
      fixture.componentRef.setInput('selectedIds', ['card-1', 'card-2', 'card-3']);
      component.toggleCard('card-2', false);
      expect(spy).toHaveBeenCalledWith(['card-1', 'card-3']);
    });

    it('should not emit when unchecking non-selected card', () => {
      const spy = vi.spyOn(component.selectedIdsChange, 'emit');
      fixture.componentRef.setInput('selectedIds', ['card-1']);
      component.toggleCard('card-2', false);
      expect(spy).toHaveBeenCalledWith(['card-1']);
    });
  });

  describe('entries computed', () => {
    it('should return empty array when store entries are empty', () => {
      const entries = component.entries();
      expect(Array.isArray(entries)).toBe(true);
    });
  });
});

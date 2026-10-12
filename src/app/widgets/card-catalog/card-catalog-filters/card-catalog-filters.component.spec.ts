import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CardCatalogFiltersComponent } from './card-catalog-filters.component';
import { CardCatalogSearchStore } from '../../../entities/card/lib/card-catalog-search/card-catalog-search.store';
import { DIFFICULTIES, DIFFICULTY_LABELS, CARD_KIND_LABELS } from '../../../entities/card/lib/catalog-labels';

describe('CardCatalogFiltersComponent', () => {
  let component: CardCatalogFiltersComponent;
  let store: CardCatalogSearchStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardCatalogFiltersComponent],
      providers: [CardCatalogSearchStore],
    }).compileComponents();

    store = TestBed.inject(CardCatalogSearchStore);
    component = TestBed.createComponent(CardCatalogFiltersComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject CardCatalogSearchStore', () => {
    expect(component.store).toBe(store);
  });

  it('should expose difficulties constant', () => {
    expect(component.difficulties).toBe(DIFFICULTIES);
  });

  it('should expose difficultyLabels constant', () => {
    expect(component.difficultyLabels).toBe(DIFFICULTY_LABELS);
  });

  it('should expose kindLabels constant', () => {
    expect(component.kindLabels).toBe(CARD_KIND_LABELS);
  });

  it('should expose tagLabel utility', () => {
    expect(typeof component.tagLabel).toBe('function');
    expect(component.tagLabel('test-tag')).toBe('test-tag');
  });

  describe('facets computed', () => {
    it('should return null when store facets are empty', () => {
      const facets = component.facets();
      expect(facets).toBeNull();
    });
  });

  describe('tagGroups computed', () => {
    it('should return empty array when facets are null', () => {
      const tagGroups = component.tagGroups();
      expect(Array.isArray(tagGroups)).toBe(true);
      expect(tagGroups.length).toBe(0);
    });
  });

  describe('onQueryInput', () => {
    it('should call store.setQuery with the provided value', () => {
      const spy = vi.spyOn(store, 'setQuery');
      component.onQueryInput('test query');
      expect(spy).toHaveBeenCalledWith('test query');
    });
  });

  describe('onDifficultyChange', () => {
    it('should call store.setDifficulty with the provided value', () => {
      const spy = vi.spyOn(store, 'setDifficulty');
      component.onDifficultyChange('beginner');
      expect(spy).toHaveBeenCalledWith('beginner');
    });

    it('should call store.setDifficulty with null', () => {
      const spy = vi.spyOn(store, 'setDifficulty');
      component.onDifficultyChange(null);
      expect(spy).toHaveBeenCalledWith(null);
    });
  });

  describe('onCourseChange', () => {
    it('should call store.setCourse with the provided courseId', async () => {
      const spy = vi.spyOn(store, 'setCourse').mockResolvedValue(undefined);
      await component.onCourseChange('course-123');
      expect(spy).toHaveBeenCalledWith('course-123');
    });
  });

  describe('onLessonChange', () => {
    it('should call store.setLesson with the provided lessonId', async () => {
      const spy = vi.spyOn(store, 'setLesson').mockResolvedValue(undefined);
      await component.onLessonChange('lesson-456');
      expect(spy).toHaveBeenCalledWith('lesson-456');
    });
  });

  describe('onScenarioChange', () => {
    it('should call store.setScenario with the provided scenarioId', () => {
      const spy = vi.spyOn(store, 'setScenario');
      component.onScenarioChange('scenario-789');
      expect(spy).toHaveBeenCalledWith('scenario-789');
    });
  });

  describe('isKindSelected', () => {
    it('should return true when kind is in selectedKinds', () => {
      store.selectedKinds.set(['select', 'keyboard']);
      expect(component.isKindSelected('select')).toBe(true);
    });

    it('should return false when kind is not in selectedKinds', () => {
      store.selectedKinds.set(['select']);
      expect(component.isKindSelected('keyboard')).toBe(false);
    });
  });

  describe('isTagSelected', () => {
    it('should return true when tag is in selectedTags', () => {
      store.selectedTags.set(['theme-1', 'tag-2']);
      expect(component.isTagSelected('theme-1')).toBe(true);
    });

    it('should return false when tag is not in selectedTags', () => {
      store.selectedTags.set(['theme-1']);
      expect(component.isTagSelected('tag-2')).toBe(false);
    });
  });

  describe('toggleKind', () => {
    it('should call store.toggleKind with the provided kind', () => {
      const spy = vi.spyOn(store, 'toggleKind');
      component.toggleKind('select');
      expect(spy).toHaveBeenCalledWith('select');
    });
  });

  describe('toggleTag', () => {
    it('should call store.toggleTag with the provided tag', () => {
      const spy = vi.spyOn(store, 'toggleTag');
      component.toggleTag('my-tag');
      expect(spy).toHaveBeenCalledWith('my-tag');
    });
  });

  describe('clearFilters', () => {
    it('should call store.clearFilters', () => {
      const spy = vi.spyOn(store, 'clearFilters');
      component.clearFilters();
      expect(spy).toHaveBeenCalled();
    });
  });
});

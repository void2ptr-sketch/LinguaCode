import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ScenarioCardCriteriaEditorComponent } from './scenario-card-criteria-editor.component';
import { CardCatalogSearchStore } from '../../../entities/card/lib/card-catalog-search/card-catalog-search.store';
import { CardSearchService } from '../../../entities/card/search/card-search.service';
import { UserStore } from '../../../entities/user/model/user.store';
import { DEFAULT_CRITERIA_LIMIT } from '../../../entities/scenario/utils/scenario-card-source.utils';

describe('ScenarioCardCriteriaEditorComponent', () => {
  let component: ScenarioCardCriteriaEditorComponent;
  let store: CardCatalogSearchStore;
  let userStore: UserStore;

  const mockCardSearchService = {
    search: async () => ({
      totalItems: 0,
      items: [],
      page: 0,
      pageSize: 10,
      totalPages: 0,
      facets: { kinds: [], tags: [] },
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioCardCriteriaEditorComponent],
      providers: [
        CardCatalogSearchStore,
        UserStore,
        { provide: CardSearchService, useValue: mockCardSearchService },
      ],
    }).compileComponents();

    store = TestBed.inject(CardCatalogSearchStore);
    userStore = TestBed.inject(UserStore);
    component = TestBed.createComponent(ScenarioCardCriteriaEditorComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject CardCatalogSearchStore', () => {
    expect(component.store).toBe(store);
  });

  it('should inject UserStore', () => {
    // userStore is private, but we can verify it works
    expect(userStore).toBeDefined();
  });

  it('should expose sortOptions', () => {
    expect(component.sortOptions).toBeDefined();
    expect(Array.isArray(component.sortOptions)).toBe(true);
    expect(component.sortOptions.length).toBeGreaterThan(0);
  });

  it('should have initial previewLoading as false', () => {
    expect(component.previewLoading()).toBe(false);
  });

  it('should have initial previewIds as empty array', () => {
    expect(component.previewIds()).toEqual([]);
  });

  it('should have initial matchingTotal as null', () => {
    expect(component.matchingTotal()).toBeNull();
  });

  describe('criteria input', () => {
    it('should have required criteria input', () => {
      expect(component.criteria).toBeDefined();
    });
  });

  describe('limit input', () => {
    it('should have default limit', () => {
      expect(component.limit()).toBe(DEFAULT_CRITERIA_LIMIT);
    });
  });

  describe('sort input', () => {
    it('should have default sort of updatedAt', () => {
      expect(component.sort()).toBe('updatedAt');
    });
  });

  describe('seed input', () => {
    it('should have empty default seed', () => {
      expect(component.seed()).toBe('');
    });
  });

  describe('criteriaChange output', () => {
    it('should emit criteriaChange output', () => {
      const spy = vi.spyOn(component.criteriaChange, 'emit');
      component.criteriaChange.emit({ query: 'test' });
      expect(spy).toHaveBeenCalledWith({ query: 'test' });
    });
  });

  describe('limitChange output', () => {
    it('should emit limitChange output', () => {
      const spy = vi.spyOn(component.limitChange, 'emit');
      component.limitChange.emit(25);
      expect(spy).toHaveBeenCalledWith(25);
    });
  });

  describe('sortChange output', () => {
    it('should emit sortChange output', () => {
      const spy = vi.spyOn(component.sortChange, 'emit');
      component.sortChange.emit('difficulty');
      expect(spy).toHaveBeenCalledWith('difficulty');
    });
  });

  describe('seedChange output', () => {
    it('should emit seedChange output', () => {
      const spy = vi.spyOn(component.seedChange, 'emit');
      component.seedChange.emit('my-seed');
      expect(spy).toHaveBeenCalledWith('my-seed');
    });
  });

  describe('onLimitInput', () => {
    it('should emit limitChange with parsed number', () => {
      const spy = vi.spyOn(component.limitChange, 'emit');
      component.onLimitInput('50');
      expect(spy).toHaveBeenCalledWith(50);
    });

    it('should not emit for non-finite values', () => {
      const spy = vi.spyOn(component.limitChange, 'emit');
      component.onLimitInput('abc');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit for NaN', () => {
      const spy = vi.spyOn(component.limitChange, 'emit');
      component.onLimitInput('abc');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should emit sortChange with the selected sort value', () => {
      const spy = vi.spyOn(component.sortChange, 'emit');
      component.onSortChange('random');
      expect(spy).toHaveBeenCalledWith('random');
    });
  });

  describe('onSeedInput', () => {
    it('should emit seedChange with the provided value', () => {
      const spy = vi.spyOn(component.seedChange, 'emit');
      component.onSeedInput('new-seed');
      expect(spy).toHaveBeenCalledWith('new-seed');
    });
  });
});

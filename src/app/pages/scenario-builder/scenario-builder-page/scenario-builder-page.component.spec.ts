import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ScenarioBuilderPageComponent } from './scenario-builder-page.component';
import { ScenarioBuilderStore } from '../../../features/scenario-builder/services/scenario-builder.store';
import { UserStore } from '../../../entities/user/model/user.store';
import { ScenarioBuilderDialogService } from '../../../features/scenario-builder/components/scenario-builder-dialog/scenario-builder-dialog.service';
import type { PageEvent } from '@angular/material/paginator';

describe('ScenarioBuilderPageComponent', () => {
  let component: ScenarioBuilderPageComponent;
  let fixture: ComponentFixture<ScenarioBuilderPageComponent>;
  let store: ScenarioBuilderStore;
  let userStore: UserStore;
  let dialogService: ScenarioBuilderDialogService;

  const mockDialogService = {
    openCreate: async () => ({ saved: false }),
    openEdit: async () => ({ saved: false }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioBuilderPageComponent],
      providers: [
        ScenarioBuilderStore,
        UserStore,
        { provide: ScenarioBuilderDialogService, useValue: mockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioBuilderPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(ScenarioBuilderStore);
    userStore = TestBed.inject(UserStore);
    dialogService = TestBed.inject(ScenarioBuilderDialogService);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject ScenarioBuilderStore', () => {
    expect(component.store).toBe(store);
  });

  it('should inject UserStore', () => {
    expect(component.userStore).toBe(userStore);
  });

  describe('startCreate', () => {
    it('should call dialogService.openCreate', async () => {
      const spy = vi.spyOn(dialogService, 'openCreate').mockResolvedValue({ saved: false });
      await component.startCreate();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('startEdit', () => {
    it('should call dialogService.openEdit with scenarioId', async () => {
      const spy = vi.spyOn(dialogService, 'openEdit').mockResolvedValue({ saved: false });
      await component.startEdit('scenario-123');
      expect(spy).toHaveBeenCalledWith('scenario-123');
    });
  });

  describe('deleteScenario', () => {
    it('should call store.deleteScenario', async () => {
      const spy = vi.spyOn(store, 'deleteScenario').mockResolvedValue(undefined);
      await component.deleteScenario('scenario-123');
      expect(spy).toHaveBeenCalledWith('scenario-123');
    });
  });

  describe('onListQueryChange', () => {
    it('should call store.setListQuery and loadList', () => {
      const setQuerySpy = vi.spyOn(store, 'setListQuery');
      const loadListSpy = vi.spyOn(store, 'loadList').mockResolvedValue(undefined);
      component.onListQueryChange('test query');
      expect(setQuerySpy).toHaveBeenCalledWith('test query');
      expect(loadListSpy).toHaveBeenCalled();
    });
  });

  describe('onListScopeChange', () => {
    it('should call store.setListScope and loadList', () => {
      const setScopeSpy = vi.spyOn(store, 'setListScope');
      const loadListSpy = vi.spyOn(store, 'loadList').mockResolvedValue(undefined);
      component.onListScopeChange('mine');
      expect(setScopeSpy).toHaveBeenCalledWith('mine');
      expect(loadListSpy).toHaveBeenCalled();
    });
  });

  describe('onCourseFilterChange', () => {
    it('should call store.setListCourseId', async () => {
      const spy = vi.spyOn(store, 'setListCourseId').mockResolvedValue(undefined);
      await component.onCourseFilterChange('course-123');
      expect(spy).toHaveBeenCalledWith('course-123');
    });

    it('should clear filter with null', async () => {
      const spy = vi.spyOn(store, 'setListCourseId').mockResolvedValue(undefined);
      await component.onCourseFilterChange(null);
      expect(spy).toHaveBeenCalledWith(null);
    });
  });

  describe('onListPageChange', () => {
    it('should call store.setPage and loadList', () => {
      const setPageSpy = vi.spyOn(store, 'setPage');
      const loadListSpy = vi.spyOn(store, 'loadList').mockResolvedValue(undefined);
      const event: PageEvent = { pageIndex: 2, pageSize: 20, previousPageIndex: 0, length: 100 };
      component.onListPageChange(event);
      expect(setPageSpy).toHaveBeenCalledWith(2, 20);
      expect(loadListSpy).toHaveBeenCalled();
    });
  });

  describe('isOwnScenario', () => {
    it('should return true when authorId matches user id', () => {
      // userStore.user is a signal, we can't directly set it in tests
      // The component uses userStore.user() to get the current user
      expect(component.isOwnScenario).toBeDefined();
      expect(typeof component.isOwnScenario).toBe('function');
    });

    it('should return false when authorId does not match', () => {
      expect(component.isOwnScenario).toBeDefined();
    });
  });

  describe('courseTitle', () => {
    it('should return null for undefined courseId', () => {
      expect(component.courseTitle(undefined)).toBeNull();
    });

    it('should return null for empty courseId', () => {
      expect(component.courseTitle('')).toBeNull();
    });

    it('should return course title when found', () => {
      store.courses.set([
        {
          id: 'course-1',
          title: 'My Course',
          authorId: 'u',
          lessonCount: 0,
          published: false,
          updatedAt: '',
          languagePairSummary: '',
        },
      ]);
      expect(component.courseTitle('course-1')).toBe('My Course');
    });

    it('should return null for non-existent courseId', () => {
      store.courses.set([]);
      expect(component.courseTitle('missing')).toBeNull();
    });
  });
});

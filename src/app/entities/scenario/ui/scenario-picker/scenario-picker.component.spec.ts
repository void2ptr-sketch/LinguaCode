import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PageEvent } from '@angular/material/paginator';
import { ScenarioPickerComponent } from './scenario-picker.component';
import { ScenarioSearchService } from '../../../../entities/scenario';
import { UserStore } from '../../../../entities/user/model/user.store';
import type { ScenarioIndexEntry } from '../../../../entities/scenario/model';

describe('ScenarioPickerComponent', () => {
  let component: ScenarioPickerComponent;
  let fixture: ComponentFixture<ScenarioPickerComponent>;
  let searchSpy: ReturnType<typeof vi.fn>;

  const mockScenarios: ScenarioIndexEntry[] = [
    {
      id: 'scenario-1',
      title: 'Scenario One',
      authorId: 'user-1',
      cardSourceMode: 'fixed',
      cardSourceSummary: '50 cards',
      published: true,
      updatedAt: '2024-01-01',
      languagePairSummary: 'EN-RU',
    },
    {
      id: 'scenario-2',
      title: 'Scenario Two',
      authorId: 'user-1',
      cardSourceMode: 'fixed',
      cardSourceSummary: '30 cards',
      published: true,
      updatedAt: '2024-01-02',
      languagePairSummary: 'EN-RU',
    },
    {
      id: 'scenario-3',
      title: 'Scenario Three',
      authorId: 'user-1',
      cardSourceMode: 'fixed',
      cardSourceSummary: '20 cards',
      published: true,
      updatedAt: '2024-01-03',
      languagePairSummary: 'EN-RU',
    },
  ];

  beforeEach(async () => {
    searchSpy = vi.fn().mockResolvedValue({
      items: mockScenarios,
      totalItems: 3,
      page: 0,
      pageSize: 10,
    });

    const getByIdSpy = vi.fn().mockResolvedValue(null);
    const activeLanguagePairIdSpy = vi.fn().mockReturnValue('pair-1');
    const languagePairSpy = vi.fn().mockReturnValue({ source: 'en', target: 'ru' });

    const mockSearchService = {
      search: searchSpy,
      getById: getByIdSpy,
    } as unknown as ScenarioSearchService;

    const mockUserStore = {
      activeLanguagePairId: activeLanguagePairIdSpy,
      languagePair: languagePairSpy,
    } as unknown as UserStore;

    await TestBed.configureTestingModule({
      imports: [ScenarioPickerComponent],
      providers: [
        { provide: ScenarioSearchService, useValue: mockSearchService },
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedScenarioId', '');
    fixture.detectChanges();
  });

  // ─── Creation & Inputs ────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required inputs with defaults', () => {
    expect(component.selectedScenarioId()).toBe('');
    expect(component.allowedScenarioIds()).toBeNull();
    expect(component.autoSelectFirst()).toBe(true);
  });

  it('should have all outputs defined', () => {
    expect(component.selectedScenarioIdChange).toBeDefined();
    expect(component.scenarioLabelChange).toBeDefined();
  });

  // ─── Load ─────────────────────────────────────────────────────────────

  it('should load scenarios on init', async () => {
    expect(searchSpy).toHaveBeenCalled();
    expect(component.items()).toEqual(mockScenarios);
    expect(component.totalItems()).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('should set loading false on error', async () => {
    searchSpy.mockRejectedValueOnce(new Error('Network error'));

    await expect(component.load()).rejects.toThrow('Network error');
    expect(component.loading()).toBe(false);
  });

  it('should reset page index on query change', () => {
    component.onQueryChange('test');
    expect(component.pageIndex()).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ query: 'test' }));
  });

  it('should reset page index on scope change', () => {
    component.onScopeChange('all');
    expect(component.pageIndex()).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ scope: 'all' }));
  });

  // ─── Pick ─────────────────────────────────────────────────────────────

  it('should emit selectedScenarioIdChange and scenarioLabelChange when picking', () => {
    const emitSpy = vi.spyOn(component.selectedScenarioIdChange, 'emit');
    const labelSpy = vi.spyOn(component.scenarioLabelChange, 'emit');

    component.pick(mockScenarios[1]);
    expect(emitSpy).toHaveBeenCalledWith('scenario-2');
    expect(labelSpy).toHaveBeenCalledWith('Scenario Two · 30 cards · EN-RU');
  });

  // ─── Pagination ───────────────────────────────────────────────────────

  it('should update page index and reload on page change', () => {
    const pageEvent: PageEvent = { pageIndex: 1, pageSize: 20, length: 50 };
    component.onPageChange(pageEvent);
    expect(component.pageIndex()).toBe(1);
    expect(component.pageSize()).toBe(20);
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: { page: 1, pageSize: 20 } }),
    );
  });

  // ─── Format Label ─────────────────────────────────────────────────────

  it('should format label with title, card source, and language pair', () => {
    const label = component.formatLabel(mockScenarios[2]);
    expect(label).toBe('Scenario Three · 20 cards · EN-RU');
  });
});

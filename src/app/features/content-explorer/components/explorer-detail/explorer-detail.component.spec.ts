import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AuthStore } from '../../../../entities/auth/services/auth.store';
import { CourseSearchService } from '../../../../entities/course/search/course-search.service';
import { ProgramsApiService } from '../../../../entities/program/api/programs-api.service';
import { ScenarioSearchService } from '../../../../entities/scenario/search/scenario-search.service';
import { CardSearchService } from '../../../../entities/card/search/card-search.service';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';

import { ContentExplorerStore, ExplorerNode } from '../../services/content-explorer.store';
import { ExplorerDetailComponent } from './explorer-detail.component';

describe('ExplorerDetailComponent — course management actions', () => {
  let fixture: ComponentFixture<ExplorerDetailComponent>;
  let store: ContentExplorerStore;

  function setup(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ExplorerDetailComponent],
      providers: [
        ContentExplorerStore,
        {
          provide: CourseSearchService,
          useValue: { search: vi.fn(), getById: vi.fn(), clearGetByIdCache: vi.fn() },
        },
        { provide: ProgramsApiService, useValue: { getById: vi.fn() } },
        { provide: ScenarioSearchService, useValue: { getByIdBatch: vi.fn() } },
        { provide: CardSearchService, useValue: {} },
        { provide: AuthStore, useValue: { user: () => null } },
        { provide: AppLoggerService, useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } },
      ],
    });

    store = TestBed.inject(ContentExplorerStore);
    fixture = TestBed.createComponent(ExplorerDetailComponent);
  }

  function selectScenarioNode(editable: boolean, published = false): ExplorerNode {
    const node = new ExplorerNode({
      kind: 'scenario',
      id: 's1',
      parentId: 'lesson:l1',
      title: 'Мой сценарий',
      meta: 'Сценарий · fixed',
      editable,
      data: {
        id: 's1',
        title: 'Мой сценарий',
        authorId: 'user-1',
        cardSource: { mode: 'fixed', cardIds: [] },
        published,
        updatedAt: '',
      },
    });
    store.selectNode(node);
    fixture.detectChanges();
    return node;
  }

  function selectCourseNode(editable: boolean): ExplorerNode {
    const node = new ExplorerNode({
      kind: 'course',
      id: 'course-1',
      parentId: null,
      title: 'Английский A1',
      meta: 'Каталог · 1 трек(ов)',
      editable,
      data: {},
    });
    store.selectNode(node);
    fixture.detectChanges();
    return node;
  }

  function findButton(label: string): HTMLButtonElement | undefined {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    return buttons.find((b) => (b.textContent ?? '').includes(label));
  }

  beforeEach(() => {
    setup();
  });

  it('should render empty state when no node is selected', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Выберите элемент в дереве контента');
  });

  it('should show export/delete buttons for an own (editable) course', () => {
    selectCourseNode(true);
    expect(findButton('Добавить программу')).toBeDefined();
    expect(findButton('Экспорт JSON')).toBeDefined();
    expect(findButton('Экспорт SCORM')).toBeDefined();
    expect(findButton('Удалить')).toBeDefined();
    // PDF-кнопка открывает меню с двумя вариантами
    expect(findButton('Скачать PDF')).toBeDefined();
  });

  it('should hide export/delete buttons for a foreign (read-only) course', () => {
    selectCourseNode(false);
    expect(findButton('Добавить программу')).toBeUndefined();
    expect(findButton('Экспорт JSON')).toBeUndefined();
    expect(findButton('Экспорт SCORM')).toBeUndefined();
    expect(findButton('Удалить')).toBeUndefined();
  });

  it('should show PDF menu trigger with two export options for own course', () => {
    selectCourseNode(true);
    expect(findButton('Скачать PDF')).toBeDefined();
  });

  it('should emit exportPdfRequested / exportPdfWithHintsRequested', () => {
    selectCourseNode(true);
    const pdfSpy = vi.fn();
    const hintsSpy = vi.fn();
    fixture.componentInstance.exportPdfRequested.subscribe(pdfSpy);
    fixture.componentInstance.exportPdfWithHintsRequested.subscribe(hintsSpy);

    // protected-обработчики вызываются через bracket-notation (unit-тест)
    fixture.componentInstance['onExportPdf']();
    fixture.componentInstance['onExportPdfWithHints']();

    expect(pdfSpy).toHaveBeenCalled();
    expect(hintsSpy).toHaveBeenCalled();
  });

  it('should emit exportJsonRequested / exportScormRequested on button click', () => {
    selectCourseNode(true);
    const jsonSpy = vi.fn();
    const scormSpy = vi.fn();
    fixture.componentInstance.exportJsonRequested.subscribe(jsonSpy);
    fixture.componentInstance.exportScormRequested.subscribe(scormSpy);

    findButton('Экспорт JSON')?.click();
    findButton('Экспорт SCORM')?.click();
    fixture.detectChanges();

    expect(jsonSpy).toHaveBeenCalled();
    expect(scormSpy).toHaveBeenCalled();
  });

  it('should emit deleteRequested when «Удалить» clicked', () => {
    selectCourseNode(true);
    const spy = vi.fn();
    fixture.componentInstance.deleteRequested.subscribe(spy);

    findButton('Удалить')?.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  it('should show the «Удалить» button for an own (editable) scenario', () => {
    selectScenarioNode(true);
    expect(findButton('Удалить')).toBeDefined();
    expect(fixture.componentInstance['canEditOwnScenario']()).toBe(true);
  });

  it('should hide the «Удалить» button for a foreign (read-only) scenario', () => {
    selectScenarioNode(false);
    expect(findButton('Удалить')).toBeUndefined();
    expect(fixture.componentInstance['canEditOwnScenario']()).toBe(false);
  });

  it('should emit deleteScenarioRequested when the scenario «Удалить» button is clicked', () => {
    selectScenarioNode(true);
    const spy = vi.fn();
    fixture.componentInstance.deleteScenarioRequested.subscribe(spy);

    findButton('Удалить')?.click();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalled();
  });

  it('should show the «Черновик» badge for an unpublished scenario node', () => {
    selectScenarioNode(true, false);
    const badge = fixture.nativeElement.querySelector('.explorer-detail__status');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Черновик');
    expect(badge.classList).not.toContain('explorer-detail__status--published');
  });

  it('should show the «Опубликован» badge for a published scenario node', () => {
    selectScenarioNode(false, true);
    const badge = fixture.nativeElement.querySelector('.explorer-detail__status');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('Опубликован');
    expect(badge.classList).toContain('explorer-detail__status--published');
  });

  it('should read the badge status from node data (Scenario entity)', () => {
    selectScenarioNode(true, true);
    expect(fixture.componentInstance['scenarioPublished']()).toBe(true);

    selectScenarioNode(true, false);
    expect(fixture.componentInstance['scenarioPublished']()).toBe(false);
  });

  it('should not show the status badge for non-scenario nodes', () => {
    selectCourseNode(true);
    expect(fixture.nativeElement.querySelector('.explorer-detail__status')).toBeNull();
  });

  it('should not emit deleteRequested (course intent) from the scenario delete button', () => {
    selectScenarioNode(true);
    const courseDeleteSpy = vi.fn();
    const scenarioDeleteSpy = vi.fn();
    fixture.componentInstance.deleteRequested.subscribe(courseDeleteSpy);
    fixture.componentInstance.deleteScenarioRequested.subscribe(scenarioDeleteSpy);

    findButton('Удалить')?.click();
    fixture.detectChanges();

    expect(scenarioDeleteSpy).toHaveBeenCalled();
    expect(courseDeleteSpy).not.toHaveBeenCalled();
  });
});

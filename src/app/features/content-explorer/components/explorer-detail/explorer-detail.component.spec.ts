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
    const buttons = [
      ...fixture.nativeElement.querySelectorAll('button'),
    ] as HTMLButtonElement[];
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
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CardSearchService } from '../../../core/data';
import { UserStore } from '../../../core/state';
import { ScenarioBuilderStore } from './scenario-builder.store';

describe('ScenarioBuilderStore', () => {
  let store: ScenarioBuilderStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        ScenarioBuilderStore,
        UserStore,
        CardSearchService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    store = TestBed.inject(ScenarioBuilderStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should load scenario index from API scoped to active pair', async () => {
    const loadPromise = store.loadList();

    const request = httpMock.expectOne(
      (req) =>
        req.url.includes('/scenarios/search') &&
        req.params.get('scope') === 'mine' &&
        req.params.get('knownLanguage') === 'ru' &&
        req.params.get('learningLanguage') === 'en',
    );
    request.flush({
      data: {
        items: [
          {
            id: 's1',
            title: 'Test',
            authorId: 'local-user',
            cardSourceMode: 'fixed',
            cardSourceSummary: '1 карточек',
            published: false,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        page: 0,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    await loadPromise;

    expect(store.indexItems().length).toBe(1);
    expect(store.indexItems()[0].title).toBe('Test');
  });
});

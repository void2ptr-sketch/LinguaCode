import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CardRepository } from '../../../core/data';
import { ScenarioBuilderService } from '../../scenario-builder/services/scenario-builder.service';
import { CardSelectService } from './card-select.service';

describe('CardSelectService', () => {
  let service: CardSelectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CardSelectService,
        CardRepository,
        ScenarioBuilderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CardSelectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should load cards for demo scenario from repository seed', async () => {
    const loadPromise = service.loadScenario('demo-scenario');
    const request = httpMock.expectOne('/data/select-cards.json');
    request.flush({
      scenarioId: 'demo-scenario',
      cards: [
        {
          id: 'select-1',
          kind: 'select',
          title: 'Приветствие',
          appearance: { theme: 'azure-blue', fontSize: 'md' },
          question: 'Q?',
          options: ['A', 'B'],
          correctIndex: 0,
        },
        {
          id: 'select-2',
          kind: 'select',
          title: 'Числа',
          appearance: { theme: 'azure-blue', fontSize: 'md' },
          question: 'Q2?',
          options: ['1', '2'],
          correctIndex: 0,
        },
        {
          id: 'select-3',
          kind: 'select',
          title: 'Прощание',
          appearance: { theme: 'azure-blue', fontSize: 'md' },
          question: 'Q3?',
          options: ['X', 'Y'],
          correctIndex: 0,
        },
      ],
    });

    const session = await loadPromise;

    expect(session.scenarioId).toBe('demo-scenario');
    expect(session.cards.length).toBe(3);
    expect(session.missingCardIds).toEqual([]);
  });
});

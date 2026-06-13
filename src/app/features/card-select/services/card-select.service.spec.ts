import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CardsApiService, ScenarioSearchService } from '../../../core/data';
import { CardSelectService } from './card-select.service';

describe('CardSelectService', () => {
  let service: CardSelectService;

  const selectCard = {
    id: 'select-1',
    kind: 'select' as const,
    title: 'Приветствие',
    appearance: { theme: 'azure-blue', fontSize: 'md' as const },
    question: 'Q?',
    options: ['A', 'B'],
    correctIndex: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CardSelectService,
        {
          provide: ScenarioSearchService,
          useValue: {
            getById: async () => ({
              id: 'demo-scenario',
              title: 'Demo',
              description: '',
              authorId: 'local-user',
              published: true,
              updatedAt: '2026-01-01T00:00:00.000Z',
              cardSource: { mode: 'fixed' as const, cardIds: ['select-1'] },
            }),
          },
        },
        {
          provide: CardsApiService,
          useValue: {
            getByIds: async () => [selectCard],
          },
        },
        provideHttpClient(),
      ],
    });

    service = TestBed.inject(CardSelectService);
  });

  it('should load cards for scenario via API batch', async () => {
    const session = await service.loadScenario('demo-scenario');

    expect(session.scenarioId).toBe('demo-scenario');
    expect(session.cards.length).toBe(1);
    expect(session.missingCardIds).toEqual([]);
    expect(session.scenarioSourceLabel).toBe('1 карточек');
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CatalogService } from './catalog.service';
import { CardDifficultiesService } from '../../../shared/api/generated/card-difficulties';
import { CardKindsService } from '../../../shared/api/generated/card-kinds';
import { ContentLanguagesService } from '../../../shared/api/generated/content-languages';

describe('CatalogService', () => {
  let service: CatalogService;
  let cardDifficultiesApi: { listAll8: ReturnType<typeof vi.fn> };
  let cardKindsApi: { listAll7: ReturnType<typeof vi.fn> };
  let contentLanguagesApi: { listAll6: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    cardDifficultiesApi = {
      listAll8: vi.fn(() =>
        of({
          data: [
            { code: 'beginner', label: 'Начальный уровень' },
            { code: 'expert', label: 'Экспертный уровень' },
          ],
        }),
      ),
    };
    cardKindsApi = { listAll7: vi.fn(() => of({ data: [{ code: 'select', label: 'Выбор' }] })) };
    contentLanguagesApi = { listAll6: vi.fn(() => of({ data: [] })) };

    TestBed.configureTestingModule({
      providers: [
        CatalogService,
        { provide: CardDifficultiesService, useValue: cardDifficultiesApi },
        { provide: CardKindsService, useValue: cardKindsApi },
        { provide: ContentLanguagesService, useValue: contentLanguagesApi },
      ],
    });

    service = TestBed.inject(CatalogService);
  });

  it('should not expose difficulty constants before the backend is loaded', () => {
    expect(service.difficulties()).toEqual([]);
  });

  it('should load difficulty options from the backend endpoint', async () => {
    await service.load();

    expect(cardDifficultiesApi.listAll8).toHaveBeenCalledTimes(1);
    expect(service.difficulties()).toEqual([
      { code: 'beginner', label: 'Начальный уровень' },
      { code: 'expert', label: 'Экспертный уровень' },
    ]);
  });

  it('should deduplicate concurrent ensureLoaded calls', async () => {
    await Promise.all([service.ensureLoaded(), service.ensureLoaded()]);

    expect(cardKindsApi.listAll7).toHaveBeenCalledTimes(1);
    expect(cardDifficultiesApi.listAll8).toHaveBeenCalledTimes(1);
    expect(contentLanguagesApi.listAll6).toHaveBeenCalledTimes(1);
  });

  it('should not reload the catalog after it has been loaded', async () => {
    await service.ensureLoaded();
    await service.ensureLoaded();

    expect(cardKindsApi.listAll7).toHaveBeenCalledTimes(1);
    expect(cardDifficultiesApi.listAll8).toHaveBeenCalledTimes(1);
  });
});

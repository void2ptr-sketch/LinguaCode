import { vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import { LanguagePairsApiService } from '../api/language-pairs-api.service';
import { LanguagePairIdResolver } from './language-pair-id-resolver.service';
import type { LanguagePair } from '../model/language-pair.types';

describe('LanguagePairIdResolver', () => {
  let resolver: LanguagePairIdResolver;

  const mockApi = {
    listAll: vi.fn<() => Promise<{ id: number; knownCode: string; learningCode: string }[]>>(),
  };

  const ruEn: LanguagePair = { known: 'ru', learning: 'en' };
  const ruZh: LanguagePair = { known: 'ru', learning: 'zh' };
  const backendPairs = [
    { id: 7, knownCode: 'ru', learningCode: 'en' },
    { id: 11, knownCode: 'ru', learningCode: 'zh' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [LanguagePairIdResolver, { provide: LanguagePairsApiService, useValue: mockApi }],
    });

    resolver = TestBed.inject(LanguagePairIdResolver);
  });

  it('resolves pairs to numeric backend IDs', async () => {
    mockApi.listAll.mockResolvedValue(backendPairs);

    const ids = await resolver.resolveIds([ruEn, ruZh]);

    expect(ids).toEqual([7, 11]);
    expect(mockApi.listAll).toHaveBeenCalledTimes(1);
  });

  it('deduplicates IDs and skips pairs unknown to the backend', async () => {
    mockApi.listAll.mockResolvedValue(backendPairs);

    const unknownPair = { known: 'ru', learning: 'xx' } as unknown as LanguagePair;
    const ids = await resolver.resolveIds([ruEn, ruEn, unknownPair]);

    expect(ids).toEqual([7]);
  });

  it('returns an empty array when no pairs are provided (no API call)', async () => {
    const ids = await resolver.resolveIds([]);

    expect(ids).toEqual([]);
    expect(mockApi.listAll).not.toHaveBeenCalled();
  });

  it('returns an empty array when the backend pair list is unavailable', async () => {
    mockApi.listAll.mockRejectedValue(new Error('network'));

    const ids = await resolver.resolveIds([ruEn]);

    expect(ids).toEqual([]);
  });

  it('caches the pair list and does not call the API again', async () => {
    mockApi.listAll.mockResolvedValue(backendPairs);

    await resolver.resolveIds([ruEn]);
    await resolver.resolveIds([ruZh]);

    expect(mockApi.listAll).toHaveBeenCalledTimes(1);
  });

  it('retries after resetCache()', async () => {
    mockApi.listAll.mockResolvedValue(backendPairs);

    await resolver.resolveIds([ruEn]);
    resolver.resetCache();
    await resolver.resolveIds([ruZh]);

    expect(mockApi.listAll).toHaveBeenCalledTimes(2);
  });
});

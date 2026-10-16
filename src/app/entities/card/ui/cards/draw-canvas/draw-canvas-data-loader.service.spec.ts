import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { DrawCanvasDataLoaderService } from './draw-canvas-data-loader.service';
import { HanziDataService } from '../../../../chinese/lib/services';
import type { HanziCharacterModel, HanziLoadState } from '../../../../chinese/model';

describe('DrawCanvasDataLoaderService', () => {
  let service: DrawCanvasDataLoaderService;
  let hanziDataService: HanziDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DrawCanvasDataLoaderService,
        HanziDataService,
      ],
    });

    service = TestBed.inject(DrawCanvasDataLoaderService);
    hanziDataService = TestBed.inject(HanziDataService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  describe('loadCharacter', () => {
    it('should clear model when character is empty', async () => {
      expect(service.hanziLoadState()).toBe('idle');

      await service.loadCharacter('');

      expect(service.hanziModel()).toBeNull();
      expect(service.hanziLoadState()).toBe('idle');
    });

    it('should return cached model when available', async () => {
      const mockModel: HanziCharacterModel = { character: '人', strokes: [] };
      vi.spyOn(hanziDataService, 'getCachedModel').mockReturnValue(mockModel);

      await service.loadCharacter('人');

      expect(service.hanziModel()).toBe(mockModel);
      expect(service.hanziLoadState()).toBe('ready');
    });

    it('should set missing state when character is not found', async () => {
      vi.spyOn(hanziDataService, 'getCachedModel').mockReturnValue(null);
      vi.spyOn(hanziDataService, 'getLoadState').mockReturnValue('missing');

      await service.loadCharacter('未');

      expect(service.hanziModel()).toBeNull();
      expect(service.hanziLoadState()).toBe('missing');
    });
  });

  describe('loadRadicals', () => {
    it('should clear models when characters array is empty', async () => {
      expect(service.radicalLoadState()).toBe('idle');

      await service.loadRadicals([]);

      expect(service.radicalModels().size).toBe(0);
      expect(service.radicalLoadState()).toBe('idle');
    });

    it('should load radicals from service', async () => {
      const mockModels = new Map<string, HanziCharacterModel>([['氵', { character: '氵', strokes: [] }]]);
      vi.spyOn(hanziDataService, 'loadCharacters').mockResolvedValue(mockModels);

      await service.loadRadicals(['氵']);

      expect(hanziDataService.loadCharacters).toHaveBeenCalledWith(['氵']);
      expect(service.radicalModels().size).toBe(1);
      expect(service.radicalLoadState()).toBe('ready');
    });

    it('should set missing state when no models loaded', async () => {
      vi.spyOn(hanziDataService, 'loadCharacters').mockResolvedValue(new Map());

      await service.loadRadicals(['未']);

      expect(service.radicalLoadState()).toBe('missing');
    });
  });

  describe('clearRadicals', () => {
    it('should clear radical models and reset state', () => {
      const mockModel: HanziCharacterModel = { character: 'test', strokes: [] };
      service.radicalModels.set(new Map([['test', mockModel]]));
      service.radicalLoadState.set('ready' as HanziLoadState);

      service.clearRadicals();

      expect(service.radicalModels().size).toBe(0);
      expect(service.radicalLoadState()).toBe('idle');
    });
  });

  describe('hasRadicalStrokeModel', () => {
    it('should return true when radical has strokes', () => {
      const mockModel: HanziCharacterModel = { character: '氵', strokes: [{ points: [], strokeNum: 0, path: '', isRadical: false }] };
      service.radicalModels.set(new Map([['氵', mockModel]]));

      expect(service.hasRadicalStrokeModel('氵')).toBe(true);
    });

    it('should return false when radical has no strokes', () => {
      const mockModel: HanziCharacterModel = { character: '氵', strokes: [] };
      service.radicalModels.set(new Map([['氵', mockModel]]));

      expect(service.hasRadicalStrokeModel('氵')).toBe(false);
    });

    it('should return false when radical not found', () => {
      expect(service.hasRadicalStrokeModel('未')).toBe(false);
    });
  });
});

describe('DrawCanvasDataLoaderService with mocked HanziDataService', () => {
  let service: DrawCanvasDataLoaderService;
  let mockHanziDataService: HanziDataService;

  beforeEach(() => {
    mockHanziDataService = {
      getCachedModel: () => null,
      getLoadState: () => 'idle',
      loadCharacter: async () => null,
      loadCharacters: async () => new Map(),
      hasCachedData: () => false,
    } as unknown as HanziDataService;

    TestBed.configureTestingModule({
      providers: [
        DrawCanvasDataLoaderService,
        { provide: HanziDataService, useValue: mockHanziDataService },
      ],
    });

    service = TestBed.inject(DrawCanvasDataLoaderService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load character from service when not cached', async () => {
    const mockModel: HanziCharacterModel = { character: '好', strokes: [] };
    const loadSpy = vi.spyOn(mockHanziDataService, 'loadCharacter').mockResolvedValue(mockModel);

    await service.loadCharacter('好');

    expect(loadSpy).toHaveBeenCalledWith('好');
    console.log('hanziModel:', service.hanziModel());
    console.log('hanziLoadState:', service.hanziLoadState());
    expect(service.hanziModel()?.character).toBe('好');
    expect(service.hanziLoadState()).toBe('ready');
  });
});

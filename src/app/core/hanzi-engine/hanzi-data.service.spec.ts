import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { HanziCharacterJson } from './hanzi-character.types';
import { HanziDataService } from './hanzi-data.service';

const REN_JSON: HanziCharacterJson = {
  strokes: ['M 475 485 Z', 'M 462 456 Z'],
  medians: [
    [
      { x: 483, y: 736 },
      { x: 508, y: 702 },
    ],
    [
      { x: 474, y: 477 },
      { x: 477, y: 459 },
    ],
  ],
};

const NI_JSON: HanziCharacterJson = {
  strokes: ['M 100 100 Z', 'M 200 200 Z', 'M 300 300 Z', 'M 400 400 Z', 'M 500 500 Z', 'M 600 600 Z', 'M 700 700 Z'],
  medians: [
    [{ x: 100, y: 100 }, { x: 120, y: 120 }],
    [{ x: 200, y: 200 }, { x: 220, y: 220 }],
    [{ x: 300, y: 300 }, { x: 320, y: 320 }],
    [{ x: 400, y: 400 }, { x: 420, y: 420 }],
    [{ x: 500, y: 500 }, { x: 520, y: 520 }],
    [{ x: 600, y: 600 }, { x: 620, y: 620 }],
    [{ x: 700, y: 700 }, { x: 720, y: 720 }],
  ],
};

const HAO_JSON: HanziCharacterJson = {
  strokes: ['M 1 1 Z', 'M 2 2 Z', 'M 3 3 Z', 'M 4 4 Z', 'M 5 5 Z', 'M 6 6 Z'],
  medians: [
    [{ x: 1, y: 1 }, { x: 2, y: 2 }],
    [{ x: 2, y: 2 }, { x: 3, y: 3 }],
    [{ x: 3, y: 3 }, { x: 4, y: 4 }],
    [{ x: 4, y: 4 }, { x: 5, y: 5 }],
    [{ x: 5, y: 5 }, { x: 6, y: 6 }],
    [{ x: 6, y: 6 }, { x: 7, y: 7 }],
  ],
};

describe('HanziDataService', () => {
  let service: HanziDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HanziDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load character model from assets path', async () => {
    const promise = service.loadCharacter('人');
    const request = httpMock.expectOne('/assets/hanzi/%E4%BA%BA.json');
    expect(request.request.method).toBe('GET');
    request.flush(REN_JSON);

    const model = await promise;
    expect(model?.character).toBe('人');
    expect(model?.strokes.length).toBe(2);
    expect(service.hasCachedData('人')).toBeTrue();
  });

  it('should cache missing characters', async () => {
    const first = service.loadCharacter('未');
    const request = httpMock.expectOne('/assets/hanzi/%E6%9C%AA.json');
    request.flush('not found', { status: 404, statusText: 'Not Found' });
    await first;

    expect(service.getLoadState('未')).toBe('missing');
    const second = await service.loadCharacter('未');
    expect(second).toBeNull();
    httpMock.expectNone('/assets/hanzi/%E6%9C%AA.json');
  });

  it('should prefetch all tab characters (你好 → 2 JSON)', async () => {
    const promise = service.loadCharacters(['你', '好']);
    const niRequest = httpMock.expectOne('/assets/hanzi/%E4%BD%A0.json');
    const haoRequest = httpMock.expectOne('/assets/hanzi/%E5%A5%BD.json');
    niRequest.flush(NI_JSON);
    haoRequest.flush(HAO_JSON);

    const models = await promise;
    expect(models.size).toBe(2);
    expect(models.get('你')?.character).toBe('你');
    expect(models.get('好')?.character).toBe('好');
  });
});

describe('HanziDataService offline smoke', () => {
  let service: HanziDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(HanziDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should expose local relative asset URLs only (no CDN)', () => {
    expect(service.assetUrl('人')).toBe('/assets/hanzi/%E4%BA%BA.json');
    expect(service.assetUrl('人')).not.toMatch(/^https?:\/\//);
  });

  it('should replay ghost/tracing data from cache without a second network request', async () => {
    const first = service.loadCharacter('人');
    httpMock.expectOne('/assets/hanzi/%E4%BA%BA.json').flush(REN_JSON);
    await first;

    const cached = await service.loadCharacter('人');
    httpMock.expectNone('/assets/hanzi/%E4%BA%BA.json');

    expect(cached?.character).toBe('人');
    expect(service.getCachedModel('人')?.strokes.length).toBe(2);
    expect(service.hasCachedData('人')).toBeTrue();
  });
});

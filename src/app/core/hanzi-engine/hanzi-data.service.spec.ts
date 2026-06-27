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
});

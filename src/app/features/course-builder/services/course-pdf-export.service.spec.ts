import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CoursePdfExportService } from './course-pdf-export.service';
import { CardRepository } from '../../../core/data/cards/card.repository';

describe('CoursePdfExportService', () => {
  let service: CoursePdfExportService;
  let cardRepositoryMock: Partial<CardRepository>;

  beforeEach(() => {
    localStorage.clear();

    cardRepositoryMock = {
      loadStored: vi.fn().mockReturnValue([]),
    };

    TestBed.configureTestingModule({
      providers: [
        CoursePdfExportService,
        { provide: CardRepository, useValue: cardRepositoryMock },
      ],
    });

    service = TestBed.inject(CoursePdfExportService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });
});

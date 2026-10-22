import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { SyncQueueBootstrap } from './sync-queue.bootstrap';
import { SyncQueueService } from '../../shared/sync';
import type { SyncQueueEntry } from '../../shared/sync';
import { CardsApiService } from '../../entities/card/api/cards-api.service';
import { ScenariosApiService } from '../../entities/scenario/api/scenarios-api.service';
import { CoursesApiService } from '../../entities/course/api/courses-api.service';

describe('SyncQueueBootstrap', () => {
  let queue: SyncQueueService;
  let cardsApi: CardsApiService;
  let scenariosApi: ScenariosApiService;
  let coursesApi: CoursesApiService;

  beforeEach(() => {
    const cardsApiMock = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const scenariosApiMock = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const coursesApiMock = {
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        SyncQueueBootstrap,
        {
          provide: SyncQueueService,
          useValue: {
            registerExecutor: vi.fn(),
            flush: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: CardsApiService, useValue: cardsApiMock },
        { provide: ScenariosApiService, useValue: scenariosApiMock },
        { provide: CoursesApiService, useValue: coursesApiMock },
      ],
    });

    TestBed.inject(SyncQueueBootstrap);
    queue = TestBed.inject(SyncQueueService) as unknown as SyncQueueService;
    cardsApi = TestBed.inject(CardsApiService) as unknown as CardsApiService;
    scenariosApi = TestBed.inject(ScenariosApiService) as unknown as ScenariosApiService;
    coursesApi = TestBed.inject(CoursesApiService) as unknown as CoursesApiService;
  });

  describe('canHandle', () => {
    it('should handle card operations', () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      expect(executor.canHandle('card.create')).toBe(true);
      expect(executor.canHandle('card.update')).toBe(true);
      expect(executor.canHandle('card.delete')).toBe(true);
    });

    it('should handle scenario operations', () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      expect(executor.canHandle('scenario.create')).toBe(true);
      expect(executor.canHandle('scenario.update')).toBe(true);
      expect(executor.canHandle('scenario.delete')).toBe(true);
    });

    it('should handle course operations', () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      expect(executor.canHandle('course.create')).toBe(true);
      expect(executor.canHandle('course.update')).toBe(true);
      expect(executor.canHandle('course.delete')).toBe(true);
    });

    it('should not handle unknown operations', () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      expect(executor.canHandle('unknown.operation')).toBe(false);
    });
  });

  describe('run', () => {
    it('should call cardsApi.create for card.create', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '1',
        kind: 'card.create',
        payload: { card: { id: 'c1' } },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(cardsApi.create).toHaveBeenCalledWith({ id: 'c1' });
    });

    it('should call cardsApi.update for card.update', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '2',
        kind: 'card.update',
        payload: { cardId: 'c1', card: { id: 'c1', title: 'New' } },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(cardsApi.update).toHaveBeenCalledWith('c1', { id: 'c1', title: 'New' });
    });

    it('should call cardsApi.delete for card.delete', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '3',
        kind: 'card.delete',
        payload: { cardId: 'c1' },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(cardsApi.delete).toHaveBeenCalledWith('c1');
    });

    it('should call scenariosApi.create for scenario.create', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '4',
        kind: 'scenario.create',
        payload: { payload: { title: 'Test' } },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(scenariosApi.create).toHaveBeenCalledWith({ title: 'Test' });
    });

    it('should call scenariosApi.update for scenario.update', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '5',
        kind: 'scenario.update',
        payload: { scenarioId: 's1', payload: { title: 'Updated' } },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(scenariosApi.update).toHaveBeenCalledWith('s1', { title: 'Updated' });
    });

    it('should call scenariosApi.delete for scenario.delete', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '6',
        kind: 'scenario.delete',
        payload: { scenarioId: 's1' },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(scenariosApi.delete).toHaveBeenCalledWith('s1');
    });

    it('should call coursesApi.create for course.create', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '7',
        kind: 'course.create',
        payload: { payload: { title: 'Course' } },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(coursesApi.create).toHaveBeenCalledWith({ title: 'Course' });
    });

    it('should call coursesApi.update for course.update', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '8',
        kind: 'course.update',
        payload: { courseId: 'co1', payload: { title: 'Updated' } },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(coursesApi.update).toHaveBeenCalledWith('co1', { title: 'Updated' });
    });

    it('should call coursesApi.delete for course.delete', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '9',
        kind: 'course.delete',
        payload: { courseId: 'co1' },
        createdAt: Date.now(),
        attempts: 0,
      };
      await executor.run(entry);
      expect(coursesApi.delete).toHaveBeenCalledWith('co1');
    });

    it('should throw for unknown operation kind', async () => {
      const executor = vi.mocked(queue.registerExecutor).mock.calls[0][0];
      const entry: SyncQueueEntry = {
        id: '10',
        kind: 'unknown.operation',
        payload: {},
        createdAt: Date.now(),
        attempts: 0,
      };
      await expect(executor.run(entry)).rejects.toThrow(
        'Unknown sync operation: unknown.operation',
      );
    });
  });
});

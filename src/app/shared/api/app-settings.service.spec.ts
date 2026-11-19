import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Observable, of, throwError } from 'rxjs';
import { AppSettingsService } from './app-settings.service';
import { ReferenceSettingsService } from './generated/reference-settings';
import type {
  ValidationRulesResponse,
  PaginationSettingsResponse,
  SyncSettingsResponse,
  ChineseSettingsResponse,
} from './generated/models';

describe('AppSettingsService', () => {
  let service: AppSettingsService;
  let api: ReferenceSettingsService;

  const mockValidation: ValidationRulesResponse = {
    maxTitleLength: 250,
    maxDescriptionLength: 3000,
    maxTagsPerEntity: 15,
    requireTags: true,
  };

  const mockPagination: PaginationSettingsResponse = {
    defaultPageSize: 100,
    maxPageSize: 500,
  };

  const mockSync: SyncSettingsResponse = {
    maxBatchSize: 1000,
    syncTimeoutSeconds: 600,
  };

  const mockChinese: ChineseSettingsResponse = {
    showPinyin: false,
    showTones: false,
    showHanzi: false,
    pinyinPosition: 'right',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        AppSettingsService,
        {
          provide: ReferenceSettingsService,
          useValue: {
            getValidationRules: vi.fn(() => of(mockValidation)),
            getPaginationSettings: vi.fn(() => of(mockPagination)),
            getSyncSettings: vi.fn(() => of(mockSync)),
            getChineseSettings: vi.fn(() => of(mockChinese)),
          },
        },
      ],
    });
    service = TestBed.inject(AppSettingsService);
    api = TestBed.inject(ReferenceSettingsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Default (pre-load) values ──────────────────────────────────────────

  it('should return fallback values before loading', () => {
    expect(service.maxTitleLength()).toBe(200);
    expect(service.maxDescriptionLength()).toBe(2000);
    expect(service.maxTagsPerEntity()).toBe(10);
    expect(service.requireTags()).toBe(false);
    expect(service.defaultPageSize()).toBe(50);
    expect(service.maxPageSize()).toBe(200);
    expect(service.maxSyncBatchSize()).toBe(500);
    expect(service.syncTimeoutSeconds()).toBe(300);
    expect(service.showPinyin()).toBe(true);
    expect(service.showTones()).toBe(true);
    expect(service.showHanzi()).toBe(true);
    expect(service.pinyinPosition()).toBe('above');
    expect(service.loading()).toBe(false);
    expect(service.loaded()).toBe(false);
  });

  // ── ensureLoaded ───────────────────────────────────────────────────────

  it('should load all settings and expose them', async () => {
    await service.ensureLoaded();

    expect(service.maxTitleLength()).toBe(250);
    expect(service.maxDescriptionLength()).toBe(3000);
    expect(service.maxTagsPerEntity()).toBe(15);
    expect(service.requireTags()).toBe(true);
    expect(service.defaultPageSize()).toBe(100);
    expect(service.maxPageSize()).toBe(500);
    expect(service.maxSyncBatchSize()).toBe(1000);
    expect(service.syncTimeoutSeconds()).toBe(600);
    expect(service.showPinyin()).toBe(false);
    expect(service.showTones()).toBe(false);
    expect(service.showHanzi()).toBe(false);
    expect(service.pinyinPosition()).toBe('right');
    expect(service.loaded()).toBe(true);
  });

  it('should return early when already loaded', async () => {
    await service.ensureLoaded();
    expect(service.loaded()).toBe(true);

    const validationCallCount = (api.getValidationRules as ReturnType<typeof vi.fn>).mock.calls
      .length;

    await service.ensureLoaded();
    expect((api.getValidationRules as ReturnType<typeof vi.fn>).mock.calls.length).toBe(
      validationCallCount,
    );
  });

  it('should deduplicate concurrent ensureLoaded calls', async () => {
    const [p1, p2, p3] = await Promise.all([
      service.ensureLoaded(),
      service.ensureLoaded(),
      service.ensureLoaded(),
    ]);

    expect(service.loaded()).toBe(true);
    expect(p1).toBeUndefined();
    expect(p2).toBeUndefined();
    expect(p3).toBeUndefined();
  });

  // ── reload ─────────────────────────────────────────────────────────────

  it('should reload settings when loaded is false', async () => {
    await service.reload();

    expect(service.loaded()).toBe(true);
    expect(service.maxTitleLength()).toBe(250);
  });

  it('should set loading during load', async () => {
    let resolveLoad: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });

    (api.getValidationRules as ReturnType<typeof vi.fn>).mockReturnValue(
      new Observable<void>((sub) => {
        sub.next();
        sub.complete();
      }),
    );
    (api.getPaginationSettings as ReturnType<typeof vi.fn>).mockReturnValue(loadPromise as never);
    (api.getSyncSettings as ReturnType<typeof vi.fn>).mockReturnValue(loadPromise as never);
    (api.getChineseSettings as ReturnType<typeof vi.fn>).mockReturnValue(loadPromise as never);

    service.ensureLoaded();
    expect(service.loading()).toBe(true);

    resolveLoad!();
    await vi.runAllTimersAsync();

    expect(service.loading()).toBe(false);
  });

  // ── Partial failures ───────────────────────────────────────────────────

  it('should handle partial API failures gracefully', async () => {
    (api.getValidationRules as ReturnType<typeof vi.fn>).mockReturnValue(of(mockValidation));
    (api.getPaginationSettings as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => new Error('timeout')),
    );
    (api.getSyncSettings as ReturnType<typeof vi.fn>).mockReturnValue(of(mockSync));
    (api.getChineseSettings as ReturnType<typeof vi.fn>).mockReturnValue(of(mockChinese));

    await service.ensureLoaded();

    expect(service.loaded()).toBe(false);
    expect(service.maxTitleLength()).toBe(250);
    expect(service.maxSyncBatchSize()).toBe(1000);
  });

  // ── Computed values ────────────────────────────────────────────────────

  it('should expose correct pinyinPosition value', async () => {
    (api.getChineseSettings as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ ...mockChinese, pinyinPosition: 'below' } as ChineseSettingsResponse),
    );

    await service.ensureLoaded();
    expect(service.pinyinPosition()).toBe('below');
  });
});

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildApiUrl } from '../../../shared/api/api-url';
import { UserApiService } from './user-api.service';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService],
    });
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  // ── getMe ──

  it('should get the current user with JSON string preferences', async () => {
    const promise = service.getMe();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/users/me'));
    req.flush({
      data: {
        id: 'user-1',
        displayName: 'Test User',
        email: 'test@example.com',
        preferences: JSON.stringify({ theme: 'dark', lang: 'ru' }),
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    });

    const user = await promise;
    expect(user.id).toBe('user-1');
    expect(user.displayName).toBe('Test User');
    expect(user.preferences).toEqual({ theme: 'dark', lang: 'ru' });
  });

  it('should get the current user with object preferences', async () => {
    const promise = service.getMe();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/users/me'));
    req.flush({
      data: {
        id: 'user-2',
        displayName: 'Object User',
        email: 'obj@example.com',
        preferences: { theme: 'light', lang: 'en' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    });

    const user = await promise;
    expect(user.preferences).toEqual({ theme: 'light', lang: 'en' });
  });

  it('should handle malformed preferences JSON', async () => {
    const promise = service.getMe();

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/users/me'));
    req.flush({
      data: {
        id: 'user-3',
        displayName: 'Bad JSON',
        email: 'bad@example.com',
        preferences: '{not valid json',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    });

    const user = await promise;
    expect(user.preferences).toEqual({});
  });

  // ── updateMe ──

  it('should update the current user', async () => {
    const promise = service.updateMe({ displayName: 'Updated Name' });

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/users/me'));
    expect(req.request.method).toBe('PUT');
    req.flush({
      data: {
        id: 'user-1',
        displayName: 'Updated Name',
        email: 'test@example.com',
        preferences: JSON.stringify({ theme: 'dark' }),
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-03T00:00:00Z',
      },
    });

    const user = await promise;
    expect(user.displayName).toBe('Updated Name');
  });

  // ── patchUserPreferences ──

  it('should patch user preferences', async () => {
    const promise = service.patchUserPreferences({ theme: 'dark' });

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/users/me/preferences'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    await promise;
  });

  it('should return void on patch error', async () => {
    const promise = service.patchUserPreferences({ theme: 'dark' });

    const req = httpMock.expectOne((r) => r.url === buildApiUrl('/users/me/preferences'));
    req.flush({}, { status: 500, statusText: 'Server Error' });

    await expect(promise).resolves.toBeUndefined();
  });
});

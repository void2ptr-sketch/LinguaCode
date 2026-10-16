import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('API errors', () => {
    it('should transform HttpErrorResponse into HttpApiError with status and body', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/cards/1`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/cards/1`);
      request.flush(
        { message: 'Card not found', code: 'NOT_FOUND' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message).toBe('Card not found');
      expect((caught as { status: number }).status).toBe(404);
      expect((caught as { body: unknown }).body).toEqual({
        message: 'Card not found',
        code: 'NOT_FOUND',
      });
    });

    it('should transform HttpErrorResponse with string error body', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/scenarios`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/scenarios`);
      request.flush('Internal server error', { status: 500, statusText: 'Server Error' });

      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message).toBe('Internal server error');
      expect((caught as { status: number }).status).toBe(500);
    });

    it('should use default message when API response has no valid message', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/cards`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/cards`);
      request.flush({ code: 'UNKNOWN' }, { status: 500, statusText: 'Server Error' });

      expect(caught).toBeInstanceOf(Error);
      expect((caught as { status: number }).status).toBe(500);
      // body.message is empty string after trim check, so fallback to error.message
      expect((caught as Error).message).toBeDefined();
    });

    it('should set status 0 and body null for network errors on API requests', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/cards`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/cards`);
      request.flush(null, { status: 0, statusText: 'Unknown' });

      expect(caught).toBeInstanceOf(Error);
      expect((caught as { status: number }).status).toBe(0);
      expect((caught as { body: unknown }).body).toBeNull();
    });
  });

  describe('Non-API errors', () => {
    it('should not transform errors for non-API requests', () => {
      let caught: unknown;

      http.get('/repositories/select-cards.json').subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne('/repositories/select-cards.json');
      request.flush(null, { status: 0, statusText: 'Unknown' });

      // Non-API errors pass through without transformation
      expect(caught).toBeInstanceOf(HttpErrorResponse);
      const error = caught as HttpErrorResponse;
      expect(error.status).toBe(0);
    });

    it('should not transform error body for fixture URLs', () => {
      let caught: unknown;

      http.get('/repositories/select-cards.json').subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne('/repositories/select-cards.json');
      request.flush({ message: 'fixture error' }, { status: 500, statusText: 'Error' });

      // Non-API errors pass through without transformation
      expect(caught).toBeInstanceOf(HttpErrorResponse);
      const error = caught as HttpErrorResponse;
      expect(error.status).toBe(500);
      // Body should not be wrapped in HttpApiError structure
      expect(error.error).toEqual({ message: 'fixture error' });
    });
  });

  describe('Edge cases', () => {
    it('should handle null error body in API response', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/cards`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/cards`);
      request.flush(null, { status: 500, statusText: 'Server Error' });

      expect(caught).toBeInstanceOf(Error);
      expect((caught as { status: number }).status).toBe(500);
    });

    it('should handle empty object as error body', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/cards`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/cards`);
      request.flush({}, { status: 500, statusText: 'Server Error' });

      expect(caught).toBeInstanceOf(Error);
      expect((caught as { status: number }).status).toBe(500);
    });

    it('should handle HttpErrorResponse with empty message string', () => {
      let caught: unknown;

      http.get(`${environment.apiUrl}/cards`).subscribe({
        error: (error) => {
          caught = error;
        },
      });

      const request = httpMock.expectOne(`${environment.apiUrl}/cards`);
      request.flush({ message: '   ' }, { status: 400, statusText: 'Bad Request' });

      expect(caught).toBeInstanceOf(Error);
      expect((caught as { status: number }).status).toBe(400);
    });
  });
});

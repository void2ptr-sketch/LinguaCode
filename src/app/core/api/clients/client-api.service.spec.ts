import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ClientApi } from './client-api.service';
import { ApiListResponse, ApiResponse } from '../api.types';

describe('ApiClient', () => {
  let service: ClientApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientApi],
    });

    service = TestBed.inject(ClientApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('get', () => {
    it('should return parsed response body', async () => {
      const expectedData = { id: '1', name: 'Test' };
      const path = '/test/resource';

      const promise = service.get<typeof expectedData>(path);

      const req = httpMock.expectOne('/api/test/resource');
      expect(req.request.method).toBe('GET');
      req.flush(expectedData);

      const result = await promise;
      expect(result).toEqual(expectedData);
    });
  });

  describe('getData', () => {
    it('should extract data field from response envelope', async () => {
      const expectedData = { id: '1', value: 'hello' };
      const envelope: ApiResponse<typeof expectedData> = { data: expectedData };
      const path = '/data/endpoint';

      const promise = service.getData<typeof expectedData>(path);

      const req = httpMock.expectOne('/api/data/endpoint');
      expect(req.request.method).toBe('GET');
      req.flush(envelope);

      const result = await promise;
      expect(result).toEqual(expectedData);
    });

    it('should throw when API returns error', async () => {
      const path = '/error/endpoint';

      const promise = service.getData(path);

      const req = httpMock.expectOne('/api/error/endpoint');
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toThrow();
    });
  });

  describe('getList', () => {
    it('should extract data array from list response envelope', async () => {
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const envelope: ApiListResponse<(typeof items)[0]> = { data: items, total: 3 };
      const path = '/list/endpoint';

      const promise = service.getList(path);

      const req = httpMock.expectOne('/api/list/endpoint');
      expect(req.request.method).toBe('GET');
      req.flush(envelope);

      const result = await promise;
      expect(result).toEqual(items);
    });

    it('should handle empty list response', async () => {
      const envelope: ApiListResponse<never> = { data: [], total: 0 };
      const path = '/empty/list';

      const promise = service.getList(path);

      const req = httpMock.expectOne('/api/empty/list');
      req.flush(envelope);

      const result = await promise;
      expect(result).toEqual([]);
    });
  });

  describe('post', () => {
    it('should send POST request with body and return response', async () => {
      const body = { name: 'New Item' };
      const expectedData = { id: 'new-1', ...body };
      const path = '/create/resource';

      const promise = service.post<typeof expectedData, typeof body>(path, body);

      const req = httpMock.expectOne('/api/create/resource');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(expectedData);

      const result = await promise;
      expect(result).toEqual(expectedData);
    });

    it('should throw when POST request fails', async () => {
      const body = { invalid: 'data' };
      const path = '/fail/endpoint';

      const promise = service.post(path, body);

      const req = httpMock.expectOne('/api/fail/endpoint');
      req.flush({ message: 'Validation error' }, { status: 400, statusText: 'Bad Request' });

      await expect(promise).rejects.toThrow();
    });
  });

  describe('postData', () => {
    it('should send POST request and extract data field', async () => {
      const body = { title: 'Updated' };
      const extractedData = { id: 'upd-1', ...body };
      const envelope: ApiResponse<typeof extractedData> = { data: extractedData };
      const path = '/update/resource';

      const promise = service.postData<typeof extractedData, typeof body>(path, body);

      const req = httpMock.expectOne('/api/update/resource');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(envelope);

      const result = await promise;
      expect(result).toEqual(extractedData);
    });

    it('should handle POST data error response', async () => {
      const body = { action: 'delete' };
      const path = '/delete/resource';

      const promise = service.postData(path, body);

      const req = httpMock.expectOne('/api/delete/resource');
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

      await expect(promise).rejects.toThrow();
    });
  });
});

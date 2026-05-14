import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { apiResponseInterceptor } from './api-response.interceptor';

describe('apiResponseInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiResponseInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('unwraps the data field from a wrapped API response', async () => {
    const promise = firstValueFrom(http.get<string[]>('/api/test'));
    controller.expectOne('/api/test').flush({ status: 200, message: 'Success', data: ['a', 'b', 'c'] });
    expect(await promise).toEqual(['a', 'b', 'c']);
  });

  it('unwraps a wrapped object response', async () => {
    const payload = { id: '1', name: 'Grant' };
    const promise = firstValueFrom(http.get<typeof payload>('/api/users/1'));
    controller.expectOne('/api/users/1').flush({ status: 200, message: 'Success', data: payload });
    expect(await promise).toEqual(payload);
  });

  it('passes through a non-wrapped array response unchanged', async () => {
    const promise = firstValueFrom(http.get<number[]>('/api/raw'));
    controller.expectOne('/api/raw').flush([1, 2, 3]);
    expect(await promise).toEqual([1, 2, 3]);
  });

  it('passes through a null body unchanged', async () => {
    const promise = firstValueFrom(http.delete<null>('/api/items/1'));
    controller.expectOne('/api/items/1').flush(null);
    expect(await promise).toBeNull();
  });
});

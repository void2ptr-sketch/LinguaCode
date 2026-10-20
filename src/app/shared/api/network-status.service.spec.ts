import { TestBed } from '@angular/core/testing';

import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  let savedNavigator: Navigator | undefined;
  let savedWindow: Window | undefined;

  beforeEach(() => {
    savedNavigator = globalThis.navigator;
    savedWindow = globalThis.window;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: savedNavigator,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: savedWindow,
      writable: true,
    });
  });

  it('should be created', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkStatusService);
    expect(service).toBeTruthy();
  });

  it('should return true when navigator.onLine is true', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkStatusService);
    expect(service.online()).toBe(true);
  });

  it('should return false when navigator.onLine is false', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkStatusService);
    expect(service.online()).toBe(false);
  });

  it('should default to true when navigator is undefined', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: undefined,
      writable: true,
    });

    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkStatusService);
    expect(service.online()).toBe(true);
  });

  it('should set online to true when online event fires', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkStatusService);
    expect(service.online()).toBe(false);

    // Simulate online event
    const onlineEvent = new Event('online');
    globalThis.window.dispatchEvent(onlineEvent);

    expect(service.online()).toBe(true);
  });

  it('should set online to false when offline event fires', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    TestBed.configureTestingModule({});
    const service = TestBed.inject(NetworkStatusService);
    expect(service.online()).toBe(true);

    // Simulate offline event
    const offlineEvent = new Event('offline');
    globalThis.window.dispatchEvent(offlineEvent);

    expect(service.online()).toBe(false);
  });
});

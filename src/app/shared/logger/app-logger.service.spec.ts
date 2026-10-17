import { TestBed } from '@angular/core/testing';

import { AppLoggerService } from './app-logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(vi.fn());
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(vi.fn());

    TestBed.configureTestingModule({});
    service = TestBed.inject(AppLoggerService);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log error with prefix', () => {
    service.error('test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[LinguaCode] test error', '');
  });

  it('should log error with context', () => {
    const ctx = { code: 500 };
    service.error('test error', ctx);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[LinguaCode] test error', ctx);
  });

  it('should log warn with prefix', () => {
    service.warn('test warn');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[LinguaCode] test warn', '');
  });

  it('should log warn with context', () => {
    const ctx = { code: 400 };
    service.warn('test warn', ctx);
    expect(consoleWarnSpy).toHaveBeenCalledWith('[LinguaCode] test warn', ctx);
  });

  it('should log info with prefix', () => {
    service.info('test info');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[LinguaCode] test info', '');
  });

  it('should log info with context', () => {
    const ctx = { key: 'value' };
    service.info('test info', ctx);
    expect(consoleInfoSpy).toHaveBeenCalledWith('[LinguaCode] test info', ctx);
  });

  it('should log debug with prefix', () => {
    service.debug('test debug');
    expect(consoleDebugSpy).toHaveBeenCalledWith('[LinguaCode] test debug', '');
  });

  it('should log debug with context', () => {
    const ctx = { debug: true };
    service.debug('test debug', ctx);
    expect(consoleDebugSpy).toHaveBeenCalledWith('[LinguaCode] test debug', ctx);
  });

  it('should pass empty string when context is null', () => {
    service.error('test error', null);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[LinguaCode] test error', '');
  });

  it('should pass empty string when context is undefined', () => {
    service.error('test error', undefined);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[LinguaCode] test error', '');
  });
});

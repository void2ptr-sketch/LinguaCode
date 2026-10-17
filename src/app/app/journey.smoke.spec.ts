import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttp } from './api/provide-api.http';
import { AppLoggerService } from '../shared/logger/app-logger.service';
import { seedTestContentCache } from '../entities/content-seed/content-seed.test-utils';

describe('Journey page smoke', () => {
  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideApiHttp(),
        provideHttpClientTesting(),
        {
          provide: AppLoggerService,
          useValue: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render the journey map for the course from query params', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigate(['journey'], { queryParams: { courseId: 'demo-course' } });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Карта');
    // Query-параметр ?courseId= должен определять содержимое карты,
    // а не активный курс дашборда (fallback по умолчанию — «214 китайских радикалов»).
    expect(text).toContain('Демо-сценарий');
    expect(text).not.toContain('214 китайских радикалов');

    fixture.destroy();
  });
});

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideApiHttp } from './api/provide-api.http';
import { seedTestContentCache } from '../entities/content-seed/content-seed.test-utils';

describe('Card editor smoke', () => {
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
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render the card editor catalog with cards list', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/tools/cards');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Карточки');
    expect(text).toContain('Создать карточку');

    fixture.destroy();
  });
});

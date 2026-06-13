import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from '../../app.component';
import { routes } from '../../app.routes';
import { provideApiHttp } from '../../core/api';

const demoCards = [
  {
    id: 'select-1',
    kind: 'select',
    title: 'Приветствие',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    question: 'Как сказать «Привет» по-английски?',
    options: ['Hello', 'Goodbye'],
    correctIndex: 0,
  },
  {
    id: 'select-2',
    kind: 'select',
    title: 'Числа',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    question: 'Q2',
    options: ['1', '2'],
    correctIndex: 0,
  },
  {
    id: 'select-3',
    kind: 'select',
    title: 'Прощание',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    question: 'Q3',
    options: ['X', 'Y'],
    correctIndex: 0,
  },
] as const;

describe('Card select smoke', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        provideApiHttp(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should load scenario cards and render the first question', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);

    await router.navigateByUrl('/cards/select');
    fixture.detectChanges();

    const flushFixtures = (): void => {
      for (const request of httpMock.match(() => true)) {
        if (request.request.url.includes('select-cards.json')) {
          request.flush({ cards: demoCards });
        }

        if (request.request.url.includes('card-index-meta.json')) {
          request.flush({ metaById: {} });
        }
      }
    };

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Карточки обучения');
    expect(text).toContain('Демо-сценарий');
    expect(text).toContain('Как сказать «Привет» по-английски?');
    expect(text).toContain('Hello');

    httpMock.verify();
  });
});

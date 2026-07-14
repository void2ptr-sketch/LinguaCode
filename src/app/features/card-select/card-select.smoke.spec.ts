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
    direction: 'known-to-learning',
    promptKnown: 'Как сказать «Привет» по-английски?',
    optionsLearning: ['Hello', 'Goodbye'],
    correctIndex: 0,
  },
  {
    id: 'select-2',
    kind: 'select',
    title: 'Числа',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Q2',
    optionsLearning: ['1', '2'],
    correctIndex: 0,
  },
  {
    id: 'select-3',
    kind: 'select',
    title: 'Прощание',
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: 'Q3',
    optionsLearning: ['X', 'Y'],
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
          continue;
        }

        if (request.request.url.includes('radicals-course-cards.json')) {
          request.flush({ cards: [] });
          continue;
        }
      }
    };

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    const tabLabels = Array.from(
      fixture.nativeElement.querySelectorAll('.mdc-tab__text-label') as NodeListOf<HTMLElement>,
    ).map((element) => element.textContent?.trim());
    const scenariosTabIndex = tabLabels.indexOf('Сценарии');
    expect(scenariosTabIndex).toBeGreaterThanOrEqual(0);

    const tabButtons = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLElement>;
    tabButtons[scenariosTabIndex]?.click();
    fixture.detectChanges();

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    const scenarioItem = fixture.nativeElement.querySelector(
      '.scenario-picker__item',
    ) as HTMLElement | null;
    expect(scenarioItem).withContext('scenario list item').not.toBeNull();
    scenarioItem?.click();
    fixture.detectChanges();

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    const startButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.trim() === 'Начать практику');
    expect(startButton).withContext('start practice button').toBeTruthy();
    startButton?.click();
    fixture.detectChanges();

    flushFixtures();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Практика');
    expect(text).toContain('Демо-сценарий');
    expect(text).toContain('Как сказать «Привет» по-английски?');
    expect(text).toContain('Hello');

    httpMock.verify();
  });
});

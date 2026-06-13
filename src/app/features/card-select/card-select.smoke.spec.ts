import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from '../../app.component';
import { routes } from '../../app.routes';
import { provideApiHttp } from '../../core/api';
import { CardSelectFixture } from './types';

const FIXTURE: CardSelectFixture = {
  scenarioId: 'demo-scenario',
  cards: [
    {
      id: 'select-1',
      kind: 'select',
      title: 'Приветствие',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      question: 'Как сказать «Привет» по-английски?',
      options: ['Hello', 'Goodbye'],
      correctIndex: 0,
    },
  ],
};

describe('Card select smoke', () => {
  beforeEach(async () => {
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

  it('should load cards and render the first question', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const httpMock = TestBed.inject(HttpTestingController);

    await router.navigateByUrl('/cards/select');
    fixture.detectChanges();

    const request = httpMock.expectOne('/data/select-cards.json');
    request.flush(FIXTURE);

    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Карточки обучения');
    expect(text).toContain('Как сказать «Привет» по-английски?');
    expect(text).toContain('Hello');
  });
});

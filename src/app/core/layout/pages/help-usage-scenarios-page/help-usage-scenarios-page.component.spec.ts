import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HelpUsageScenariosPageComponent } from './help-usage-scenarios-page.component';
import { HELP_USAGE_SCENARIOS } from '../../../layout/data/help-usage-scenarios.data';

describe('HelpUsageScenariosPageComponent', () => {
  let component: HelpUsageScenariosPageComponent;
  let fixture: ComponentFixture<HelpUsageScenariosPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpUsageScenariosPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpUsageScenariosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should expose scenarios data', () => {
    expect(component.scenarios).toBe(HELP_USAGE_SCENARIOS);
  });

  it('should have scenarios as an array', () => {
    expect(Array.isArray(component.scenarios)).toBe(true);
  });

  it('should have at least one scenario', () => {
    expect(component.scenarios.length).toBeGreaterThan(0);
  });

  // --- template rendering ---

  it('should display hero eyebrow text', () => {
    const eyebrowEl = fixture.nativeElement.querySelector('.help-scenarios__eyebrow');
    expect(eyebrowEl.textContent).toContain('LinguaCode');
  });

  it('should display hero title', () => {
    const titleEl = fixture.nativeElement.querySelector('.help-scenarios__title');
    expect(titleEl.textContent).toContain('Один инструмент — десятки сценариев');
  });

  it('should display hero lead text', () => {
    const leadEl = fixture.nativeElement.querySelector('.help-scenarios__lead');
    expect(leadEl.textContent).toContain('От первого слова до технического интервью');
  });

  it('should render primary CTA with correct label and routerLink', () => {
    const primaryBtn = fixture.nativeElement.querySelector('a[mat-flat-button]');
    expect(primaryBtn).toBeDefined();
    expect(primaryBtn!.textContent.trim()).toContain('Попробовать бесплатно');
    expect(primaryBtn!.getAttribute('routerLink')).toBe('/home');
  });

  it('should render all scenario cards', () => {
    const scenarioCards = fixture.nativeElement.querySelectorAll('.help-scenarios__card');
    expect(scenarioCards.length).toBe(HELP_USAGE_SCENARIOS.length);
  });

  it('should render scenario card icons', () => {
    const iconEls = fixture.nativeElement.querySelectorAll('.help-scenarios__icon');
    HELP_USAGE_SCENARIOS.forEach((scenario, index) => {
      expect(iconEls[index].textContent.trim()).toContain(scenario.icon);
    });
  });

  it('should render scenario card titles', () => {
    const cardTitles = fixture.nativeElement.querySelectorAll('mat-card-title');
    HELP_USAGE_SCENARIOS.forEach((scenario, index) => {
      expect(cardTitles[index].textContent).toContain(scenario.title);
    });
  });

  it('should render scenario card taglines', () => {
    const cardSubtitles = fixture.nativeElement.querySelectorAll('mat-card-subtitle');
    HELP_USAGE_SCENARIOS.forEach((scenario, index) => {
      expect(cardSubtitles[index].textContent).toContain(scenario.tagline);
    });
  });

  it('should render scenario audience chips', () => {
    const chipEls = fixture.nativeElement.querySelectorAll('mat-chip[disabled]');
    HELP_USAGE_SCENARIOS.forEach((scenario, index) => {
      expect(chipEls[index].textContent).toContain(scenario.audience);
    });
  });

  it('should render scenario highlights', () => {
    const allHighlightLists = fixture.nativeElement.querySelectorAll('.help-scenarios__highlights');
    HELP_USAGE_SCENARIOS.forEach((scenario, listIndex) => {
      const highlightItems = allHighlightLists[listIndex].querySelectorAll('li');
      expect(highlightItems.length).toBe(scenario.highlights.length);
      scenario.highlights.forEach((item, itemIndex) => {
        expect(highlightItems[itemIndex].textContent).toContain(item);
      });
    });
  });

  it('should render scenario CTA buttons with correct labels', () => {
    const allAnchors = fixture.nativeElement.querySelectorAll(
      'mat-card-actions a[mat-stroked-button]',
    );
    HELP_USAGE_SCENARIOS.forEach((scenario, index) => {
      expect(allAnchors[index].textContent.trim()).toContain(scenario.ctaLabel);
    });
  });

  it('should render footer with help link', () => {
    const footerEl = fixture.nativeElement.querySelector('.help-scenarios__footer');
    expect(footerEl).toBeDefined();
    expect(footerEl.textContent).toContain('Нужна справка по интерфейсу');
  });

  it('should render footer link to help page', () => {
    const footerLink = fixture.nativeElement.querySelector(
      '.help-scenarios__footer a[routerLink="/help"]',
    );
    expect(footerLink).toBeDefined();
    expect(footerLink!.textContent).toContain('Вернуться на страницу «Справка»');
  });
});

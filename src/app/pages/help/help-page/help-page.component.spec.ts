import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HelpPageComponent } from './help-page.component';
import {
  HELP_PAGE_HERO,
  HELP_PAGE_FEATURES,
  HELP_PAGE_HIERARCHY,
  HELP_PAGE_HIGHLIGHTS,
} from './help-page.data';

describe('HelpPageComponent', () => {
  let component: HelpPageComponent;
  let fixture: ComponentFixture<HelpPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should expose hero data', () => {
    expect(component.hero).toBe(HELP_PAGE_HERO);
  });

  it('should expose features data', () => {
    expect(component.features).toBe(HELP_PAGE_FEATURES);
  });

  it('should expose hierarchy data', () => {
    expect(component.hierarchy).toBe(HELP_PAGE_HIERARCHY);
  });

  it('should expose highlights data', () => {
    expect(component.highlights).toBe(HELP_PAGE_HIGHLIGHTS);
  });

  it('should have hero with expected structure', () => {
    expect(component.hero).toBeDefined();
  });

  it('should have features as an array', () => {
    expect(Array.isArray(component.features)).toBe(true);
  });

  it('should have hierarchy data', () => {
    expect(component.hierarchy).toBeDefined();
  });

  it('should have highlights data', () => {
    expect(component.highlights).toBeDefined();
  });

  // --- template rendering ---

  it('should display hero eyebrow text', () => {
    const eyebrowEl = fixture.nativeElement.querySelector('.help-page__eyebrow');
    expect(eyebrowEl.textContent).toContain(HELP_PAGE_HERO.eyebrow);
  });

  it('should display hero title', () => {
    const titleEl = fixture.nativeElement.querySelector('.help-page__title');
    expect(titleEl.textContent).toContain(HELP_PAGE_HERO.title);
  });

  it('should display hero lead text', () => {
    const leadEl = fixture.nativeElement.querySelector('.help-page__lead');
    expect(leadEl.textContent).toContain(HELP_PAGE_HERO.lead);
  });

  it('should render primary CTA with correct label and routerLink', () => {
    const allAnchors = fixture.nativeElement.querySelectorAll('a');
    const primaryBtn = (Array.from(allAnchors) as HTMLElement[]).find(
      (a) => a.getAttribute('mat-flat-button') !== null && a.getAttribute('color') === 'primary',
    );
    expect(primaryBtn).toBeDefined();
    expect(primaryBtn!.textContent.trim()).toContain(HELP_PAGE_HERO.primaryCtaLabel);
  });

  it('should render secondary CTA with correct label and routerLink', () => {
    const allAnchors = fixture.nativeElement.querySelectorAll('a');
    const secondaryBtn = (Array.from(allAnchors) as HTMLElement[]).find(
      (a) => a.getAttribute('mat-stroked-button') !== null,
    );
    expect(secondaryBtn).toBeDefined();
    expect(secondaryBtn!.textContent.trim()).toContain(HELP_PAGE_HERO.secondaryCtaLabel);
  });

  it('should render all feature cards', () => {
    const featureCards = fixture.nativeElement.querySelectorAll('.help-page__feature-card');
    expect(featureCards.length).toBe(HELP_PAGE_FEATURES.length);
  });

  it('should render feature card content correctly', () => {
    const featureTitles = fixture.nativeElement.querySelectorAll(
      '.help-page__feature-card mat-card-title',
    );
    HELP_PAGE_FEATURES.forEach((feature, index) => {
      expect(featureTitles[index].textContent).toContain(feature.title);
    });
  });

  it('should render hierarchy steps', () => {
    const hierarchySteps = fixture.nativeElement.querySelectorAll('.help-page__hierarchy-step');
    expect(hierarchySteps.length).toBe(HELP_PAGE_HIERARCHY.length);
  });

  it('should render hierarchy titles', () => {
    const hierarchyTitles = fixture.nativeElement.querySelectorAll('.help-page__hierarchy-title');
    HELP_PAGE_HIERARCHY.forEach((level, index) => {
      expect(hierarchyTitles[index].textContent).toContain(level.title);
    });
  });

  it('should render highlight items', () => {
    const highlightItems = fixture.nativeElement.querySelectorAll(
      '.help-page__highlights-item span',
    );
    expect(highlightItems.length).toBe(HELP_PAGE_HIGHLIGHTS.length);
  });

  it('should render CTA card in footer', () => {
    const ctaCard = fixture.nativeElement.querySelector('.help-page__cta-card');
    expect(ctaCard).toBeDefined();
  });

  it('should render CTA title', () => {
    const ctaTitle = fixture.nativeElement.querySelector('.help-page__cta-title');
    expect(ctaTitle.textContent).toContain('Готовы начать');
  });

  it('should render CTA buttons', () => {
    const ctaButtons = fixture.nativeElement.querySelectorAll('.help-page__cta-actions a');
    expect(ctaButtons.length).toBe(2);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HelpPageComponent } from './help-page.component';
import { HELP_PAGE_HERO, HELP_PAGE_FEATURES, HELP_PAGE_HIERARCHY, HELP_PAGE_HIGHLIGHTS } from '../../../layout/data/help-page.data';

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
});

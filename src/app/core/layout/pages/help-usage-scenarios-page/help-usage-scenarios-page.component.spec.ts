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
});

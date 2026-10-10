import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent, RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
                getAll: () => [],
                has: () => false,
                keys: [] as string[],
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose two tabs', () => {
    expect(component.tabs).toHaveLength(2);
  });

  it('should have "Обучение" tab with exact matching', () => {
    const learningTab = component.tabs[0];
    expect(learningTab.label).toBe('Обучение');
    expect(learningTab.path).toBe('/home');
    expect(learningTab.exact).toBe(true);
  });

  it('should have "Прогресс" tab without exact flag', () => {
    const progressTab = component.tabs[1];
    expect(progressTab.label).toBe('Прогресс');
    expect(progressTab.path).toBe('/home/progress');
    expect(progressTab.exact).toBeUndefined();
  });

  it('should render tab navigation section', () => {
    const section = fixture.nativeElement.querySelector('section.home-page');
    expect(section).toBeTruthy();
  });

  it('should render mat-tab-nav-bar', () => {
    const navBar = fixture.nativeElement.querySelector('[mat-tab-nav-bar]');
    expect(navBar).toBeTruthy();
  });

  it('should render router-outlet for tab content', () => {
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });
});

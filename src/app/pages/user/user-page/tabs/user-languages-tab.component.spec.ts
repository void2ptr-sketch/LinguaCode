import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { UserLanguagesTabComponent } from './user-languages-tab.component';
import { LanguageService } from '../../../../entities/language-pair/services/language.service';
import { UserLanguagePairManagerService } from '../../../../entities/language-pair/services/user-language-pair-manager.service';
import { LanguageSettingsStore } from '../../../../entities/language-pair/store/language-settings.store';
import { RoleService } from '../../../../entities/auth/services/role.service';
import type { LanguageDto } from '../../../../entities/language-pair/api/language-dto.types';

describe('UserLanguagesTabComponent', () => {
  let fixture: ComponentFixture<UserLanguagesTabComponent>;
  let component: UserLanguagesTabComponent;
  let router: Router;

  const mockLanguages: LanguageDto[] = [
    {
      id: 1,
      code: 'en',
      displayName: 'English',
      nativeName: 'English',
      writingDir: 'ltr',
      supportsTones: false,
      supportsPinyin: false,
      fontFamily: '',
      activeFlag: true,
    },
    {
      id: 2,
      code: 'zh',
      displayName: 'Chinese',
      nativeName: '中文',
      writingDir: 'ltr',
      supportsTones: true,
      supportsPinyin: true,
      fontFamily: '',
      activeFlag: true,
    },
    {
      id: 3,
      code: 'ru',
      displayName: 'Russian',
      nativeName: 'Русский',
      writingDir: 'ltr',
      supportsTones: false,
      supportsPinyin: false,
      fontFamily: '',
      activeFlag: false,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UserLanguagesTabComponent,
        FormsModule,
        MatCardModule,
        MatCheckboxModule,
        MatTooltipModule,
      ],
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            languages: vi.fn(() => mockLanguages),
            getCodes: vi.fn(() => ['en', 'zh', 'ru']),
          },
        },
        {
          provide: UserLanguagePairManagerService,
          useValue: {
            loading: vi.fn(() => false),
          },
        },
        {
          provide: RoleService,
          useValue: {
            canManageSystem: vi.fn(() => false),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
          },
        },
        provideRouter([]),
      ],
    });

    fixture = TestBed.createComponent(UserLanguagesTabComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should expose loading signal', () => {
    expect(component.loading).toBeDefined();
    expect(component.loading()).toBe(false);
  });

  it('should expose selectedCodes signal', () => {
    expect(component.selectedCodes).toBeDefined();
    expect(Array.isArray(component.selectedCodes())).toBe(true);
  });

  it('should expose availableLanguages signal', () => {
    expect(component.availableLanguages).toBeDefined();
    expect(component.availableLanguages()).toEqual(mockLanguages);
  });

  it('should expose canManageLanguages signal', () => {
    expect(component.canManageLanguages).toBeDefined();
    expect(component.canManageLanguages()).toBe(false);
  });

  it('should have toggleLanguage method', () => {
    expect(component.toggleLanguage).toBeDefined();
    expect(typeof component.toggleLanguage).toBe('function');
  });

  it('should have openLanguageAdmin method', () => {
    expect(component.openLanguageAdmin).toBeDefined();
    expect(typeof component.openLanguageAdmin).toBe('function');
  });

  it('should navigate to /admin when openLanguageAdmin is called', async () => {
    await component.openLanguageAdmin();
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.page-card__tab-panel')).toBeTruthy();
  });

  it('should render language items when languages are available', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.settings-page__languages-grid')).toBeTruthy();
  });

  afterEach(() => {
    sessionStorage.clear();
  });
});

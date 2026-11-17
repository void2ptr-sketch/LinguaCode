import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Component } from '@angular/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { LoginPageComponent } from './login-page.component';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { LanguageService } from '../../../entities/language-pair/lib';
import type { LoginCredentials } from '../../../entities/auth/model/auth.types';

// Dummy component for lazy route
@Component({ standalone: true, template: '' })
class DummyForgotPasswordComponent {}

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let loginSpy: ReturnType<typeof vi.fn>;
  let loadSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loginSpy = vi.fn();
    loadSpy = vi.fn(() => Promise.resolve());

    TestBed.configureTestingModule({
      imports: [
        LoginPageComponent,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        RouterLink,
        RouterLinkActive,
        DummyForgotPasswordComponent,
      ],
      providers: [
        provideRouter([{ path: 'auth/forgot-password', component: DummyForgotPasswordComponent }]),
        {
          provide: AuthStore,
          useValue: {
            isAuthenticating: () => false,
            error: () => null,
            login: loginSpy,
          },
        },
        {
          provide: LanguageService,
          useValue: { load: loadSpy },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have idle status by default', () => {
    expect(component.status()).toBe('idle');
  });

  it('should not show success when status is idle', () => {
    expect(component.showSuccess()).toBe(false);
  });

  it('should show success when status is success', () => {
    component.status.set('success');
    expect(component.showSuccess()).toBe(true);
  });

  it('should not show error when status is idle', () => {
    expect(component.showError()).toBe(false);
  });

  it('should not show error when status is error but error signal is null', () => {
    component.status.set('error');
    expect(component.showError()).toBe(false);
  });

  it('should call authStore.login with credentials on valid form submit', async () => {
    loginSpy.mockResolvedValue(true);

    const credentials: LoginCredentials = { email: 'test@test.com', password: 'password' };
    await component.onSubmit(credentials, { invalid: false } as never);

    expect(loginSpy).toHaveBeenCalledWith(credentials);
  });

  it('should mark form as touched when form is invalid', async () => {
    const markAllAsTouchedSpy = vi.fn();
    const credentials: LoginCredentials = { email: '', password: '' };
    await component.onSubmit(credentials, {
      invalid: true,
      control: { markAllAsTouched: markAllAsTouchedSpy },
    } as never);

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('should set error status on failed login', async () => {
    loginSpy.mockResolvedValue(false);

    const credentials: LoginCredentials = { email: 'test@test.com', password: 'wrong' };
    await component.onSubmit(credentials, { invalid: false } as never);

    expect(component.status()).toBe('error');
  });

  it('should call languageService.load on successful login', async () => {
    loginSpy.mockResolvedValue(true);

    const credentials: LoginCredentials = { email: 'test@test.com', password: 'password' };
    await component.onSubmit(credentials, { invalid: false } as never);

    expect(loadSpy).toHaveBeenCalled();
  });
});

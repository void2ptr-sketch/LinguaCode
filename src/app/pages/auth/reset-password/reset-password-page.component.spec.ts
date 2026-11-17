import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ResetPasswordPageComponent } from './reset-password-page.component';
import { AuthApiService } from '../../../entities/auth/api/auth-api.service';

// Dummy component for lazy route
@Component({ standalone: true, template: '' })
class DummyForgotPasswordComponent {}

@Component({ standalone: true, template: '' })
class DummyLoginComponent {}

describe('ResetPasswordPageComponent', () => {
  let component: ResetPasswordPageComponent;
  let fixture: ComponentFixture<ResetPasswordPageComponent>;
  let authApiSpy: { resetPassword: ReturnType<typeof vi.fn> };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authApiSpy = {
      resetPassword: vi.fn().mockResolvedValue(undefined),
    };
    snackBarSpy = { open: vi.fn() };

    TestBed.configureTestingModule({
      imports: [
        ResetPasswordPageComponent,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatSnackBarModule,
        RouterLink,
        DummyForgotPasswordComponent,
        DummyLoginComponent,
      ],
      providers: [
        provideRouter([
          { path: 'auth/forgot-password', component: DummyForgotPasswordComponent },
          { path: 'auth/login', component: DummyLoginComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { email: 'test@test.com', token: 'mock-token' },
            },
          },
        },
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    fixture = TestBed.createComponent(ResetPasswordPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have empty password by default', () => {
    expect(component.password()).toBe('');
  });

  it('should have empty confirmPassword by default', () => {
    expect(component.confirmPassword()).toBe('');
  });

  it('should have showPassword false by default', () => {
    expect(component.showPassword()).toBe(false);
  });

  it('should have idle submitting state by default', () => {
    expect(component.submitting()).toBe(false);
  });

  it('should have passwordsMatch true when confirm is empty', () => {
    component.password.set('password123');
    expect(component.passwordsMatch()).toBe(true);
  });

  it('should have passwordsMatch true when passwords match', () => {
    component.password.set('password123');
    component.confirmPassword.set('password123');
    expect(component.passwordsMatch()).toBe(true);
  });

  it('should have passwordsMatch false when passwords differ', () => {
    component.password.set('password123');
    component.confirmPassword.set('different');
    expect(component.passwordsMatch()).toBe(false);
  });

  it('should have passwordTooShort false when password is empty', () => {
    expect(component.passwordTooShort()).toBe(false);
  });

  it('should have passwordTooShort true when password is 5 chars', () => {
    component.password.set('abcde');
    expect(component.passwordTooShort()).toBe(true);
  });

  it('should have passwordTooShort false when password is 8 chars', () => {
    component.password.set('abcdefgh');
    expect(component.passwordTooShort()).toBe(false);
  });

  it('should have passwordStrength 0 for empty password', () => {
    expect(component.passwordStrength()).toBe(0);
  });

  it('should have passwordStrength 0 for short password', () => {
    component.password.set('abc');
    expect(component.passwordStrength()).toBe(0);
  });

  it('should have passwordStrength 1 for password with only lowercase', () => {
    component.password.set('abcdefgh');
    expect(component.passwordStrength()).toBe(1);
  });

  it('should have passwordStrength 2 for password with lowercase and uppercase', () => {
    component.password.set('Abcdefgh');
    expect(component.passwordStrength()).toBe(2);
  });

  it('should have passwordStrength 3 for password with lowercase, uppercase and digits', () => {
    component.password.set('Abcdefg1');
    expect(component.passwordStrength()).toBe(3);
  });

  it('should have passwordStrength 4 for password with all character types', () => {
    component.password.set('Abcdefg1!');
    expect(component.passwordStrength()).toBe(4);
  });

  it('should have strengthLabel empty for strength 0', () => {
    expect(component.strengthLabel()).toBe('');
  });

  it('should have strengthLabel for strength 1', () => {
    component.password.set('abcdefgh');
    expect(component.strengthLabel()).toBe('Слабый');
  });

  it('should have strengthLabel for strength 2', () => {
    component.password.set('Abcdefgh');
    expect(component.strengthLabel()).toBe('Средний');
  });

  it('should have strengthLabel for strength 3', () => {
    component.password.set('Abcdefg1');
    expect(component.strengthLabel()).toBe('Хороший');
  });

  it('should have strengthLabel for strength 4', () => {
    component.password.set('Abcdefg1!');
    expect(component.strengthLabel()).toBe('Отличный');
  });

  it('should have strengthColor red for strength 1', () => {
    component.password.set('abcdefgh');
    expect(component.strengthColor()).toBe('#f44336');
  });

  it('should have strengthColor orange for strength 2', () => {
    component.password.set('Abcdefgh');
    expect(component.strengthColor()).toBe('#ff9800');
  });

  it('should have strengthColor green for strength 3', () => {
    component.password.set('Abcdefg1');
    expect(component.strengthColor()).toBe('#4caf50');
  });

  it('should have strengthColor dark green for strength 4', () => {
    component.password.set('Abcdefg1!');
    expect(component.strengthColor()).toBe('#2e7d32');
  });

  it('should have disabled submit when password is empty', () => {
    expect(component.submitDisabled()).toBe(true);
  });

  it('should have disabled submit when password is too short', () => {
    component.password.set('abc');
    expect(component.submitDisabled()).toBe(true);
  });

  it('should have disabled submit when confirm is empty', () => {
    component.password.set('abcdefgh');
    expect(component.submitDisabled()).toBe(true);
  });

  it('should have disabled submit when passwords do not match', () => {
    component.password.set('abcdefgh');
    component.confirmPassword.set('different1');
    expect(component.submitDisabled()).toBe(true);
  });

  it('should have enabled submit when all conditions are met', () => {
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    expect(component.submitDisabled()).toBe(false);
  });

  it('should have disabled submit when submitting', () => {
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    component.submitting.set(true);
    expect(component.submitDisabled()).toBe(true);
  });

  it('should call authApi.resetPassword with token from query params', async () => {
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    await component.onSubmit();

    expect(authApiSpy.resetPassword).toHaveBeenCalledWith({
      resetToken: 'mock-token',
      newPassword: 'abcdefgh',
    });
  });

  it('should show success snackbar on submit', async () => {
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    await component.onSubmit();

    expect(snackBarSpy.open).toHaveBeenCalledWith('Пароль успешно сброшен', 'Закрыть', {
      duration: 3000,
    });
  });

  it('should show error snackbar on API failure', async () => {
    authApiSpy.resetPassword.mockRejectedValue(new Error('Network error'));
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    await component.onSubmit();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось сбросить пароль. Попробуйте позже.',
      'Закрыть',
      { duration: 5000 },
    );
  });

  it('should set submitting to false after success', async () => {
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  it('should set submitting to false after failure', async () => {
    authApiSpy.resetPassword.mockRejectedValue(new Error('Network error'));
    component.password.set('abcdefgh');
    component.confirmPassword.set('abcdefgh');
    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  // Edge cases for missing email/token are covered by the component's conditional logic.
  // The main onSubmit flow with valid email+token is tested above.
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideRouter, RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { VerifyCodePageComponent } from './verify-code-page.component';
import { AuthApiService } from '../../../entities/auth/api/auth-api.service';

// Dummy component for lazy route
@Component({ standalone: true, template: '' })
class DummyForgotPasswordComponent {}

describe('VerifyCodePageComponent', () => {
  let component: VerifyCodePageComponent;
  let fixture: ComponentFixture<VerifyCodePageComponent>;
  let authApiSpy: {
    verifyResetCode: ReturnType<typeof vi.fn>;
    forgotPassword: ReturnType<typeof vi.fn>;
  };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let router: Router;

  const mockEmail = 'test@example.com';

  beforeEach(async () => {
    authApiSpy = {
      verifyResetCode: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      forgotPassword: vi.fn().mockResolvedValue({}),
    };
    snackBarSpy = { open: vi.fn() };

    TestBed.configureTestingModule({
      imports: [
        VerifyCodePageComponent,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        RouterLink,
        DummyForgotPasswordComponent,
      ],
      providers: [
        provideRouter([
          { path: 'auth/forgot-password', component: DummyForgotPasswordComponent },
          { path: 'auth/reset-password', component: DummyForgotPasswordComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { email: mockEmail },
            },
          },
        },
        { provide: AuthApiService, useValue: authApiSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    fixture = TestBed.createComponent(VerifyCodePageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have empty code by default', () => {
    expect(component.code()).toBe('');
  });

  it('should have email from route query params after init', () => {
    expect(component.email()).toBe(mockEmail);
  });

  it('should have idle submitting state by default', () => {
    expect(component.submitting()).toBe(false);
  });

  it('should have idle resendLoading state by default', () => {
    expect(component.resendLoading()).toBe(false);
  });

  it('should have countdown at 60 by default', () => {
    expect(component.countdown()).toBe(60);
  });

  it('should have invalid valid state when code is empty', () => {
    expect(component.valid()).toBe(false);
  });

  it('should have invalid valid state when code is 5 chars', () => {
    component.code.set('12345');
    expect(component.valid()).toBe(false);
  });

  it('should have valid valid state when code is 6 chars', () => {
    component.code.set('123456');
    expect(component.valid()).toBe(true);
  });

  it('should have disabled submit when invalid', () => {
    expect(component.submitDisabled()).toBe(true);
  });

  it('should have disabled submit when submitting', () => {
    component.code.set('123456');
    component.submitting.set(true);
    expect(component.submitDisabled()).toBe(true);
  });

  it('should have enabled submit when valid and not submitting', () => {
    component.code.set('123456');
    expect(component.submitDisabled()).toBe(false);
  });

  it('should compute codeDigits from code signal', () => {
    component.code.set('123456');
    expect(component.codeDigits()).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('should pad codeDigits with empty strings for short code', () => {
    component.code.set('123');
    expect(component.codeDigits()).toEqual(['1', '2', '3', '', '', '']);
  });

  it('should set email from route query params on init', () => {
    expect(component.email()).toBe(mockEmail);
  });

  it('should call authApi.verifyResetCode on valid submit', async () => {
    component.code.set('123456');
    await component.onSubmit();

    expect(authApiSpy.verifyResetCode).toHaveBeenCalledWith({
      email: mockEmail,
      code: '123456',
    });
  });

  it('should show success snackbar on valid submit', async () => {
    component.code.set('123456');
    await component.onSubmit();

    expect(snackBarSpy.open).toHaveBeenCalledWith('Код подтверждён', 'Закрыть', { duration: 2000 });
  });

  it('should navigate to reset-password on success', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.code.set('123456');
    await component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/reset-password'], {
      queryParams: { email: mockEmail },
    });
  });

  it('should not call API when email is empty', async () => {
    component.email.set('');
    component.code.set('123456');
    await component.onSubmit();

    expect(authApiSpy.verifyResetCode).not.toHaveBeenCalled();
  });

  it('should not call API when code is not 6 chars', async () => {
    component.code.set('12345');
    await component.onSubmit();

    expect(authApiSpy.verifyResetCode).not.toHaveBeenCalled();
  });

  it('should show error snackbar on API failure', async () => {
    authApiSpy.verifyResetCode.mockRejectedValue(new Error('Invalid code'));
    component.code.set('123456');
    await component.onSubmit();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Неверный код. Попробуйте снова.',
      'Закрыть',
      { duration: 4000 },
    );
  });

  it('should clear code on API failure', async () => {
    authApiSpy.verifyResetCode.mockRejectedValue(new Error('Invalid code'));
    component.code.set('123456');
    await component.onSubmit();

    expect(component.code()).toBe('');
  });

  it('should set submitting to false after success', async () => {
    component.code.set('123456');
    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  it('should set submitting to false after failure', async () => {
    authApiSpy.verifyResetCode.mockRejectedValue(new Error('Invalid code'));
    component.code.set('123456');
    await component.onSubmit();

    expect(component.submitting()).toBe(false);
  });

  it('should call authApi.forgotPassword on resend', async () => {
    await component.onResend();

    expect(authApiSpy.forgotPassword).toHaveBeenCalledWith({ email: mockEmail });
  });

  it('should show success snackbar on resend', async () => {
    await component.onResend();

    expect(snackBarSpy.open).toHaveBeenCalledWith('Код отправлен повторно', 'Закрыть', {
      duration: 3000,
    });
  });

  it('should not resend when resendLoading is true', async () => {
    component.resendLoading.set(true);
    await component.onResend();

    expect(authApiSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should not resend when email is empty', async () => {
    component.email.set('');
    await component.onResend();

    expect(authApiSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should show error snackbar on resend failure', async () => {
    authApiSpy.forgotPassword.mockRejectedValue(new Error('Network error'));
    await component.onResend();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Не удалось отправить код. Попробуйте позже.',
      'Закрыть',
      { duration: 4000 },
    );
  });

  it('should set resendLoading to false after success', async () => {
    await component.onResend();
    expect(component.resendLoading()).toBe(false);
  });

  it('should set resendLoading to false after failure', async () => {
    authApiSpy.forgotPassword.mockRejectedValue(new Error('Network error'));
    await component.onResend();
    expect(component.resendLoading()).toBe(false);
  });

  it('should focus next input on single digit input', () => {
    component.code.set('');
    const event = { target: { value: '1' } } as unknown as Event;
    component.onDigitInput(0, event);

    expect(component.code()).toBe('1');
  });

  it('should handle multi-digit paste', () => {
    component.code.set('');
    const event = { target: { value: '12345' } } as unknown as Event;
    component.onDigitInput(0, event);

    expect(component.code()).toBe('12345');
  });

  it('should handle backspace on empty digit', () => {
    component.code.set('');
    const event = { key: 'Backspace' } as unknown as KeyboardEvent;
    component.onDigitKeydown(1, event);
    // Should focus previous without error
  });

  it('should not handle backspace when digit has value', () => {
    component.code.set('1');
    const event = { key: 'Backspace' } as unknown as KeyboardEvent;
    component.onDigitKeydown(0, event);
    // Should not error
  });

  it('should stop countdown on destroy', () => {
    component.ngOnDestroy();
    // Should not throw
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterLink, provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';
import { AuthApiService } from '../../../entities/auth/api/auth-api.service';

describe('ForgotPasswordPageComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordPageComponent>;
  let forgotPasswordSpy: ReturnType<typeof vi.fn>;
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    forgotPasswordSpy = vi.fn();
    openSpy = vi.fn();
    navigateSpy = vi.fn(() => Promise.resolve(true));

    TestBed.configureTestingModule({
      imports: [
        ForgotPasswordPageComponent,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        RouterLink,
        MatSnackBarModule,
      ],
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: { forgotPassword: forgotPasswordSpy },
        },
        {
          provide: MatSnackBar,
          useValue: { open: openSpy },
        },
      ],
    });

    fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should have empty email by default', () => {
    expect(fixture.componentInstance.email()).toBe('');
  });

  it('should have submitDisabled true when email is empty', () => {
    expect(fixture.componentInstance.submitDisabled()).toBe(true);
  });

  it('should have emailInvalid false when email is empty', () => {
    expect(fixture.componentInstance.emailInvalid()).toBe(false);
  });

  it('should have emailInvalid false when email is valid', () => {
    fixture.componentInstance.email.set('test@test.com');
    expect(fixture.componentInstance.emailInvalid()).toBe(false);
  });

  it('should have emailInvalid true when email is invalid', () => {
    fixture.componentInstance.email.set('invalid-email');
    expect(fixture.componentInstance.emailInvalid()).toBe(true);
  });

  it('should have submitDisabled true when submitting', () => {
    fixture.componentInstance.submitting.set(true);
    expect(fixture.componentInstance.submitDisabled()).toBe(true);
  });

  it('should submit with valid email', async () => {
    forgotPasswordSpy.mockResolvedValue('123456');
    fixture.componentInstance.email.set('test@test.com');

    await fixture.componentInstance.onSubmit();

    expect(forgotPasswordSpy).toHaveBeenCalledWith({ email: 'test@test.com' });
    expect(fixture.componentInstance.success()).toBe(true);
    expect(openSpy).toHaveBeenCalledWith(
      'Код подтверждения отправлен на test@test.com',
      'Закрыть',
      { duration: 5000 },
    );
  });

  it('should not submit when email is empty', async () => {
    fixture.componentInstance.email.set('');
    await fixture.componentInstance.onSubmit();
    expect(forgotPasswordSpy).not.toHaveBeenCalled();
  });

  it('should not submit when email is invalid', async () => {
    fixture.componentInstance.email.set('invalid');
    await fixture.componentInstance.onSubmit();
    expect(forgotPasswordSpy).not.toHaveBeenCalled();
  });

  it('should show error toast when submission fails', async () => {
    forgotPasswordSpy.mockRejectedValue(new Error('API error'));
    fixture.componentInstance.email.set('test@test.com');

    await fixture.componentInstance.onSubmit();

    expect(openSpy).toHaveBeenCalledWith('Не удалось отправить код. Попробуйте позже.', 'Закрыть', {
      duration: 5000,
    });
  });
});

import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthApiService } from '../../../entities/auth/api/auth-api.service';

/**
 * Forgot password page component.
 * @remarks Collects the user's email and requests a verification code.
 *          Redirects to `/auth/verify-code` on success.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forgot-password',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  readonly email = signal('');
  readonly submitting = signal(false);
  readonly success = signal(false);

  readonly emailInvalid = computed(() => {
    const val = this.email();
    return val !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  });

  /** Whether the submit button should be disabled. */
  readonly submitDisabled = computed(
    () => this.submitting() || this.email() === '' || this.emailInvalid(),
  );

  /** Handles the form submission: requests a password-reset code. */
  async onSubmit(): Promise<void> {
    const email = this.email();
    if (!email || this.emailInvalid()) {
      return;
    }

    this.submitting.set(true);
    try {
      // Бэкенд возвращает { data: "993020" } — сохраняем код для передачи дальше
      const code = await this.authApi.forgotPassword({ email });
      sessionStorage.setItem('reset-token', code);
      this.success.set(true);
      this.snackbar.open(`Код подтверждения отправлен на ${email}`, 'Закрыть', {
        duration: 5000,
      });
      setTimeout(() => {
        void this.router.navigate(['/auth/verify-code'], {
          queryParams: { email },
        });
      }, 1200);
    } catch {
      this.snackbar.open('Не удалось отправить код. Попробуйте позже.', 'Закрыть', {
        duration: 5000,
      });
    } finally {
      this.submitting.set(false);
    }
  }
}

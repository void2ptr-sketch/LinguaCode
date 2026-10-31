import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthApiService } from '../../../entities/auth/api/auth-api.service';

/**
 * Reset password page component.
 * @remarks Accepts a new password and confirms it.
 *          Calls `/auth/reset-password` and redirects to `/auth/login` on success.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    RouterLink,
  ],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly snackbar = inject(MatSnackBar);

  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);

  readonly passwordsMatch = computed(() => {
    const p1 = this.password();
    const p2 = this.confirmPassword();
    return p2 === '' || p1 === p2;
  });

  readonly passwordTooShort = computed(() => this.password().length > 0 && this.password().length < 8);

  readonly submitDisabled = computed(
    () =>
      this.submitting() ||
      this.password().length < 8 ||
      this.confirmPassword() === '' ||
      !this.passwordsMatch(),
  );

  /** Password strength indicator (simple). */
  readonly passwordStrength = computed(() => {
    const p = this.password();
    if (p.length < 8) return 0;
    let score = 0;
    if (/[a-z]/.test(p)) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score; // 0-4
  });

  readonly strengthLabel = computed(() => {
    const s = this.passwordStrength();
    const labels = ['Слабый', 'Средний', 'Хороший', 'Отличный'];
    return s > 0 ? labels[Math.min(s - 1, labels.length - 1)] : '';
  });

  readonly strengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return '#f44336';
    if (s <= 2) return '#ff9800';
    if (s <= 3) return '#4caf50';
    return '#2e7d32';
  });

  /** Handles form submission: resets the password. */
  async onSubmit(): Promise<void> {
    const email = this.route.snapshot.queryParams['email'];
    if (!email) {
      void this.router.navigate(['/auth/forgot-password']);
      return;
    }

    const resetToken = this.route.snapshot.queryParams['token'] ?? '';
    if (!resetToken) {
      // No token — this flow requires verify-code to have set a token
      // In a real app, the token would be stored in sessionStorage after verify
      const stored = sessionStorage.getItem('reset-token');
      if (!stored) {
        this.snackbar.open('Ссылка недействительна. Запросите код заново.', 'Закрыть', {
          duration: 5000,
        });
        void this.router.navigate(['/auth/forgot-password']);
        return;
      }
      // Use stored token
      this.submitting.set(true);
      try {
        await this.authApi.resetPassword({ resetToken: stored, newPassword: this.password() });
        this.snackbar.open('Пароль успешно сброшен', 'Закрыть', { duration: 3000 });
        sessionStorage.removeItem('reset-token');
        setTimeout(() => void this.router.navigate(['/auth/login']), 1000);
      } catch {
        this.snackbar.open('Не удалось сбросить пароль. Попробуйте позже.', 'Закрыть', {
          duration: 5000,
        });
      } finally {
        this.submitting.set(false);
      }
      return;
    }

    this.submitting.set(true);
    try {
      await this.authApi.resetPassword({ resetToken, newPassword: this.password() });
      this.snackbar.open('Пароль успешно сброшен', 'Закрыть', { duration: 3000 });
      setTimeout(() => void this.router.navigate(['/auth/login']), 1000);
    } catch {
      this.snackbar.open('Не удалось сбросить пароль. Попробуйте позже.', 'Закрыть', {
        duration: 5000,
      });
    } finally {
      this.submitting.set(false);
    }
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthApiService } from '../../../entities/auth/api/auth-api.service';

/**
 * Verify code page component.
 * @remarks Collects the 6-digit verification code sent to the user's email.
 *          Redirects to `/auth/reset-password` on success.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-verify-code',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './verify-code-page.component.html',
  styleUrl: './verify-code-page.component.scss',
})
export class VerifyCodePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly snackbar = inject(MatSnackBar);

  readonly email = signal('');
  readonly code = signal('');

  readonly submitting = signal(false);
  readonly resendLoading = signal(false);
  readonly countdown = signal(60);

  /** Array of 6 slots, each showing one digit or empty string. */
  readonly codeDigits = computed(() => {
    const val = this.code();
    const result: string[] = [];
    for (let i = 0; i < 6; i++) {
      result.push(val[i] ?? '');
    }
    return result;
  });

  readonly valid = computed(() => this.code().length === 6);

  readonly submitDisabled = computed(() => this.submitting() || !this.valid());

  /** Timer for the resend cooldown. */
  #timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.email.set(email);
    } else {
      // No email — redirect back to forgot-password
      void this.router.navigate(['/auth/forgot-password']);
      return;
    }
    this.#startCountdown();
  }

  ngOnDestroy(): void {
    this.#stopCountdown();
  }

  /** Handles input on a single digit field. */
  onDigitInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (value.length > 1) {
      // User pasted or typed multiple digits
      const digits = value.slice(0, 6).split('');
      this.code.set(digits.join(''));
      target.value = digits[5] ?? '';
      // Focus next or skip
      if (digits.length > 1) {
        const next = Math.min(index + digits.length - 1, 5);
        this.#focusDigit(next);
      }
      return;
    }

    // Single digit — update code signal
    const digits = [...this.codeDigits()];
    digits[index] = value;
    this.code.set(digits.join('').slice(0, 6));

    // Auto-focus next
    if (value && index < 5) {
      this.#focusDigit(index + 1);
    }

    target.value = value;
  }

  /** Handle backspace: delete and move cursor back. */
  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.codeDigits()[index] && index > 0) {
      this.#focusDigit(index - 1);
    }
  }

  /** Handles form submission: verifies the code. */
  async onSubmit(): Promise<void> {
    const email = this.email();
    if (!email || this.code().length !== 6) return;

    this.submitting.set(true);
    try {
      await this.authApi.verifyResetCode({ email, code: this.code() });
      this.snackbar.open('Код подтверждён', 'Закрыть', { duration: 2000 });
      void this.router.navigate(['/auth/reset-password'], {
        queryParams: { email },
      });
    } catch {
      this.snackbar.open('Неверный код. Попробуйте снова.', 'Закрыть', { duration: 4000 });
      this.code.set('');
      this.#focusDigit(0);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Resends the verification code. */
  async onResend(): Promise<void> {
    if (this.resendLoading()) return;
    const email = this.email();
    if (!email) return;

    this.resendLoading.set(true);
    try {
      await this.authApi.forgotPassword({ email });
      console.log('[VerifyCode] New code sent. Check console for mock:', email, 'code: 123456');
      this.snackbar.open('Код отправлен повторно', 'Закрыть', { duration: 3000 });
      this.#startCountdown();
    } catch {
      this.snackbar.open('Не удалось отправить код. Попробуйте позже.', 'Закрыть', {
        duration: 4000,
      });
    } finally {
      this.resendLoading.set(false);
    }
  }

  // ── Countdown helpers ──────────────────────────────────

  #startCountdown(): void {
    this.#stopCountdown();
    this.countdown.set(60);
    this.#timer = setInterval(() => {
      this.countdown.update((v) => {
        if (v <= 1) {
          this.#stopCountdown();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  #stopCountdown(): void {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #focusDigit(index: number): void {
    const el = document.querySelector<HTMLInputElement>(`.code-input[data-index="${index}"]`);
    el?.focus();
  }
}

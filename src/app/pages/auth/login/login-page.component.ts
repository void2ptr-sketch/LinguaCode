import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthStore } from '../../../entities/auth/services/auth.store';
import type { LoginCredentials } from '../../../entities/auth/model/auth.types';
import { LanguageService } from '../../../entities/language-pair/lib';

/** Status of the login operation. */
type LoginStatus = 'idle' | 'success' | 'error';

/**
 * Login page component.
 * @remarks Provides email/password form that calls `AuthStore.login()` and
 * shows inline success/error indicators inside the card.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authStore = inject(AuthStore);
  private readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly form = signal<NgForm | null>(null);

  readonly isAuthenticating = this.authStore.isAuthenticating;
  readonly error = this.authStore.error;

  /** Current login status used to render inline indicators. */
  readonly status = signal<LoginStatus>('idle');

  /** Whether to show the success indicator. */
  readonly showSuccess = computed(() => this.status() === 'success');
  /** Whether to show the error indicator. */
  readonly showError = computed(
    () => this.status() === 'error' && (this.error() ?? false),
  );

  /** Redirects to journey after a brief success display. */
  private scheduleRedirect(): void {
    this.status.set('success');
    setTimeout(() => {
      void this.router.navigate(['/journey']);
    }, 800);
  }

  /**
   * Handles form submission and authenticates the user.
   *
   * @param credentials — Email/password entered by the user.
   * @param form — Template-driven form ref used to guard against invalid submits.
   *   `ngSubmit` can fire even when the form is invalid (e.g. implicit submit
   *   via Enter key), so empty credentials are blocked client-side instead of
   *   reaching the backend validation (which responds with HTTP 400).
   */
  async onSubmit(credentials: LoginCredentials, form: NgForm | null): Promise<void> {
    if (form?.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.status.set('idle');
    const success = await this.authStore.login(credentials);
    if (success) {
      // Now authenticated — languages can be fetched (the backend returns 403
      // for unauthenticated /languages requests during anonymous bootstrap).
      void this.languageService.load();
      this.scheduleRedirect();
    } else {
      this.status.set('error');
    }
  }
}

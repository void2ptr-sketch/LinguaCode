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

  /** Handles form submission and authenticates the user. */
  async onSubmit(credentials: LoginCredentials): Promise<void> {
    this.status.set('idle');
    const success = await this.authStore.login(credentials);
    if (success) {
      this.scheduleRedirect();
    } else {
      this.status.set('error');
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthStore } from '../../../entities/auth/services/auth.store';
import type { LoginCredentials } from '../../../entities/auth/model/auth.types';

/**
 * Login page component.
 * @remarks Provides email/password form that calls `AuthStore.login()` and
 * navigates to `/journey` on success, or displays error messages.
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
    MatTooltipModule,
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

  /** Handles form submission and authenticates the user. */
  async onSubmit(credentials: LoginCredentials): Promise<void> {
    const success = await this.authStore.login(credentials);
    if (success) {
      void this.router.navigate(['/journey']);
    }
  }
}

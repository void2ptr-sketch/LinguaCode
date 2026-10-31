import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { UserStore } from '../../entities/user/model/user.store';
import { AuthStore } from '../../entities/auth/services/auth.store';

/**
 * Navigation menu component for the user section.
 * @remarks Shows display name when authenticated, offers logout;
 * shows a "Login" link when unauthenticated.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-menu-user',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './menu-user.component.html',
  styleUrl: './menu-user.component.scss',
})
export class MenuUserComponent {
  private readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly displayName = computed(
    () => this.authStore.user()?.displayName ?? this.userStore.displayName(),
  );
  readonly isAuthenticated = this.authStore.isAuthenticated;

  async logout(): Promise<void> {
    await this.authStore.logout();
    void this.router.navigate(['/login']);
  }
}

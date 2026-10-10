import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserStore } from '../../state';

/**
 * Navigation menu component for the user section. Displays the current user's display name.
 * @remarks Reads the display name from the injected `UserStore`.
 */
@Component({
  selector: 'app-menu-user',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './menu-user.component.html',
  styleUrl: './menu-user.component.scss',
})
export class MenuUserComponent {
  /**
   * Signal containing the current user's display name.
   *
   * @remarks
   * Read directly from `UserStore`; updates reactively when the user profile changes.
   */
  readonly displayName = inject(UserStore).displayName;
}

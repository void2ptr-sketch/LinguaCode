import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RoleService } from '../../entities/auth/services/role.service';

/**
 * Navigation menu component for the tools section. Provides links to course builder,
 * scenario builder, and card editor tools.
 * @remarks Hidden for users without ROLE_AUTHOR/ROLE_ADMIN.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-menu-tools',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './menu-tools.component.html',
  styleUrl: './menu-tools.component.scss',
})
export class MenuToolsComponent {
  readonly roleService = inject(RoleService);
}

import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RoleService } from '../../entities/auth/services/role.service';
import { SIDEBAR_NAV_CONFIG, type NavGroup } from './sidebar-nav-config';
import type { UserRole } from '../../entities/auth/services/role.service';

/**
 * Sidebar navigation component. Renders the left-side navigation menu with grouped links
 * for learning, tools, and account sections.
 * @remarks Navigation groups are defined in `sidebar-nav-config.ts` and filtered by role.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar-navigation-left',
  imports: [RouterLink, RouterLinkActive, MatDividerModule, MatListModule, MatIconModule],
  templateUrl: './sidebar-navigation-left.component.html',
  styleUrl: './sidebar-navigation-left.component.scss',
})
export class SidebarNavigationLeftComponent {
  private readonly roleService = inject(RoleService);

  readonly groups = computed<readonly NavGroup[]>(() =>
    SIDEBAR_NAV_CONFIG.map(group => ({
      ...group,
      items: group.items.filter(item =>
        !item.roles || item.roles.some(r => this.roleService.hasRole(r as UserRole))
      ),
    })).filter(group => group.items.length > 0),
  );
}

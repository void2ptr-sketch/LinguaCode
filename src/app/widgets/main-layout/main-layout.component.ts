import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { SidebarNavigationLeftComponent } from '../sidebar-navigation-left/sidebar-navigation-left.component';
import { MainFooterComponent } from '../main-footer/main-footer.component';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

/**
 * Main layout shell component. Composes the header, navigation sidebar, footer, and router outlet.
 * @remarks This component provides the primary application chrome for all feature pages.
 */
@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MainHeaderComponent, SidebarNavigationLeftComponent, MainFooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly sidebarCollapsed = signal<boolean>(
    isPlatformBrowser(this.platformId)
      ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
      : false,
  );

  readonly toggleSidebar = () => this.sidebarCollapsed.update(v => !v);

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          SIDEBAR_COLLAPSED_KEY,
          String(this.sidebarCollapsed()),
        );
      }
    });
  }
}

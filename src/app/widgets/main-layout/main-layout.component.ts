import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  DestroyRef,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { SidebarNavigationLeftComponent } from '../sidebar-navigation-left/sidebar-navigation-left.component';
import { MainFooterComponent } from '../main-footer/main-footer.component';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';
const SIDEBAR_WIDTH_KEY = 'sidebar_width';
const SIDEBAR_MIN_WIDTH = 160;   // 160px minimum
const SIDEBAR_MAX_WIDTH = 600;   // 600px maximum
const SIDEBAR_DEFAULT_WIDTH = 224; // 14rem default

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  readonly sidebarCollapsed = signal<boolean>(
    isPlatformBrowser(this.platformId)
      ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
      : false,
  );

  readonly sidebarWidth = signal<number>(
    isPlatformBrowser(this.platformId)
      ? Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || SIDEBAR_DEFAULT_WIDTH
      : SIDEBAR_DEFAULT_WIDTH,
  );

  readonly navWidth = computed(() => {
    if (this.sidebarCollapsed()) {
      return 48; // collapsed width in px
    }
    return this.sidebarWidth();
  });

  readonly toggleSidebar = () => this.sidebarCollapsed.update((v) => !v);

  readonly isResizing = signal(false);

  // ── Resize logic ──────────────────────────────────────────────
  private _isResizing = false;
  private _startX = 0;
  private _startWidth = 0;

  readonly onMouseDownResize = (event: MouseEvent) => {
    event.preventDefault();
    this._isResizing = true;
    this.isResizing.set(true);
    this._startX = event.clientX;
    this._startWidth = this.sidebarWidth();

    // Listen outside Angular zone to avoid excessive change detection
    this.ngZone.runOutsideAngular(() => {
      const onMouseMove = (e: MouseEvent) => this._onMouseMove(e);
      const onMouseUp = () => {
        this._isResizing = false;
        this.isResizing.set(false);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  };

  private _onMouseMove = (event: MouseEvent) => {
    if (!this._isResizing) return;
    const delta = event.clientX - this._startX;
    const newWidth = Math.min(
      SIDEBAR_MAX_WIDTH,
      Math.max(SIDEBAR_MIN_WIDTH, this._startWidth + delta),
    );
    this.sidebarWidth.set(newWidth);
  };

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(this.sidebarCollapsed()));
      }
    });

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(this.sidebarWidth()));
      }
    });

    // Cleanup: stop resizing on destroy
    this.destroyRef.onDestroy(() => {
      this._isResizing = false;
    });
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { SidebarNavigationLeftComponent } from '../sidebar-navigation-left/sidebar-navigation-left.component';
import { MainFooterComponent  } from  '../main-footer/main-footer.component';

/**
 * Main layout shell component. Composes the header, navigation sidebar, footer, and router outlet.
 * @remarks This component provides the primary application chrome for all feature pages.
 */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, MainHeaderComponent, SidebarNavigationLeftComponent, MainFooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {}

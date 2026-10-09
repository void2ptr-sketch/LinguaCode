import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppThemeService } from './core/theme/app-theme.service';

/**
 * Root application component. Initializes the app theme service and renders the router outlet.
 * @remarks This is the entry point component for the Angular application shell.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {
    inject(AppThemeService);
  }
}

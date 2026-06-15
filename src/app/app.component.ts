import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppThemeService } from './core/theme/app-theme.service';

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

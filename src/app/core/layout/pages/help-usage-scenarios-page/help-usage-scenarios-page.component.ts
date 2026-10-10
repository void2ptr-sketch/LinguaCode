import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { HELP_USAGE_SCENARIOS } from '../../data/help-usage-scenarios.data';

/**
 * Help usage scenarios page component. Displays common usage scenarios for the application.
 * @remarks Data is loaded from static constants in `help-usage-scenarios.data.ts`.
 */
@Component({
  selector: 'app-help-usage-scenarios-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './help-usage-scenarios-page.component.html',
  styleUrl: './help-usage-scenarios-page.component.scss',
})
export class HelpUsageScenariosPageComponent {
  /** List of usage scenarios with descriptions and examples. */
  readonly scenarios = HELP_USAGE_SCENARIOS;
}

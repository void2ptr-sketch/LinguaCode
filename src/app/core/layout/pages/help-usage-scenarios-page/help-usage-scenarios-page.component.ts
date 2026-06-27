import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { HELP_USAGE_SCENARIOS } from '../../data/help-usage-scenarios.data';

@Component({
  selector: 'app-help-usage-scenarios-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './help-usage-scenarios-page.component.html',
  styleUrl: './help-usage-scenarios-page.component.scss',
})
export class HelpUsageScenariosPageComponent {
  readonly scenarios = HELP_USAGE_SCENARIOS;
}

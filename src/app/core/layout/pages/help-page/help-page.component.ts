import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  HELP_PAGE_FEATURES,
  HELP_PAGE_HERO,
  HELP_PAGE_HIERARCHY,
  HELP_PAGE_HIGHLIGHTS,
} from '../../data/help-page.data';

/**
 * Help page component. Displays the main help overview with features, hierarchy, and highlights.
 * @remarks Data is loaded from static constants in `help-page.data.ts`.
 */
@Component({
  selector: 'app-help-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss',
})
export class HelpPageComponent {
  /** Hero section data for the help page header. */
  readonly hero = HELP_PAGE_HERO;
  /** List of featured capabilities displayed on the help page. */
  readonly features = HELP_PAGE_FEATURES;
  /** Application feature hierarchy information. */
  readonly hierarchy = HELP_PAGE_HIERARCHY;
  /** Key highlights and tips for new users. */
  readonly highlights = HELP_PAGE_HIGHLIGHTS;
}

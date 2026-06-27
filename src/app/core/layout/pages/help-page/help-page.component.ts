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

@Component({
  selector: 'app-help-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.scss',
})
export class HelpPageComponent {
  readonly hero = HELP_PAGE_HERO;
  readonly features = HELP_PAGE_FEATURES;
  readonly hierarchy = HELP_PAGE_HIERARCHY;
  readonly highlights = HELP_PAGE_HIGHLIGHTS;
}

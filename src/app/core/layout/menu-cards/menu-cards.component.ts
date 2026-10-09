import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter, map, startWith } from 'rxjs';

function isLearningRoute(url: string): boolean {
  return url.startsWith('/home') || url.startsWith('/cards/select') || url.startsWith('/courses');
}

/**
 * Navigation menu component for the cards/learning section. Highlights the active state
 * when the user is on a learning-related route (home, card select, or courses).
 * @remarks Uses `toSignal` to derive reactive active-state from router events.
 */
@Component({
  selector: 'app-menu-cards',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './menu-cards.component.html',
  styleUrl: './menu-cards.component.scss',
})
export class MenuCardsComponent {
  private readonly router = inject(Router);

  /** Signal indicating whether the current route belongs to the learning section. */
  readonly isLearningSection = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isLearningRoute(this.router.url)),
      startWith(isLearningRoute(this.router.url)),
    ),
    { initialValue: isLearningRoute(this.router.url) },
  );
}

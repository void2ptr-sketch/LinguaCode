import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-menu-help',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './menu-help.component.html',
  styleUrl: './menu-help.component.scss',
})
export class MenuHelpComponent {
  private readonly router = inject(Router);

  readonly isHelpSection = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/help')),
      startWith(this.router.url.startsWith('/help')),
    ),
    { initialValue: this.router.url.startsWith('/help') },
  );
}

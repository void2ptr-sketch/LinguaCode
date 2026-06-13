import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { HomeTab } from '../../types';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  readonly tabs: readonly HomeTab[] = [
    { label: 'Приветствие', path: '/home', exact: true },
    { label: 'Прогресс', path: '/home/progress' },
    { label: 'Разделы', path: '/home/sections' },
  ];
}

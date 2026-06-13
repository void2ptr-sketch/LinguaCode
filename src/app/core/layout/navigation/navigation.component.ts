import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

type NavItem = {
  label: string;
  path: string;
  icon: string;
};

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  readonly items: readonly NavItem[] = [
    { label: 'Главная', path: '/home', icon: 'home' },
    { label: 'Карточки', path: '/cards/select', icon: 'style' },
    { label: 'Инструменты', path: '/tools/scenario-builder', icon: 'build' },
    { label: 'Справка', path: '/help', icon: 'help_outline' },
    { label: 'Профиль', path: '/user', icon: 'person_outline' },
  ];
}

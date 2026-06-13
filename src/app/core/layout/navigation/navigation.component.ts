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
    { label: 'Обучение', path: '/cards/select', icon: 'school' },
    { label: 'Каталог курсов', path: '/courses', icon: 'menu_book' },
    { label: 'Карточки', path: '/tools/cards', icon: 'style' },
    { label: 'Конструктор сценариев', path: '/tools/scenario-builder', icon: 'view_list' },
    { label: 'Конструктор курсов', path: '/tools/courses', icon: 'menu_book' },
    { label: 'Справка', path: '/help', icon: 'help_outline' },
    { label: 'Профиль', path: '/user', icon: 'person_outline' },
  ];
}

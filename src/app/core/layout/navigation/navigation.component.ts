import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

type NavItem = {
  label: string;
  path: string;
  icon: string;
};

type NavGroup = {
  id: string;
  items: readonly NavItem[];
};

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, MatDividerModule, MatListModule, MatIconModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  readonly groups: readonly NavGroup[] = [
    {
      id: 'learning',
      items: [
        { label: 'Обучение', path: '/home', icon: 'school' },
        { label: 'Практика', path: '/cards/select', icon: 'style' },
        { label: 'Каталог курсов', path: '/courses', icon: 'menu_book' },
      ],
    },
    {
      id: 'tools',
      items: [
        { label: 'Конструктор курсов', path: '/tools/courses', icon: 'menu_book' },
        { label: 'Конструктор сценариев', path: '/tools/scenario-builder', icon: 'view_list' },
        { label: 'Карточки', path: '/tools/cards', icon: 'style' },
      ],
    },
    {
      id: 'account',
      items: [{ label: 'Профиль', path: '/user', icon: 'person_outline' }],
    },
  ];
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { HomeSectionLink } from '../../types';

@Component({
  selector: 'app-home-sections-tab',
  imports: [RouterLink, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './home-sections-tab.component.html',
  styleUrl: './home-sections-tab.component.scss',
})
export class HomeSectionsTabComponent {
  readonly sections: readonly HomeSectionLink[] = [
    {
      label: 'Карточки',
      path: '/cards/select',
      icon: 'style',
      description: 'Прохождение карточек и сценариев',
    },
    {
      label: 'Конструктор сценариев',
      path: '/tools/scenario-builder',
      icon: 'build',
      description: 'Создание и редактирование сценариев',
    },
    {
      label: 'Редактор карточек',
      path: '/tools/card-editor',
      icon: 'edit_note',
      description: 'Создание карточек с выбором ответа',
    },
    {
      label: 'Справка',
      path: '/help',
      icon: 'help_outline',
      description: 'Описание приложения и возможностей',
    },
    {
      label: 'Профиль',
      path: '/user',
      icon: 'person_outline',
      description: 'Имя и настройки внешнего вида карточек',
    },
  ];
}

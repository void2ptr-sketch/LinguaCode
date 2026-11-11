import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Admin page stub — placeholder for future admin panel.
 * @remarks Protected by `adminGuard`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-page',
  template: `<h1>Панель администратора</h1><p>В разработке</p>`,
  styles: [
    `
      :host {
        display: block;
        padding: 2rem;
      }
    `,
  ],
})
export class AdminPageComponent {}

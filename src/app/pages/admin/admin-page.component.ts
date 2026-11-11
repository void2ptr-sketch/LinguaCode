import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { LanguageRegistryComponent } from '../../features/language-registry/components/language-registry/language-registry.component';

/**
 * Admin page — system dictionary management (ROLE_ADMIN, `adminGuard`).
 *
 * @remarks
 * Tab layout:
 * - **Справочник языков** — CRUD of the global `/languages` dictionary
 *   ([LanguageRegistryComponent](features/language-registry)). The learner
 *   profile consumes the dictionary read-only.
 * - **Разделы в разработке** — placeholders for user management, logs.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-page',
  imports: [MatCardModule, MatIconModule, MatTabsModule, LanguageRegistryComponent],
  template: `
    <mat-card class="admin-page">
      <mat-card-content class="admin-page__content">
        <mat-tab-group class="admin-page__tabs" animationDuration="0ms">
          <mat-tab label="Справочник языков">
            <div class="admin-page__panel">
              <app-language-registry />
            </div>
          </mat-tab>

          <mat-tab label="Разделы в разработке">
            <div class="admin-page__panel">
              <div class="admin-page__placeholder">
                <mat-icon>construction</mat-icon>
                <p>Управление пользователями, системные логи и метрики — в разработке.</p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .admin-page {
        margin: 1rem;
      }

      .admin-page__panel {
        padding: 1rem 0;
      }

      .admin-page__placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
export class AdminPageComponent {}

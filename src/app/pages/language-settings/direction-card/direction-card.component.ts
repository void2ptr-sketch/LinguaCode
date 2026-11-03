import { InjectionToken, Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/** A single direction within a grouped card. */
export interface DirectionItem {
  /** DB pair ID (stringified number). */
  id: string;
  known: string;
  learning: string;
  isActive: boolean;
}

/** Injection token for the helper methods needed by this component. */
export const DIRECTION_CARD_HELPERS = new InjectionToken<DirectionCardHelpers>('DirectionCardHelpers');

export interface DirectionCardHelpers {
  getLanguageLabel(code: string): string;
  getFlagEmoji(code: string): string;
  getBadgeColor(code: string): string;
  getBadgeTextColor(code: string): string;
  getBadgeCode(code: string): string;
}

/**
 * A single direction card (e.g. RU → EN or EN → RU).
 *
 * @remarks
 * Standalone component with `OnPush` change detection. It only re-renders
 * when its own `dir` input changes, so pressing "Activate" / "Remove" on
 * one mirror card does not trigger a re-render of its sibling.
 */
@Component({
  selector: 'app-direction-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <div
      class="settings-page__direction"
      [class.settings-page__direction--active]="dirItem().isActive"
    >
      <div class="settings-page__direction__content">
        <!-- 2x3 grid: both rows share the same columns -->
        <div class="settings-page__direction__matrix">
          <span class="settings-page__direction__code">{{ dirItem().known | uppercase }}</span>
          <span class="settings-page__direction__arrow">&#x2192;</span>
          <span class="settings-page__direction__code">{{ dirItem().learning | uppercase }}</span>
          <span class="settings-page__direction__label-text">{{ helpers.getLanguageLabel(dirItem().known) }}</span>
          <span class="settings-page__direction__arrow">&#x2192;</span>
          <span class="settings-page__direction__label-text">{{ helpers.getLanguageLabel(dirItem().learning) }}</span>
        </div>
        <!-- Status row: radio + status label -->
        <div class="settings-page__direction__status">
          <div class="settings-page__direction__radio">
            @if (dirItem().isActive) {
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            }
          </div>
          <span class="settings-page__direction__sublabel">
            @if (dirItem().isActive) {
              Active
            } @else {
              Not active
            }
          </span>
        </div>
        <div class="settings-page__direction__divider"></div>
        <div class="settings-page__direction__actions">
          <button
            mat-button
            type="button"
            class="settings-page__direction__btn settings-page__direction__btn--primary settings-page__direction__btn--activate"
            [class.settings-page__direction__btn--hidden]="dirItem().isActive"
            (click)="activate.emit(dirItem().id)"
          >
            Activate
          </button>
          <button
            mat-button
            type="button"
            color="warn"
            class="settings-page__direction__btn settings-page__direction__btn--remove"
            (click)="remove.emit(dirItem().id)"
            matTooltip="Remove this direction"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4h10M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m1.06 0v9.33a1.33 1.33 0 01-1.33 1.34H5.33a1.33 1.33 0 01-1.33-1.34V4h9.34z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Remove
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page__direction {
      position: relative;
      border: 1.5px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 220ms ease;
      background: var(--mat-sys-surface);
      display: flex;
      flex-direction: column;
      &:hover {
        border-color: var(--mat-sys-outline);
        background: var(--mat-sys-surface-container-low);
      }
      &--active {
        border-color: var(--mat-sys-primary);
        background: rgba(90,113,148,.07);
        box-shadow: inset 0 0 0 1px rgba(90,113,148,.08);
      }
      &__content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-top: 0.25rem;
      }
      &__matrix {
        display: grid;
        grid-template-columns: auto min-content auto;
        grid-template-rows: auto auto;
        row-gap: 0.25rem;
        text-align: center;
        justify-items: center;
      }
      &__code {
        font-family: 'Manrope', system-ui, sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
        background: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface-variant);
        white-space: nowrap;
        .settings-page__direction--active & {
          background: var(--mat-sys-primary);
          color: var(--mat-sys-on-primary);
        }
      }
      &__label-text {
        font-size: 0.85rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      &__arrow {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.85rem;
        padding: 0 0.1rem;
        flex-shrink: 0;
      }
      &__status {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding-top: 0.1rem;
        justify-content: center;
      }
      &__radio {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid var(--mat-sys-outline);
        transition: all 220ms ease;
        display: grid;
        place-items: center;
        .settings-page__direction--active & {
          border-color: var(--mat-sys-primary);
          background: var(--mat-sys-primary);
          svg {
            color: var(--mat-sys-on-primary);
            animation: directionPop 300ms ease-out both;
          }
        }
      }
      &__sublabel {
        font-size: 0.74rem;
        color: var(--mat-sys-on-surface-variant);
      }
      &__divider {
        height: 1px;
        background: var(--mat-sys-outline-variant);
        margin: 0.25rem 0;
      }
      &__actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding-top: 0.15rem;
      }
      &__btn {
        font-family: 'Manrope', system-ui, sans-serif;
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.35rem 0.65rem;
        border-radius: 8px;
        min-height: auto;
        transition: all 200ms ease;
        &--primary {
          background: var(--mat-sys-primary);
          color: var(--mat-sys-on-primary);
          &:hover {
            filter: brightness(1.1);
            box-shadow: 0 2px 8px rgba(90,113,148,.3);
          }
        }
        &--remove {
          background: transparent;
          color: var(--mat-sys-error);
          &:hover {
            background: var(--mat-sys-error-container);
          }
        }
        &--hidden {
          visibility: hidden;
          pointer-events: none;
        }
      }
    }
  `],
})
export class DirectionCardComponent {
  /** The direction item data (id, known, learning, isActive). */
  readonly dirItem = input.required<DirectionItem>();

  /** Fired when the user clicks "Activate" on this direction. */
  readonly activate = output<string>();

  /** Fired when the user clicks "Remove" on this direction. */
  readonly remove = output<string>();

  private _helpers = inject(DIRECTION_CARD_HELPERS) as DirectionCardHelpers;

  get helpers(): DirectionCardHelpers {
    return this._helpers;
  }
}

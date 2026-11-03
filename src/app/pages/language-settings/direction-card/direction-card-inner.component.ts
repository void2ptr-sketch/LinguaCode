import { Component, ChangeDetectionStrategy, inject, output, computed, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DIRECTION_CARD_HELPERS } from './direction-card.component';
import type { DirectionCardHelpers } from './direction-card.component';

/**
 * A single direction card (e.g. RU → EN or EN → Ru).
 *
 * @remarks
 * Standalone component with `OnPush`. Each card receives `isActive` as
 * a plain boolean @Input. The parent `groupedPairs` computed creates
 * new objects every time — OnPush sees the new reference → re-renders.
 * Each card renders its own `isActive` value independently.
 *
 * The visual state is always correct:
 * - Active card: `isActive=true` → green border, "Activate" hidden
 * - Inactive cards: `isActive=false` → normal border, "Activate" visible
 */
@Component({
  selector: 'app-direction-card-inner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpperCasePipe, MatButtonModule, MatTooltipModule],
  styleUrls: ['./direction-card-inner.component.scss'],
  template: `
    <div class="dc-card" [class.dc-card--active]="isActive">
      <div class="dc-card__info">
        <div class="dc-card__row">
          <span class="dc-card__code">{{ known | uppercase }}</span>
          <span class="dc-card__arrow">&#x2192;</span>
          <span class="dc-card__code">{{ learning | uppercase }}</span>
        </div>
        <div class="dc-card__row">
          <span class="dc-card__label">{{ labelKnown() }}</span>
          <span class="dc-card__arrow">&#x2192;</span>
          <span class="dc-card__label">{{ labelLearning() }}</span>
        </div>
      </div>

      <div class="dc-card__status">
        <div class="dc-card__radio">
          @if (isActive) {
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 8l3 3 5-5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }
        </div>
        <span class="dc-card__sublabel">
          @if (isActive) {
            Active
          } @else {
            Not active
          }
        </span>
      </div>

      <div class="dc-card__divider"></div>

      <div class="dc-card__actions">
        <button
          mat-button
          type="button"
          class="dc-card__btn dc-card__btn--primary"
          [class.dc-card__btn--hidden]="isActive"
          (click)="activate.emit(pairId)"
        >
          Activate
        </button>
        <button
          mat-button
          type="button"
          color="warn"
          class="dc-card__btn dc-card__btn--remove"
          (click)="remove.emit(pairId)"
          matTooltip="Remove this direction"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4h10M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m1.06 0v9.33a1.33 1.33 0 01-1.33 1.34H5.33a1.33 1.33 0 01-1.33-1.34V4h9.34z"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Remove
        </button>
      </div>
    </div>
  `,
})
export class DirectionCardInnerComponent {
  @Input() pairId = '';
  @Input() known = '';
  @Input() learning = '';
  @Input() isActive = false;

  readonly activate = output<string>();
  readonly remove = output<string>();

  protected labelKnown = computed(() => this._helpers.getLanguageLabel(this.known));
  protected labelLearning = computed(() => this._helpers.getLanguageLabel(this.learning));

  private readonly _helpers = inject(DIRECTION_CARD_HELPERS) as DirectionCardHelpers;
}

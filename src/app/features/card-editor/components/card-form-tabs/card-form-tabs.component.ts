import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

/** Tab definition for the card form navigation. */
export type TabDefinition = {
  /** Display label for the tab. */
  label: string;
  /** Whether the tab is visible. */
  visible: boolean;
};

/**
 * Tab navigation component for the card form.
 *
 * @remarks
 * Provides a scrollable tab bar using native MatTabGroup.
 * Delegates tab content rendering to the parent via activeTabChange output (index-based).
 */
@Component({
  selector: 'app-card-form-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule],
  templateUrl: './card-form-tabs.component.html',
  styleUrl: './card-form-tabs.component.scss',
})
export class CardFormTabsComponent {
  /** All tabs available for this card type. */
  readonly tabs = input.required<TabDefinition[]>();

  /** Emits the index of the currently active tab. */
  readonly activeTabChange = output<number>();

  onTabChange(index: number): void {
    this.activeTabChange.emit(index);
  }
}

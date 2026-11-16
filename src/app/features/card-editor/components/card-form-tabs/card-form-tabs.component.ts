import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

/**
 * Stable identifier for a card form tab.
 *
 * @remarks
 * Tab identifiers are decoupled from their position in the visible tab list so
 * that conditional visibility can never cause labels and rendered content to
 * diverge.
 */
export type TabId = 'content' | 'answers' | 'appearance' | 'placement' | 'publishing';

/** Tab definition for the card form navigation. */
export type TabDefinition = {
  /** Stable identifier used to render the matching tab content. */
  id: TabId;
  /** Display label for the tab. */
  label: string;
  /** Optional Material icon name for the tab. */
  icon?: string;
  /** Optional badge text for the tab (typically a validation issue count). */
  badge?: string;
  /** Optional accessible label describing the badge, e.g. «Ответы, 2 ошибки». */
  badgeAriaLabel?: string;
  /** Whether the tab is visible. */
  visible: boolean;
};

/**
 * Tab navigation component for the card form.
 *
 * @remarks
 * Provides a scrollable tab bar using native MatTabGroup.
 * Emits the stable {@link TabId} of the selected tab (never a raw index).
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

  /** Visible tabs rendered in the tab bar. */
  readonly visibleTabs = computed(() => this.tabs().filter((tab) => tab.visible));

  /** Emits the stable id of the currently active tab. */
  readonly activeTabChange = output<TabId>();

  /**
   * Resolves the selected index through the visible tab list and emits its id.
   *
   * @param index - The zero-based index of the tab the user selected.
   */
  onTabChange(index: number): void {
    const tab = this.visibleTabs()[index];
    if (tab) {
      this.activeTabChange.emit(tab.id);
    }
  }
}

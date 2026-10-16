import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';

/** Tab definition for the card form navigation. */
export type TabDefinition = {
  /** Display label for the tab. */
  label: string;
  /** Whether the tab is visible. */
  visible: boolean;
};

/** Number of tabs visible in the scrollable window. */
const VISIBLE_TABS_COUNT = 3;

/**
 * Tab navigation component for the card form.
 *
 * @remarks
 * Provides a scrollable tab bar with left/right navigation buttons.
 * Shows up to VISIBLE_TABS_COUNT tabs at a time, scrollable via prev/next buttons.
 * Delegates tab content rendering to the parent via activeTab output.
 */
@Component({
  selector: 'app-card-form-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatTabsModule],
  templateUrl: './card-form-tabs.component.html',
  styleUrl: './card-form-tabs.component.scss',
})
export class CardFormTabsComponent {
  /** All tabs available for this card type. */
  readonly tabs = input.required<TabDefinition[]>();

  /** Emits the label of the currently active tab. */
  readonly activeTabChange = output<string>();

  /** Emits keyboard events for tab scrolling (Ctrl+Arrow). */
  readonly tabKeydown = output<KeyboardEvent>();

  private readonly tabOffset = computed(() => {
    const state = (this as unknown as { _offset: number })._offset ?? 0;
    return state;
  });

  private _offset = 0;
  private _selectedTabLabel: string | undefined = undefined;

  /** Maximum tab offset for horizontal scrolling. */
  get MAX_TAB_OFFSET(): number {
    return Math.max(0, this.tabs().length - VISIBLE_TABS_COUNT);
  }

  /** Currently visible tabs (windowed by tab offset). */
  readonly visibleTabs = computed(() => {
    return this.tabs().slice(this._offset, this._offset + VISIBLE_TABS_COUNT);
  });

  /** Label of the currently active tab. */
  readonly activeTabLabel = computed(() => {
    return this._selectedTabLabel ?? this.visibleTabs()[0]?.label ?? '';
  });

  /** Checks whether there are tabs to the left (scrollable). */
  canPrevTabs(): boolean {
    return this._offset > 0;
  }

  /** Checks whether there are tabs to the right (scrollable). */
  canNextTabs(): boolean {
    return this._offset < this.MAX_TAB_OFFSET;
  }

  /** Scrolls the tab window one step to the left. */
  prevTabs(): void {
    if (this.canPrevTabs()) {
      this._offset -= 1;
      this._selectedTabLabel = undefined;
    }
  }

  /** Scrolls the tab window one step to the right. */
  nextTabs(): void {
    if (this.canNextTabs()) {
      this._offset += 1;
      this._selectedTabLabel = undefined;
    }
  }

  /** Records the explicitly selected tab label and emits it. */
  onTabChange(tabLabel: string): void {
    this._selectedTabLabel = tabLabel;
    this.activeTabChange.emit(tabLabel);
  }

  /** Handles keyboard shortcuts for tab scrolling. */
  handleKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevTabs();
    } else if (event.ctrlKey && event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextTabs();
    }
    this.tabKeydown.emit(event);
  }
}

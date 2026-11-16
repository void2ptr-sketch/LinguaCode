import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  ContentHierarchySelectorComponent,
  type HierarchyLevel,
  type HierarchyValue,
} from '../../../../entities/content-hierarchy';

/**
 * Placement draft shape used by the card form.
 *
 * @remarks
 * Kept as an alias so the placement tab can stay decoupled from the full
 * `CardDraft` type.
 */
export type PlacementDraft = HierarchyValue;

/**
 * Placement tab component for the card form.
 *
 * @remarks
 * Hosts the shared `ContentHierarchySelectorComponent`, which loads every
 * option list from the backend tables (language pairs, courses, programs,
 * lessons, scenarios). The language pair is read-only on cards because it is
 * derived from the card content languages.
 */
@Component({
  selector: 'app-card-form-placement-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContentHierarchySelectorComponent],
  templateUrl: './card-form-placement-tab.component.html',
  styleUrl: './card-form-placement-tab.component.scss',
})
export class CardFormPlacementTabComponent {
  /** Required draft containing only placement fields. */
  readonly draft = input.required<PlacementDraft>();

  /** Numeric language-pair ID used to filter courses. */
  readonly languagePairId = input<number | undefined>(undefined);

  /** Disables every hierarchy control. */
  readonly readOnly = input(false);

  /** Emits the updated hierarchy value. */
  readonly placementChange = output<HierarchyValue>();

  /** Levels rendered on the card placement tab. */
  readonly levels: readonly HierarchyLevel[] = [
    'languagePair',
    'course',
    'program',
    'lesson',
    'scenario',
  ];

  /** The card pair is derived from content languages and is not editable here. */
  readonly readOnlyLevels: readonly HierarchyLevel[] = ['languagePair'];
}

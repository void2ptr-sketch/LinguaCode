import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { CardIndexMetaOverride } from '../../../../entities/card/model';
import { CardMetaFieldsComponent } from '../card-meta-fields/card-meta-fields.component';

/**
 * Publishing tab component for the card form.
 *
 * @remarks
 * Combines editable publishing metadata (difficulty, tags, access tier,
 * publication status) with a collapsed technical section containing
 * read-only backend-managed fields.
 */
@Component({
  selector: 'app-card-form-publishing-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    CardMetaFieldsComponent,
  ],
  templateUrl: './card-form-publishing-tab.component.html',
  styleUrl: './card-form-publishing-tab.component.scss',
})
export class CardFormPublishingTabComponent {
  /** Optional card index meta override. */
  readonly meta = input<CardIndexMetaOverride | undefined>();

  /** Emits the updated card index meta override. */
  readonly metaChange = output<CardIndexMetaOverride>();
}

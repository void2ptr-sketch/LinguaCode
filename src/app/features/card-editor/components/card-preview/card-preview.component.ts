import { Component, input } from '@angular/core';
import { Card } from '../../../../core/models';
import { CardHostComponent } from '../../../../shared/ui/card-host';

/**
 * Card preview component. Renders a read-only preview of a card using the `CardHostComponent`.
 * @remarks Used in the card editor to show how the card will appear during practice.
 */
@Component({
  selector: 'app-card-preview',
  imports: [CardHostComponent],
  templateUrl: './card-preview.component.html',
  styleUrl: './card-preview.component.scss',
})
export class CardPreviewComponent {
  /** Required card to preview. */
  readonly card = input.required<Card>();
  /** Font size for the preview ('sm', 'md', or 'lg'). */
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');
}

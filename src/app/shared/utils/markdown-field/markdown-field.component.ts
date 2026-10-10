import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer } from '@angular/platform-browser';

import { renderMarkdownToHtml } from './markdown.util';

type MarkdownFieldMode = 'edit' | 'preview';

/**
 * Markdown editor with live preview.
 *
 * @remarks
 * Provides a dual-mode editor: inline editing and rendered HTML preview.
 * Output is sanitized via `DomSanitizer` to prevent XSS.
 * In read-only mode, preview is always shown.
 *
 * @example
 * ```html
 * <app-markdown-field
 *   [value]="myMarkdown"
 *   (valueChange)="onUpdate($event)"
 *   label="Description"
 *   [rows]="20">
 * </app-markdown-field>
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-markdown-field',
  imports: [FormsModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule],
  templateUrl: './markdown-field.component.html',
  styleUrl: './markdown-field.component.scss',
})
export class MarkdownFieldComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** The markdown string to edit or display. */
  readonly value = input('');

  /** When true, shows preview only and disables editing. */
  readonly readOnly = input(false);

  /** Label displayed above the field. Defaults to 'Markdown'. */
  readonly label = input('Markdown');

  /** Number of textarea rows. Defaults to 14. */
  readonly rows = input(14);

  /** Optional hint text displayed below the field. */
  readonly hint = input<string | undefined>(undefined);

  /** Emits when the markdown content changes. */
  readonly valueChange = output<string>();

  /** Current editor mode: 'edit' or 'preview'. */
  readonly mode = signal<MarkdownFieldMode>('edit');

  /**
   * Effective mode: 'preview' when readOnly, otherwise follows `mode`.
   */
  readonly effectiveMode = computed<MarkdownFieldMode>(() =>
    this.readOnly() ? 'preview' : this.mode(),
  );

  /**
   * Sanitized HTML rendered from the markdown value.
   */
  readonly previewHtml = computed(() => renderMarkdownToHtml(this.value(), this.sanitizer));

  /** Whether the preview contains non-empty content. */
  readonly hasPreviewContent = computed(() => this.previewHtml().length > 0);

  /**
   * Sets the editor mode.
   *
   * @param mode - 'edit', 'preview', or null/undefined to leave unchanged.
   */
  setMode(mode: MarkdownFieldMode | null | undefined): void {
    if (mode === 'edit' || mode === 'preview') {
      this.mode.set(mode);
    }
  }

  /**
   * Emits the new markdown value on change.
   *
   * @param nextValue - The updated markdown string.
   */
  onValueChange(nextValue: string): void {
    this.valueChange.emit(nextValue);
  }
}

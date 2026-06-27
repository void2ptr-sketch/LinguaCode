import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer } from '@angular/platform-browser';

import { renderMarkdownToHtml } from '../../markdown';

type MarkdownFieldMode = 'edit' | 'preview';

@Component({
  selector: 'app-markdown-field',
  imports: [FormsModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule],
  templateUrl: './markdown-field.component.html',
  styleUrl: './markdown-field.component.scss',
})
export class MarkdownFieldComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly value = input('');
  readonly readOnly = input(false);
  readonly label = input('Markdown');
  readonly rows = input(14);
  readonly hint = input<string | undefined>(undefined);

  readonly valueChange = output<string>();

  readonly mode = signal<MarkdownFieldMode>('edit');

  readonly effectiveMode = computed<MarkdownFieldMode>(() =>
    this.readOnly() ? 'preview' : this.mode(),
  );

  readonly previewHtml = computed(() => renderMarkdownToHtml(this.value(), this.sanitizer));

  readonly hasPreviewContent = computed(() => this.previewHtml().length > 0);

  setMode(mode: MarkdownFieldMode | null | undefined): void {
    if (mode === 'edit' || mode === 'preview') {
      this.mode.set(mode);
    }
  }

  onValueChange(nextValue: string): void {
    this.valueChange.emit(nextValue);
  }
}

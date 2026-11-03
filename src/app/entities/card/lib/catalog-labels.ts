/**
 * Returns a human-readable label for a tag.
 *
 * @param tag - Tag identifier.
 * @returns Tag label from backend, or the tag id itself if not found.
 *          Difficulty tags (`beginner`, `intermediate`, `advanced`) are returned as-is.
 *
 * @remarks
 * Uses the root-level `TagsService` to get labels from the backend.
 * Falls back to returning the tag id if the service is not available.
 */
import { inject } from '@angular/core';
import { TagsService } from '../api/tags.service';

export function tagLabel(tag: string): string {
  // Difficulty tags are never localized
  if (tag === 'beginner' || tag === 'intermediate' || tag === 'advanced') {
    return tag;
  }

  try {
    const tagsService = inject(TagsService);
    return tagsService.getLabel(tag);
  } catch {
    return tag;
  }
}

/**
 * Reactive provider for tag labels.
 *
 * @remarks
 * Returns a computed map of tag code → label from `TagsService`.
 * When tags are not loaded yet, returns an empty map.
 */
export function tagLabels(): Record<string, string> {
  try {
    const tagsService = inject(TagsService);
    return tagsService.tagLabels();
  } catch {
    return {};
  }
}

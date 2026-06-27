/** Seed catalog content authored by the platform (not the local user). */
export const SYSTEM_AUTHOR_ID = 'system';

export function isSystemAuthor(authorId: string): boolean {
  return authorId === SYSTEM_AUTHOR_ID;
}

export function isEditableContentAuthor(authorId: string, userId: string): boolean {
  return authorId === userId || isSystemAuthor(authorId);
}

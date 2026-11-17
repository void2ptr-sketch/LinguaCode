/** Seed catalog content authored by the platform (not the local user). */
export const SYSTEM_AUTHOR_ID = 'system';

export function isSystemAuthor(authorId: string): boolean {
  return authorId === SYSTEM_AUTHOR_ID;
}

/**
 * Checks whether the current user can edit the given content.
 *
 * @param authorId — ID of the content author.
 * @param userId — ID of the current user.
 * @param userRoles — Roles assigned to the current user.
 * @returns `true` if the user is the author, a system author, or has
 *          `ROLE_ADMIN` / `ROLE_AUTHOR` permissions.
 */
export function isEditableContentAuthor(
  authorId: string,
  userId: string,
  userRoles?: readonly string[],
): boolean {
  // Admin or Author can edit any content
  if (userRoles?.includes('ROLE_ADMIN') || userRoles?.includes('ROLE_AUTHOR')) {
    return true;
  }
  // Or if the user is the author
  return authorId === userId || isSystemAuthor(authorId);
}

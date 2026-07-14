import type { UserContentOverlay } from './user-content-overlay.types';
import {
  USER_CONTENT_OVERLAY_KEY,
  USER_CONTENT_OVERLAY_VERSION,
} from './user-content-overlay.types';

export function emptyUserContentOverlay(): UserContentOverlay {
  return {
    version: USER_CONTENT_OVERLAY_VERSION,
    courses: {},
    lessons: {},
    scenarios: {},
    cards: {},
    cardIndexMeta: {},
    deletedSystemIds: {},
  };
}

export function readUserContentOverlay(): UserContentOverlay {
  const raw = localStorage.getItem(USER_CONTENT_OVERLAY_KEY);
  if (!raw) {
    return emptyUserContentOverlay();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserContentOverlay>;
    return normalizeUserContentOverlay(parsed);
  } catch {
    return emptyUserContentOverlay();
  }
}

export function writeUserContentOverlay(overlay: UserContentOverlay): void {
  localStorage.setItem(
    USER_CONTENT_OVERLAY_KEY,
    JSON.stringify(normalizeUserContentOverlay(overlay)),
  );
}

export function patchUserContentOverlay(
  patch: Partial<Omit<UserContentOverlay, 'version'>>,
): UserContentOverlay {
  const next = normalizeUserContentOverlay({
    ...readUserContentOverlay(),
    ...patch,
  });
  writeUserContentOverlay(next);
  return next;
}

function normalizeUserContentOverlay(value: Partial<UserContentOverlay>): UserContentOverlay {
  return {
    version: USER_CONTENT_OVERLAY_VERSION,
    courses: value.courses && typeof value.courses === 'object' ? { ...value.courses } : {},
    lessons: value.lessons && typeof value.lessons === 'object' ? { ...value.lessons } : {},
    scenarios: value.scenarios && typeof value.scenarios === 'object' ? { ...value.scenarios } : {},
    cards: value.cards && typeof value.cards === 'object' ? { ...value.cards } : {},
    cardIndexMeta:
      value.cardIndexMeta && typeof value.cardIndexMeta === 'object'
        ? { ...value.cardIndexMeta }
        : {},
    deletedSystemIds:
      value.deletedSystemIds && typeof value.deletedSystemIds === 'object'
        ? { ...value.deletedSystemIds }
        : {},
  };
}

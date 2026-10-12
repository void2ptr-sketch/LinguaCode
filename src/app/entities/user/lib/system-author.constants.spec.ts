import { describe, expect, it } from 'vitest';

import {
  SYSTEM_AUTHOR_ID,
  isSystemAuthor,
  isEditableContentAuthor,
} from './system-author.constants';

describe('system-author.constants', () => {
  it('should export SYSTEM_AUTHOR_ID', () => {
    expect(SYSTEM_AUTHOR_ID).toBeDefined();
    expect(SYSTEM_AUTHOR_ID).toBe('system');
  });

  it('should export isSystemAuthor function', () => {
    expect(isSystemAuthor).toBeDefined();
    expect(typeof isSystemAuthor).toBe('function');
  });

  it('should export isEditableContentAuthor function', () => {
    expect(isEditableContentAuthor).toBeDefined();
    expect(typeof isEditableContentAuthor).toBe('function');
  });

  it('should return true for system author ID', () => {
    expect(isSystemAuthor('system')).toBe(true);
  });

  it('should return false for non-system author ID', () => {
    expect(isSystemAuthor('user123')).toBe(false);
  });

  it('should return true when authorId equals userId', () => {
    expect(isEditableContentAuthor('user123', 'user123')).toBe(true);
  });

  it('should return true when authorId is system', () => {
    expect(isEditableContentAuthor('system', 'user123')).toBe(true);
  });

  it('should return false when authorId differs from userId and is not system', () => {
    expect(isEditableContentAuthor('userA', 'userB')).toBe(false);
  });
});

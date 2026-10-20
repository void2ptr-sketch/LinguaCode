import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_LABELS,
  CARD_KIND_LABELS,
  CARD_KINDS,
  TAG_LABELS,
  tagLabel,
} from './catalog-labels';
import type { CardKind } from '../model';

describe('catalog-labels', () => {
  // ── DIFFICULTY_LABELS ──

  describe('DIFFICULTY_LABELS', () => {
    it('should have all difficulty labels', () => {
      expect(DIFFICULTY_LABELS.beginner).toBe('Начальный');
      expect(DIFFICULTY_LABELS.intermediate).toBe('Средний');
      expect(DIFFICULTY_LABELS.advanced).toBe('Продвинутый');
    });
  });

  // ── CARD_KIND_LABELS ──

  describe('CARD_KIND_LABELS', () => {
    it('should have labels for all card kinds', () => {
      const kinds: CardKind[] = [
        'select',
        'code-select',
        'memory',
        'symbol',
        'sound',
        'timed',
        'keyboard',
        'draw',
        'tone',
        'reading',
      ];
      kinds.forEach((kind) => {
        const label = CARD_KIND_LABELS[kind as CardKind] as string | undefined;
        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
      });
    });

    it('should have Russian labels', () => {
      expect(CARD_KIND_LABELS.select).toBe('Выбор ответа');
      expect(CARD_KIND_LABELS.draw).toBe('Рисование');
      expect(CARD_KIND_LABELS.reading).toBe('Чтение (полифония)');
    });
  });

  // ── CARD_KINDS ──

  describe('CARD_KINDS', () => {
    it('should contain all card kinds', () => {
      expect(CARD_KINDS).toContain('select');
      expect(CARD_KINDS).toContain('draw');
      expect(CARD_KINDS).toContain('reading');
      expect(CARD_KINDS.length).toBe(10);
    });
  });

  // ── TAG_LABELS ──

  describe('TAG_LABELS', () => {
    it('should have demo tags', () => {
      expect(TAG_LABELS['greetings']).toBe('Приветствия');
      expect(TAG_LABELS['vocabulary']).toBe('Лексика');
      expect(TAG_LABELS['listening']).toBe('Аудирование');
    });

    it('should have Perl interview tags', () => {
      expect(TAG_LABELS['intro']).toBe('Введение');
      expect(TAG_LABELS['modern-perl']).toBe('Современный Perl');
      expect(TAG_LABELS['oop']).toBe('ООП');
    });
  });

  // ── tagLabel ──

  describe('tagLabel', () => {
    it('should return tag label from TAG_LABELS', () => {
      expect(tagLabel('greetings')).toBe('Приветствия');
      expect(tagLabel('vocabulary')).toBe('Лексика');
    });

    it('should return tag id for unknown tags', () => {
      expect(tagLabel('unknown-tag')).toBe('unknown-tag');
    });

    it('should return tag id as-is for difficulty tags', () => {
      expect(tagLabel('beginner')).toBe('beginner');
      expect(tagLabel('intermediate')).toBe('intermediate');
      expect(tagLabel('advanced')).toBe('advanced');
    });

    it('should return TAG_LABELS value for known tags', () => {
      expect(tagLabel('memory')).toBe('Память');
      expect(tagLabel('numbers')).toBe('Числа');
    });

    it('should handle Perl interview sub-tags', () => {
      expect(tagLabel('scalar-context')).toBe('Scalar / list context');
      expect(tagLabel('dbi-transactions')).toBe('Транзакции DBI');
    });
  });
});

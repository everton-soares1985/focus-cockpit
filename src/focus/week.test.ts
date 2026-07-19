import { describe, expect, test } from 'vitest';
import { getWeekStart } from './week';

describe('getWeekStart', () => {
  test('retorna a própria data quando ela é segunda-feira', () => {
    expect(getWeekStart(new Date(2026, 6, 13, 18, 30))).toBe('2026-07-13');
  });

  test('usa a segunda-feira anterior para domingo', () => {
    expect(getWeekStart(new Date(2026, 6, 19, 9, 0))).toBe('2026-07-13');
  });

  test('funciona ao atravessar o ano', () => {
    expect(getWeekStart(new Date(2027, 0, 1, 12, 0))).toBe('2026-12-28');
  });
});

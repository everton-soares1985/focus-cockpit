import { describe, expect, test } from 'vitest';
import { periodIndex, planItemDraftSchema } from './planSchema';

describe('plan domain', () => {
  test('calcula a coluna do semestre no grid', () => {
    expect(periodIndex(2026, 1, 2025)).toBe(2);
    expect(periodIndex(2026, 2, 2025)).toBe(3);
  });

  test('rejeita um período que termina antes do início', () => {
    const result = planItemDraftSchema.safeParse({
      title: 'Período inválido',
      category: 'Cursos',
      startYear: 2027,
      startSemester: 2,
      endYear: 2027,
      endSemester: 1,
      status: 'Planejado',
    });

    expect(result.success).toBe(false);
  });

  test('aceita um bloco atravessando vários anos', () => {
    const result = planItemDraftSchema.safeParse({
      title: 'Idioma',
      category: 'Idiomas',
      startYear: 2026,
      startSemester: 1,
      endYear: 2028,
      endSemester: 2,
      status: 'Em andamento',
      color: '#28d7f0',
    });

    expect(result.success).toBe(true);
  });
});

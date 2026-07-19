import { describe, expect, test } from 'vitest';
import { courseDraftSchema } from './courseSchema';

describe('courseDraftSchema', () => {
  test('normaliza datas vazias e campos opcionais', () => {
    const course = courseDraftSchema.parse({
      title: 'Curso demonstrativo',
      status: 'Planejado',
      institution: '',
      startedOn: '',
      completedOn: null,
    });

    expect(course.institution).toBeNull();
    expect(course.startedOn).toBeNull();
    expect(course.completedOn).toBeNull();
  });

  test('rejeita conclusão anterior ao início', () => {
    const result = courseDraftSchema.safeParse({
      title: 'Curso',
      status: 'Concluído',
      startedOn: '2026-07-10',
      completedOn: '2026-07-01',
    });

    expect(result.success).toBe(false);
  });
});

import { describe, expect, test } from 'vitest';
import { projectDraftSchema } from './projectSchema';

describe('projectDraftSchema', () => {
  test('normaliza campos opcionais vazios', () => {
    const project = projectDraftSchema.parse({
      name: '  Projeto demonstrativo  ',
      lane: 'A',
      status: 'Ativo',
      area: '   ',
      nextAction: '',
    });

    expect(project.name).toBe('Projeto demonstrativo');
    expect(project.area).toBeNull();
    expect(project.nextAction).toBeNull();
    expect(project.priority).toBeNull();
  });

  test('rejeita lane e status desconhecidos', () => {
    const result = projectDraftSchema.safeParse({
      name: 'Projeto',
      lane: 'C',
      status: 'Inventado',
    });

    expect(result.success).toBe(false);
  });
});

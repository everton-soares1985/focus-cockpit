import { describe, expect, test } from 'vitest';
import { shortcutDraftSchema } from './shortcutSchema';

describe('shortcutDraftSchema', () => {
  test('aceita um caminho manual de arquivo', () => {
    const shortcut = shortcutDraftSchema.parse({
      label: 'Documento demonstrativo',
      targetType: 'file',
      path: 'C:\\Demo\\documento.pdf',
    });

    expect(shortcut.favorite).toBe(false);
    expect(shortcut.sortOrder).toBe(0);
  });

  test('rejeita tipo de destino desconhecido', () => {
    const result = shortcutDraftSchema.safeParse({
      label: 'Comando',
      targetType: 'command',
      path: 'calc.exe',
    });

    expect(result.success).toBe(false);
  });
});

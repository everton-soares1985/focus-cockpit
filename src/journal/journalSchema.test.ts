import { describe, expect, test } from 'vitest';
import { journalEntryDraftSchema } from './journalSchema';

describe('journalEntryDraftSchema', () => {
  test('aceita Markdown livre em uma data válida', () => {
    const result = journalEntryDraftSchema.parse({
      entryDate: '2026-11-18',
      summary: 'Treino para entrevista',
      contentMd: '- [ ] Revisar respostas',
    });
    expect(result.entryDate).toBe('2026-11-18');
  });

  test('rejeita data impossível e resumo longo', () => {
    expect(() =>
      journalEntryDraftSchema.parse({
        entryDate: '2026-02-31',
        summary: 'a'.repeat(181),
        contentMd: '',
      }),
    ).toThrow();
  });
});

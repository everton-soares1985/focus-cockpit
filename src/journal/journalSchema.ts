import { z } from 'zod';

export const journalEntryDraftSchema = z.object({
  entryDate: z.iso.date(),
  summary: z.string().trim().max(180, 'O resumo pode ter até 180 caracteres.'),
  contentMd: z.string().max(100000, 'A anotação atingiu o limite de tamanho.'),
});

export type JournalEntryDraft = z.output<typeof journalEntryDraftSchema>;
export type JournalEntryDraftInput = z.input<typeof journalEntryDraftSchema>;

export interface JournalEntry extends JournalEntryDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

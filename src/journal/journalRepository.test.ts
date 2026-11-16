import type Database from '@tauri-apps/plugin-sql';
import { describe, expect, test, vi } from 'vitest';
import { getJournalEntry, listJournalEntryDates, saveJournalEntry } from './journalRepository';

describe('journalRepository', () => {
  test('salva por data com upsert e relê o registro', async () => {
    const execute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
    const select = vi.fn().mockResolvedValue([
      {
        id: 'journal-1',
        entry_date: '2026-11-18',
        summary: 'Entrevista em inglês',
        content_md: '## Preparação',
        created_at: '2026-11-16T12:00:00.000Z',
        updated_at: '2026-11-16T12:00:00.000Z',
      },
    ]);
    const db = { execute, select } as unknown as Database;

    const saved = await saveJournalEntry(db, {
      entryDate: '2026-11-18',
      summary: 'Entrevista em inglês',
      contentMd: '## Preparação',
    });

    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(entry_date) DO UPDATE'),
      expect.arrayContaining(['2026-11-18', 'Entrevista em inglês', '## Preparação']),
    );
    expect(saved.entryDate).toBe('2026-11-18');
  });

  test('retorna null quando o dia ainda não possui página', async () => {
    const select = vi.fn().mockResolvedValue([]);
    const db = { select } as unknown as Database;
    await expect(getJournalEntry(db, '2026-11-19')).resolves.toBeNull();
  });

  test('lista somente as datas devolvidas pelo banco', async () => {
    const select = vi.fn().mockResolvedValue([
      { entry_date: '2026-11-18' },
      { entry_date: '2026-11-20' },
    ]);
    const db = { select } as unknown as Database;
    await expect(listJournalEntryDates(db)).resolves.toEqual([
      '2026-11-18',
      '2026-11-20',
    ]);
  });
});

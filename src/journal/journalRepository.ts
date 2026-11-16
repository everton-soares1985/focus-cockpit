import type Database from '@tauri-apps/plugin-sql';
import {
  journalEntryDraftSchema,
  type JournalEntry,
  type JournalEntryDraftInput,
} from './journalSchema';

interface JournalEntryRow {
  id: string;
  entry_date: string;
  summary: string;
  content_md: string;
  created_at: string;
  updated_at: string;
}
interface JournalEntryDateRow {
  entry_date: string;
}

function mapJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    summary: row.summary,
    contentMd: row.content_md,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getJournalEntry(
  db: Database,
  entryDate: string,
): Promise<JournalEntry | null> {
  const date = journalEntryDraftSchema.shape.entryDate.parse(entryDate);
  const rows = await db.select<JournalEntryRow[]>(
    `SELECT id, entry_date, summary, content_md, created_at, updated_at
     FROM journal_entries
     WHERE entry_date = $1`,
    [date],
  );
  return rows[0] ? mapJournalEntry(rows[0]) : null;
}

export async function listJournalEntryDates(db: Database): Promise<string[]> {
  const rows = await db.select<JournalEntryDateRow[]>(
    `SELECT entry_date
     FROM journal_entries
     WHERE length(trim(summary)) > 0 OR length(trim(content_md)) > 0
     ORDER BY entry_date`,
  );
  return rows.map((row) => row.entry_date);
}

export async function saveJournalEntry(
  db: Database,
  input: JournalEntryDraftInput,
): Promise<JournalEntry> {
  const draft = journalEntryDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db.execute(
    `INSERT INTO journal_entries (
       id, entry_date, summary, content_md, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT(entry_date) DO UPDATE SET
       summary = excluded.summary,
       content_md = excluded.content_md,
       updated_at = excluded.updated_at`,
    [id, draft.entryDate, draft.summary, draft.contentMd, timestamp],
  );

  const saved = await getJournalEntry(db, draft.entryDate);
  if (!saved) {
    throw new Error('A anotação não pôde ser relida após o salvamento.');
  }
  return saved;
}

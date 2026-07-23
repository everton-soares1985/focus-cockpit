import type Database from '@tauri-apps/plugin-sql';
import {
  bookDraftSchema,
  type Book,
  type BookDraftInput,
  type BookFilters,
} from './bookSchema';

interface BookRow {
  id: string;
  title: string;
  author: string | null;
  status: Book['status'];
  progress_percent: number;
  current_page: number | null;
  total_pages: number | null;
  started_on: string | null;
  completed_on: string | null;
  rating: number | null;
  notes: string | null;
  file_path: string | null;
  link: string | null;
  created_at: string;
  updated_at: string;
}

function mapBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    status: row.status,
    progressPercent: row.progress_percent,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    startedOn: row.started_on,
    completedOn: row.completed_on,
    rating: row.rating,
    notes: row.notes,
    filePath: row.file_path,
    link: row.link,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBooks(
  db: Database,
  filters: BookFilters = {},
): Promise<Book[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    clauses.push(
      `(title LIKE $${values.length} COLLATE NOCASE OR author LIKE $${values.length} COLLATE NOCASE)`,
    );
  }
  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<BookRow[]>(
    `SELECT *
     FROM books
     ${where}
     ORDER BY
       CASE status
         WHEN 'Lendo' THEN 0
         WHEN 'Quero ler' THEN 1
         WHEN 'Pausado' THEN 2
         WHEN 'Concluído' THEN 3
         ELSE 4
       END,
       updated_at DESC,
       title COLLATE NOCASE`,
    values,
  );
  return rows.map(mapBook);
}

export async function createBook(
  db: Database,
  input: BookDraftInput,
): Promise<string> {
  const draft = bookDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO books (
       id, title, author, status, progress_percent, current_page, total_pages,
       started_on, completed_on, rating, notes, file_path, link, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14
     )`,
    [
      id,
      draft.title,
      draft.author,
      draft.status,
      draft.progressPercent,
      draft.currentPage,
      draft.totalPages,
      draft.startedOn,
      draft.completedOn,
      draft.rating,
      draft.notes,
      draft.filePath,
      draft.link,
      timestamp,
    ],
  );
  return id;
}

export async function updateBook(
  db: Database,
  id: string,
  input: BookDraftInput,
): Promise<void> {
  const draft = bookDraftSchema.parse(input);
  const result = await db.execute(
    `UPDATE books SET
       title = $1, author = $2, status = $3, progress_percent = $4,
       current_page = $5, total_pages = $6, started_on = $7,
       completed_on = $8, rating = $9, notes = $10, file_path = $11,
       link = $12, updated_at = $13
     WHERE id = $14`,
    [
      draft.title,
      draft.author,
      draft.status,
      draft.progressPercent,
      draft.currentPage,
      draft.totalPages,
      draft.startedOn,
      draft.completedOn,
      draft.rating,
      draft.notes,
      draft.filePath,
      draft.link,
      new Date().toISOString(),
      id,
    ],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Livro não encontrado.');
  }
}

export async function deleteBookRecord(db: Database, id: string): Promise<void> {
  const result = await db.execute('DELETE FROM books WHERE id = $1', [id]);
  if (result.rowsAffected !== 1) {
    throw new Error('Livro não encontrado.');
  }
}

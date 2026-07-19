import type Database from '@tauri-apps/plugin-sql';
import {
  shortcutDraftSchema,
  type Shortcut,
  type ShortcutDraftInput,
  type ShortcutFilters,
} from './shortcutSchema';

interface ShortcutRow {
  id: string;
  label: string;
  target_type: 'file' | 'folder';
  path: string;
  category: string | null;
  notes: string | null;
  favorite: number;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

function mapShortcut(row: ShortcutRow): Shortcut {
  return {
    id: row.id,
    label: row.label,
    targetType: row.target_type,
    path: row.path,
    category: row.category,
    notes: row.notes,
    favorite: row.favorite === 1,
    sortOrder: row.sort_order,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const shortcutColumns = `
  id, label, target_type, path, category, notes, favorite, sort_order,
  archived, created_at, updated_at
`;

export async function listShortcuts(
  db: Database,
  filters: ShortcutFilters = {},
): Promise<Shortcut[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (!filters.includeArchived) {
    clauses.push('archived = 0');
  }
  if (filters.favoritesOnly) {
    clauses.push('favorite = 1');
  }
  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    clauses.push(`(label LIKE $${values.length} COLLATE NOCASE OR path LIKE $${values.length} COLLATE NOCASE)`);
  }
  if (filters.category?.trim()) {
    values.push(filters.category.trim());
    clauses.push(`category = $${values.length}`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<ShortcutRow[]>(
    `SELECT ${shortcutColumns} FROM shortcuts ${where}
     ORDER BY archived ASC, favorite DESC, sort_order ASC, label COLLATE NOCASE ASC`,
    values,
  );
  return rows.map(mapShortcut);
}

export async function getFavoriteShortcuts(
  db: Database,
  limit = 3,
): Promise<Shortcut[]> {
  const rows = await db.select<ShortcutRow[]>(
    `SELECT ${shortcutColumns} FROM shortcuts
     WHERE archived = 0 AND favorite = 1
     ORDER BY sort_order ASC, updated_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapShortcut);
}

export async function createShortcut(
  db: Database,
  input: ShortcutDraftInput,
): Promise<string> {
  const draft = shortcutDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO shortcuts (
       id, label, target_type, path, category, notes, favorite, sort_order,
       archived, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $9)`,
    [
      id,
      draft.label,
      draft.targetType,
      draft.path,
      draft.category,
      draft.notes,
      draft.favorite ? 1 : 0,
      draft.sortOrder,
      timestamp,
    ],
  );
  return id;
}

export async function updateShortcut(
  db: Database,
  id: string,
  input: ShortcutDraftInput,
): Promise<void> {
  const draft = shortcutDraftSchema.parse(input);
  const result = await db.execute(
    `UPDATE shortcuts SET
       label = $1, target_type = $2, path = $3, category = $4, notes = $5,
       favorite = $6, sort_order = $7, updated_at = $8
     WHERE id = $9`,
    [
      draft.label,
      draft.targetType,
      draft.path,
      draft.category,
      draft.notes,
      draft.favorite ? 1 : 0,
      draft.sortOrder,
      new Date().toISOString(),
      id,
    ],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Atalho não encontrado.');
  }
}

export async function archiveShortcut(db: Database, id: string): Promise<void> {
  const result = await db.execute(
    'UPDATE shortcuts SET archived = 1, updated_at = $1 WHERE id = $2',
    [new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Atalho não encontrado.');
  }
}

export async function restoreShortcut(db: Database, id: string): Promise<void> {
  const result = await db.execute(
    'UPDATE shortcuts SET archived = 0, updated_at = $1 WHERE id = $2',
    [new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Atalho não encontrado.');
  }
}

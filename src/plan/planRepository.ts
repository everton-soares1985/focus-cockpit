import type Database from '@tauri-apps/plugin-sql';
import {
  planItemDraftSchema,
  planNoteDraftSchema,
  type PlanItem,
  type PlanItemDraftInput,
  type PlanNote,
  type PlanNoteDraftInput,
  type PlanNoteGroup,
} from './planSchema';

interface PlanItemRow {
  id: string;
  title: string;
  category: PlanItem['category'];
  start_year: number;
  start_semester: 1 | 2;
  end_year: number;
  end_semester: 1 | 2;
  status: PlanItem['status'];
  color: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PlanNoteRow {
  id: string;
  group_name: PlanNoteGroup;
  title: string;
  sort_order: number;
  archived: number;
  created_at: string;
  updated_at: string;
}

function mapPlanItem(row: PlanItemRow): PlanItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    startYear: row.start_year,
    startSemester: row.start_semester,
    endYear: row.end_year,
    endSemester: row.end_semester,
    status: row.status,
    color: row.color,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPlanNote(row: PlanNoteRow): PlanNote {
  return {
    id: row.id,
    groupName: row.group_name,
    title: row.title,
    sortOrder: row.sort_order,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPlanItems(
  db: Database,
  firstYear?: number,
  lastYear?: number,
): Promise<PlanItem[]> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (firstYear !== undefined) {
    values.push(firstYear);
    clauses.push(`end_year >= $${values.length}`);
  }
  if (lastYear !== undefined) {
    values.push(lastYear);
    clauses.push(`start_year <= $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<PlanItemRow[]>(
    `SELECT * FROM plan_items ${where}
     ORDER BY category, start_year, start_semester, sort_order, title COLLATE NOCASE`,
    values,
  );
  return rows.map(mapPlanItem);
}

export async function createPlanItem(
  db: Database,
  input: PlanItemDraftInput,
): Promise<string> {
  const draft = planItemDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO plan_items (
       id, title, category, start_year, start_semester, end_year, end_semester,
       status, color, notes, sort_order, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
    [
      id,
      draft.title,
      draft.category,
      draft.startYear,
      draft.startSemester,
      draft.endYear,
      draft.endSemester,
      draft.status,
      draft.color,
      draft.notes,
      draft.sortOrder,
      timestamp,
    ],
  );
  return id;
}

export async function updatePlanItem(
  db: Database,
  id: string,
  input: PlanItemDraftInput,
): Promise<void> {
  const draft = planItemDraftSchema.parse(input);
  const result = await db.execute(
    `UPDATE plan_items SET
       title = $1, category = $2, start_year = $3, start_semester = $4,
       end_year = $5, end_semester = $6, status = $7, color = $8,
       notes = $9, sort_order = $10, updated_at = $11
     WHERE id = $12`,
    [
      draft.title,
      draft.category,
      draft.startYear,
      draft.startSemester,
      draft.endYear,
      draft.endSemester,
      draft.status,
      draft.color,
      draft.notes,
      draft.sortOrder,
      new Date().toISOString(),
      id,
    ],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Item do plano não encontrado.');
  }
}

export async function deletePlanItem(db: Database, id: string): Promise<void> {
  const result = await db.execute('DELETE FROM plan_items WHERE id = $1', [id]);
  if (result.rowsAffected !== 1) {
    throw new Error('Item do plano não encontrado.');
  }
}

export async function listPlanNotes(
  db: Database,
  includeArchived = false,
): Promise<PlanNote[]> {
  const rows = await db.select<PlanNoteRow[]>(
    `SELECT * FROM plan_notes ${includeArchived ? '' : 'WHERE archived = 0'}
     ORDER BY group_name, sort_order, title COLLATE NOCASE`,
  );
  return rows.map(mapPlanNote);
}

export async function createPlanNote(
  db: Database,
  input: PlanNoteDraftInput,
): Promise<string> {
  const draft = planNoteDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO plan_notes (
       id, group_name, title, sort_order, archived, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, 0, $5, $5)`,
    [id, draft.groupName, draft.title, draft.sortOrder, timestamp],
  );
  return id;
}

export async function updatePlanNote(
  db: Database,
  id: string,
  input: PlanNoteDraftInput,
): Promise<void> {
  const draft = planNoteDraftSchema.parse(input);
  const result = await db.execute(
    `UPDATE plan_notes SET group_name = $1, title = $2, sort_order = $3,
       updated_at = $4 WHERE id = $5`,
    [draft.groupName, draft.title, draft.sortOrder, new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Anotação do plano não encontrada.');
  }
}

export async function archivePlanNote(db: Database, id: string): Promise<void> {
  const result = await db.execute(
    'UPDATE plan_notes SET archived = 1, updated_at = $1 WHERE id = $2',
    [new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Anotação do plano não encontrada.');
  }
}

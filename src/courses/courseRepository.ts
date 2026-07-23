import type Database from '@tauri-apps/plugin-sql';
import {
  courseDraftSchema,
  type Course,
  type CourseDraftInput,
  type CourseFilters,
} from './courseSchema';

interface CourseRow {
  id: string;
  institution: string | null;
  title: string;
  category: string | null;
  status: Course['status'];
  priority: Course['priority'];
  started_on: string | null;
  completed_on: string | null;
  notes: string | null;
  archived: number;
  credential_count: number;
  created_at: string;
  updated_at: string;
}

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    institution: row.institution,
    title: row.title,
    category: row.category,
    status: row.status,
    priority: row.priority,
    startedOn: row.started_on,
    completedOn: row.completed_on,
    notes: row.notes,
    archived: row.archived === 1,
    credentialCount: row.credential_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCourses(
  db: Database,
  filters: CourseFilters = {},
): Promise<Course[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (!filters.includeArchived) {
    clauses.push('c.archived = 0');
  }
  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    clauses.push(
      `(c.title LIKE $${values.length} COLLATE NOCASE OR c.institution LIKE $${values.length} COLLATE NOCASE)`,
    );
  }
  if (filters.status) {
    values.push(filters.status);
    clauses.push(`c.status = $${values.length}`);
  }
  if (filters.category?.trim()) {
    values.push(filters.category.trim());
    clauses.push(`c.category = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<CourseRow[]>(
    `SELECT c.*, COUNT(cr.id) AS credential_count
     FROM courses c
     LEFT JOIN credentials cr ON cr.course_id = c.id
     ${where}
     GROUP BY c.id
     ORDER BY c.archived ASC,
       CASE c.status WHEN 'Em andamento' THEN 0 WHEN 'Planejado' THEN 1 ELSE 2 END,
       c.title COLLATE NOCASE`,
    values,
  );
  return rows.map(mapCourse);
}

export async function createCourse(
  db: Database,
  input: CourseDraftInput,
): Promise<string> {
  const draft = courseDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO courses (
       id, institution, title, category, status, priority, started_on,
       completed_on, notes, archived, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $10)`,
    [
      id,
      draft.institution,
      draft.title,
      draft.category,
      draft.status,
      draft.priority,
      draft.startedOn,
      draft.completedOn,
      draft.notes,
      timestamp,
    ],
  );
  return id;
}

export async function updateCourse(
  db: Database,
  id: string,
  input: CourseDraftInput,
): Promise<void> {
  const draft = courseDraftSchema.parse(input);
  const result = await db.execute(
    `UPDATE courses SET
       institution = $1, title = $2, category = $3, status = $4,
       priority = $5, started_on = $6, completed_on = $7, notes = $8,
       updated_at = $9
     WHERE id = $10`,
    [
      draft.institution,
      draft.title,
      draft.category,
      draft.status,
      draft.priority,
      draft.startedOn,
      draft.completedOn,
      draft.notes,
      new Date().toISOString(),
      id,
    ],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Curso não encontrado.');
  }
}

async function setCourseArchived(
  db: Database,
  id: string,
  archived: boolean,
): Promise<void> {
  const result = await db.execute(
    'UPDATE courses SET archived = $1, updated_at = $2 WHERE id = $3',
    [archived ? 1 : 0, new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Curso não encontrado.');
  }
}

export async function archiveCourse(db: Database, id: string): Promise<void> {
  await setCourseArchived(db, id, true);
}

export async function restoreCourse(db: Database, id: string): Promise<void> {
  await setCourseArchived(db, id, false);
}

export async function deleteCourseRecord(db: Database, id: string): Promise<void> {
  const result = await db.execute('DELETE FROM courses WHERE id = $1', [id]);
  if (result.rowsAffected !== 1) {
    throw new Error('Curso não encontrado.');
  }
}

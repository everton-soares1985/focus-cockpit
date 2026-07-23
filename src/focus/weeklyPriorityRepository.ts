import type Database from '@tauri-apps/plugin-sql';
import {
  weeklyPriorityDraftSchema,
  type WeeklyPriority,
  type WeeklyPriorityDraftInput,
  type WeeklyPrioritySlot,
} from './focusSchema';

interface WeeklyPriorityRow {
  id: string;
  week_start: string;
  position: 1 | 2 | 3;
  title: string;
  project_id: string | null;
  project_name: string | null;
  done: number;
  created_at: string;
  updated_at: string;
}

function mapPriority(row: WeeklyPriorityRow): WeeklyPriority {
  return {
    id: row.id,
    weekStart: row.week_start,
    position: row.position,
    title: row.title,
    projectId: row.project_id,
    projectName: row.project_name,
    done: row.done === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWeeklyPrioritySlots(
  db: Database,
  weekStart: string,
): Promise<WeeklyPrioritySlot[]> {
  const parsedWeek = weeklyPriorityDraftSchema.shape.weekStart.parse(weekStart);
  const rows = await db.select<WeeklyPriorityRow[]>(
    `SELECT
       wp.id, wp.week_start, wp.position, wp.title, wp.project_id,
       p.name AS project_name, wp.done, wp.created_at, wp.updated_at
     FROM weekly_priorities wp
     LEFT JOIN projects p ON p.id = wp.project_id
     WHERE wp.week_start = $1
     ORDER BY wp.position`,
    [parsedWeek],
  );
  const byPosition = new Map(rows.map((row) => [row.position, mapPriority(row)]));
  return ([1, 2, 3] as const).map((position) => ({
    position,
    priority: byPosition.get(position) ?? null,
  }));
}

export async function saveWeeklyPriority(
  db: Database,
  input: WeeklyPriorityDraftInput,
): Promise<void> {
  const draft = weeklyPriorityDraftSchema.parse(input);
  if (draft.projectId) {
    const projects = await db.select<Array<{ archived: number }>>(
      'SELECT archived FROM projects WHERE id = $1',
      [draft.projectId],
    );
    if (!projects[0]) {
      throw new Error('Projeto vinculado não encontrado.');
    }
    if (projects[0].archived === 1) {
      throw new Error('Uma prioridade não pode usar um projeto arquivado.');
    }
  }

  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO weekly_priorities (
       id, week_start, position, title, project_id, done, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
     ON CONFLICT(week_start, position) DO UPDATE SET
       title = excluded.title,
       project_id = excluded.project_id,
       done = excluded.done,
       updated_at = excluded.updated_at`,
    [
      crypto.randomUUID(),
      draft.weekStart,
      draft.position,
      draft.title,
      draft.projectId,
      draft.done ? 1 : 0,
      timestamp,
    ],
  );
}

export async function setWeeklyPriorityDone(
  db: Database,
  id: string,
  done: boolean,
): Promise<void> {
  const result = await db.execute(
    'UPDATE weekly_priorities SET done = $1, updated_at = $2 WHERE id = $3',
    [done ? 1 : 0, new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Prioridade não encontrada.');
  }
}

export async function clearWeeklyPriority(
  db: Database,
  weekStart: string,
  position: 1 | 2 | 3,
): Promise<void> {
  await db.execute(
    'DELETE FROM weekly_priorities WHERE week_start = $1 AND position = $2',
    [weekStart, position],
  );
}

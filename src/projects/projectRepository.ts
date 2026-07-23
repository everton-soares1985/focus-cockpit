import type Database from '@tauri-apps/plugin-sql';
import {
  projectDraftSchema,
  type Project,
  type ProjectDraftInput,
  type ProjectFilters,
} from './projectSchema';

interface ProjectRow {
  id: string;
  name: string;
  lane: 'A' | 'B';
  area: string | null;
  status: 'Ativo' | 'Pausado' | 'Concluído';
  priority: 'Alta' | 'Média' | 'Baixa' | null;
  next_action: string | null;
  last_progress: string | null;
  folder_path: string | null;
  notes: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
}

const projectColumns = `
  id, name, lane, area, status, priority, next_action, last_progress,
  folder_path, notes, archived, created_at, updated_at
`;

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    lane: row.lane,
    area: row.area,
    status: row.status,
    priority: row.priority,
    nextAction: row.next_action,
    lastProgress: row.last_progress,
    folderPath: row.folder_path,
    notes: row.notes,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(
  db: Database,
  filters: ProjectFilters = {},
): Promise<Project[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (!filters.includeArchived) {
    clauses.push('archived = 0');
  }
  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    clauses.push(`name LIKE $${values.length} COLLATE NOCASE`);
  }
  if (filters.lane) {
    values.push(filters.lane);
    clauses.push(`lane = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<ProjectRow[]>(
    `SELECT ${projectColumns} FROM projects ${where}
     ORDER BY archived ASC, lane ASC, updated_at DESC, name COLLATE NOCASE ASC`,
    values,
  );
  return rows.map(mapProject);
}

export async function getProject(
  db: Database,
  id: string,
): Promise<Project | null> {
  const rows = await db.select<ProjectRow[]>(
    `SELECT ${projectColumns} FROM projects WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapProject(rows[0]) : null;
}

export async function createProject(
  db: Database,
  input: ProjectDraftInput,
): Promise<Project> {
  const draft = projectDraftSchema.parse(input);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await db.execute(
    `INSERT INTO projects (
      id, name, lane, area, status, priority, next_action, last_progress,
      folder_path, notes, archived, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $11)`,
    [
      id,
      draft.name,
      draft.lane,
      draft.area,
      draft.status,
      draft.priority,
      draft.nextAction,
      draft.lastProgress,
      draft.folderPath,
      draft.notes,
      timestamp,
    ],
  );

  const project = await getProject(db, id);
  if (!project) {
    throw new Error('O projeto foi salvo, mas não pôde ser recarregado.');
  }
  return project;
}

export async function updateProject(
  db: Database,
  id: string,
  input: ProjectDraftInput,
): Promise<Project> {
  const draft = projectDraftSchema.parse(input);
  const result = await db.execute(
    `UPDATE projects SET
      name = $1, lane = $2, area = $3, status = $4, priority = $5,
      next_action = $6, last_progress = $7, folder_path = $8, notes = $9,
      updated_at = $10
     WHERE id = $11`,
    [
      draft.name,
      draft.lane,
      draft.area,
      draft.status,
      draft.priority,
      draft.nextAction,
      draft.lastProgress,
      draft.folderPath,
      draft.notes,
      new Date().toISOString(),
      id,
    ],
  );

  if (result.rowsAffected !== 1) {
    throw new Error('Projeto não encontrado.');
  }
  const project = await getProject(db, id);
  if (!project) {
    throw new Error('O projeto atualizado não pôde ser recarregado.');
  }
  return project;
}

async function setProjectArchived(
  db: Database,
  id: string,
  archived: boolean,
): Promise<void> {
  const result = await db.execute(
    `UPDATE projects SET archived = $1, updated_at = $2 WHERE id = $3`,
    [archived ? 1 : 0, new Date().toISOString(), id],
  );
  if (result.rowsAffected !== 1) {
    throw new Error('Projeto não encontrado.');
  }
}

export async function archiveProject(db: Database, id: string): Promise<void> {
  await setProjectArchived(db, id, true);
}

export async function restoreProject(db: Database, id: string): Promise<void> {
  await setProjectArchived(db, id, false);
}

export async function deleteProjectRecord(db: Database, id: string): Promise<void> {
  const result = await db.execute('DELETE FROM projects WHERE id = $1', [id]);
  if (result.rowsAffected !== 1) {
    throw new Error('Projeto não encontrado.');
  }
}

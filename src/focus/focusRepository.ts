import type Database from '@tauri-apps/plugin-sql';
import type { Lane, Project } from '../projects/projectSchema';
import { focusSelectionSchema, type FocusSlot } from './focusSchema';

interface FocusRow {
  slot_lane: Lane;
  slot_updated_at: string | null;
  id: string | null;
  name: string | null;
  project_lane: Lane | null;
  area: string | null;
  status: 'Ativo' | 'Pausado' | 'Concluído' | null;
  priority: 'Alta' | 'Média' | 'Baixa' | null;
  next_action: string | null;
  last_progress: string | null;
  folder_path: string | null;
  notes: string | null;
  archived: number | null;
  created_at: string | null;
  project_updated_at: string | null;
}

function mapFocusedProject(row: FocusRow): Project | null {
  if (
    !row.id ||
    !row.name ||
    !row.project_lane ||
    !row.status ||
    !row.created_at ||
    !row.project_updated_at
  ) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    lane: row.project_lane,
    area: row.area,
    status: row.status,
    priority: row.priority,
    nextAction: row.next_action,
    lastProgress: row.last_progress,
    folderPath: row.folder_path,
    notes: row.notes,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.project_updated_at,
  };
}

export async function getFocusSlots(db: Database): Promise<FocusSlot[]> {
  const rows = await db.select<FocusRow[]>(
    `WITH lanes(lane) AS (VALUES ('A'), ('B'))
     SELECT
       lanes.lane AS slot_lane,
       fs.updated_at AS slot_updated_at,
       p.id,
       p.name,
       p.lane AS project_lane,
       p.area,
       p.status,
       p.priority,
       p.next_action,
       p.last_progress,
       p.folder_path,
       p.notes,
       p.archived,
       p.created_at,
       p.updated_at AS project_updated_at
     FROM lanes
     LEFT JOIN focus_slots fs ON fs.lane = lanes.lane
     LEFT JOIN projects p ON p.id = fs.project_id
     ORDER BY lanes.lane`,
  );

  return rows.map((row) => ({
    lane: row.slot_lane,
    project: mapFocusedProject(row),
    updatedAt: row.slot_updated_at,
  }));
}

export async function setFocusProject(
  db: Database,
  laneInput: Lane,
  projectId: string | null,
): Promise<void> {
  const selection = focusSelectionSchema.parse({ lane: laneInput, projectId });

  if (selection.projectId) {
    const projects = await db.select<Array<{ lane: Lane; archived: number }>>(
      'SELECT lane, archived FROM projects WHERE id = $1',
      [selection.projectId],
    );
    const project = projects[0];
    if (!project) {
      throw new Error('Projeto não encontrado.');
    }
    if (project.archived === 1) {
      throw new Error('Um projeto arquivado não pode ser colocado em foco.');
    }
    if (project.lane !== selection.lane) {
      throw new Error(`Selecione um projeto da Lane ${selection.lane}.`);
    }
  }

  await db.execute(
    `INSERT INTO focus_slots (lane, project_id, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT(lane) DO UPDATE SET
       project_id = excluded.project_id,
       updated_at = excluded.updated_at`,
    [selection.lane, selection.projectId, new Date().toISOString()],
  );
}

import Database from '@tauri-apps/plugin-sql';
import { getWeekStart } from '../focus/week';
import { withTransaction } from './transaction';

export interface DemoCleanupResult {
  removedProjects: number;
  removedCourses: number;
  removedCredentials: number;
  removedShortcuts: number;
  removedPriorities: number;
  removedPlanItems: number;
  removedPlanNotes: number;
}

export async function runDemoSeed(db: Database) {
  const currentWeek = getWeekStart();
  try {
    await db.execute('BEGIN TRANSACTION');

    // 2 Projects
    await db.execute(
      `INSERT INTO projects (id, name, lane, area, status, priority, next_action, last_progress, folder_path, notes, archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET 
         name=excluded.name, lane=excluded.lane, area=excluded.area, status=excluded.status, 
         priority=excluded.priority, next_action=excluded.next_action, last_progress=excluded.last_progress, folder_path=excluded.folder_path,
         notes=excluded.notes, updated_at=datetime('now')`,
      ["proj-demo-1", "Painel visual pessoal", "B", "Portfólio", "Ativo", "Alta", "Revisar a experiência das seis abas", "Mockup aprovado e núcleo local concluído", "C:\\Demo\\LaneB\\Projeto1", "Aplicativo demonstrativo em Tauri e React"]
    );

    await db.execute(
      `INSERT INTO projects (id, name, lane, area, status, priority, next_action, last_progress, folder_path, notes, archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET 
         name=excluded.name, lane=excluded.lane, area=excluded.area, status=excluded.status, 
         priority=excluded.priority, next_action=excluded.next_action, last_progress=excluded.last_progress, folder_path=excluded.folder_path,
         notes=excluded.notes, updated_at=datetime('now')`,
      ["proj-demo-2", "Projeto principal fictício", "A", "Carreira", "Ativo", "Alta", "Concluir a prioridade principal", "Estrutura e objetivos revisados", "C:\\Demo\\LaneA\\Projeto2", "Exemplo sem dados pessoais"]
    );
    
    // 2 Focus Slots
    await db.execute("INSERT INTO focus_slots (lane, project_id, updated_at) VALUES ('A', 'proj-demo-2', datetime('now')) ON CONFLICT(lane) DO UPDATE SET project_id=excluded.project_id, updated_at=datetime('now')");
    await db.execute("INSERT INTO focus_slots (lane, project_id, updated_at) VALUES ('B', 'proj-demo-1', datetime('now')) ON CONFLICT(lane) DO UPDATE SET project_id=excluded.project_id, updated_at=datetime('now')");

    // 3 Priorities
    await db.execute(
      `INSERT INTO weekly_priorities (id, week_start, position, title, project_id, done, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         week_start=excluded.week_start, position=excluded.position, title=excluded.title,
         project_id=excluded.project_id, done=excluded.done, updated_at=datetime('now')`,
      ["prio-1", currentWeek, 1, "Concluir prioridade principal", "proj-demo-2"]
    );
    await db.execute(
      `INSERT INTO weekly_priorities (id, week_start, position, title, project_id, done, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         week_start=excluded.week_start, position=excluded.position, title=excluded.title,
         project_id=excluded.project_id, done=excluded.done, updated_at=datetime('now')`,
      ["prio-2", currentWeek, 2, "Definir conteúdo das abas", "proj-demo-1"]
    );
    await db.execute(
      `INSERT INTO weekly_priorities (id, week_start, position, title, project_id, done, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         week_start=excluded.week_start, position=excluded.position, title=excluded.title,
         project_id=excluded.project_id, done=excluded.done, updated_at=datetime('now')`,
      ["prio-3", currentWeek, 3, "Avançar no estudo de idiomas", null]
    );

    // Timeline and notes
    const currentYear = new Date().getFullYear();
    const planItems = [
      ["plan-demo-1", "Inglês avançado", "Idiomas", currentYear, 1, currentYear + 1, 2, "Em andamento", "#28d7f0", 0],
      ["plan-demo-2", "Especialização em IA", "Especializações", currentYear, 2, currentYear + 1, 2, "Planejado", "#f5a716", 0],
      ["plan-demo-3", "Portfólio desktop", "Projetos", currentYear, 1, currentYear, 2, "Em andamento", "#42c789", 0],
      ["plan-demo-4", "Certificação de dados", "Certificados", currentYear + 1, 1, currentYear + 1, 2, "Planejado", "#a855f7", 0],
    ] as const;
    for (const item of planItems) {
      await db.execute(
        `INSERT INTO plan_items (id, title, category, start_year, start_semester, end_year, end_semester, status, color, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, category=excluded.category, start_year=excluded.start_year,
           start_semester=excluded.start_semester, end_year=excluded.end_year, end_semester=excluded.end_semester,
           status=excluded.status, color=excluded.color, updated_at=datetime('now')`,
        [...item],
      );
    }

    const planNotes = [
      ["note-demo-1", "Consolidar o portfólio", "current_priority", 0],
      ["note-demo-2", "Curso de arquitetura de software", "future_course", 0],
      ["note-demo-3", "Automação pessoal local", "suggested_project", 0],
    ] as const;
    for (const note of planNotes) {
      await db.execute(
        `INSERT INTO plan_notes (id, title, group_name, sort_order, archived, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 0, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, group_name=excluded.group_name,
           sort_order=excluded.sort_order, archived=0, updated_at=datetime('now')`,
        [...note],
      );
    }

    // 2 Courses
    await db.execute(
      `INSERT INTO courses (id, institution, title, category, status, priority, started_on, completed_on, archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET institution=excluded.institution, title=excluded.title, category=excluded.category,
         status=excluded.status, priority=excluded.priority, started_on=excluded.started_on,
         completed_on=excluded.completed_on, archived=0, updated_at=datetime('now')`,
      ["course-1", "Escola Fictícia", "Formação Tech", "Desenvolvimento", "Concluído", "Baixa", "2025-01-10", "2025-06-20"]
    );
    await db.execute(
      `INSERT INTO courses (id, institution, title, category, status, priority, started_on, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET institution=excluded.institution, title=excluded.title, category=excluded.category,
         status=excluded.status, priority=excluded.priority, started_on=excluded.started_on,
         archived=0, updated_at=datetime('now')`,
      ["course-2", "Plataforma X", "Masterclass Frontend", "Desenvolvimento", "Em andamento", "Alta", "2026-07-01"]
    );

    // 2 Credentials
    await db.execute(
      `INSERT INTO credentials (id, course_id, kind, title, issuer, issued_on, stored_path, original_name, mime_type, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, stored_path=excluded.stored_path, updated_at=datetime('now')`,
      ["cred-1", "course-1", "certificate", "Certificado Exemplo", "Escola Fictícia", "2025-06-20", "data/demo/cert1.pdf", "exemplo_cert.pdf", "application/pdf"]
    );
    await db.execute(
      `INSERT INTO credentials (id, course_id, kind, title, issuer, issued_on, stored_path, original_name, mime_type, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, stored_path=excluded.stored_path, updated_at=datetime('now')`,
      ["cred-2", null, "diploma", "MBA Exemplo", "Universidade Y", "2023-12-10", "data/demo/mba.pdf", "exemplo_diploma.pdf", "application/pdf"]
    );

    // 3 Shortcuts
    await db.execute(
      `INSERT INTO shortcuts (id, label, target_type, path, category, favorite, sort_order, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 1, 1, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET label=excluded.label, path=excluded.path, updated_at=datetime('now')`,
      ["short-1", "Pasta Pessoal Fictícia", "folder", "C:\\Demo\\LaneB", "Lane B"]
    );
    await db.execute(
      `INSERT INTO shortcuts (id, label, target_type, path, category, favorite, sort_order, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 1, 2, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET label=excluded.label, path=excluded.path, updated_at=datetime('now')`,
      ["short-2", "Pasta Profissional Fictícia", "folder", "C:\\Demo\\LaneA", "Lane A"]
    );
    await db.execute(
      `INSERT INTO shortcuts (id, label, target_type, path, category, favorite, sort_order, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, 3, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET label=excluded.label, path=excluded.path, updated_at=datetime('now')`,
      ["short-3", "Anotações Reunião", "file", "C:\\Demo\\Documentos\\reuniao.md", "Geral"]
    );

    await db.execute('COMMIT');
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
}

export async function clearDemoSeed(db: Database): Promise<DemoCleanupResult> {
  return withTransaction(db, async () => {
    await db.execute(
      `UPDATE focus_slots SET project_id = NULL, updated_at = $1
       WHERE project_id IN ('proj-demo-1', 'proj-demo-2')`,
      [new Date().toISOString()],
    );
    const priorities = await db.execute(
      `DELETE FROM weekly_priorities
       WHERE id IN ('prio-1', 'prio-2', 'prio-3')`,
    );
    const credentials = await db.execute(
      `DELETE FROM credentials WHERE id IN ('cred-1', 'cred-2')`,
    );
    const planItems = await db.execute(
      `DELETE FROM plan_items WHERE id IN ('plan-demo-1', 'plan-demo-2', 'plan-demo-3', 'plan-demo-4')`,
    );
    const planNotes = await db.execute(
      `DELETE FROM plan_notes WHERE id IN ('note-demo-1', 'note-demo-2', 'note-demo-3')`,
    );
    const projects = await db.execute(
      `DELETE FROM projects WHERE id IN ('proj-demo-1', 'proj-demo-2')`,
    );
    const courses = await db.execute(
      `DELETE FROM courses WHERE id IN ('course-1', 'course-2')`,
    );
    const shortcuts = await db.execute(
      `DELETE FROM shortcuts WHERE id IN ('short-1', 'short-2', 'short-3')`,
    );
    return {
      removedProjects: projects.rowsAffected,
      removedCourses: courses.rowsAffected,
      removedCredentials: credentials.rowsAffected,
      removedShortcuts: shortcuts.rowsAffected,
      removedPriorities: priorities.rowsAffected,
      removedPlanItems: planItems.rowsAffected,
      removedPlanNotes: planNotes.rowsAffected,
    };
  });
}

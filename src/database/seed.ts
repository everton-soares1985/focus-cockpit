import Database from '@tauri-apps/plugin-sql';

export async function runDemoSeed(db: Database) {
  try {
    await db.execute('BEGIN TRANSACTION');

    // 2 Projects
    await db.execute(
      `INSERT INTO projects (id, name, lane, area, status, priority, next_action, folder_path, notes, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET 
         name=excluded.name, lane=excluded.lane, area=excluded.area, status=excluded.status, 
         priority=excluded.priority, next_action=excluded.next_action, folder_path=excluded.folder_path, 
         notes=excluded.notes, updated_at=datetime('now')`,
      ["proj-demo-1", "App Desktop Fictício", "B", "Portfólio", "Ativo", "Alta", "Finalizar Fase 0", "C:\\Demo\\LaneB\\Projeto1", "Rust + React"]
    );

    await db.execute(
      `INSERT INTO projects (id, name, lane, area, status, priority, next_action, folder_path, notes, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET 
         name=excluded.name, lane=excluded.lane, area=excluded.area, status=excluded.status, 
         priority=excluded.priority, next_action=excluded.next_action, folder_path=excluded.folder_path, 
         notes=excluded.notes, updated_at=datetime('now')`,
      ["proj-demo-2", "Automação Script Genérica", "A", "Marketing", "Ativo", "Média", "Revisar código", "C:\\Demo\\LaneA\\Projeto2", "Usar LangChain"]
    );
    
    // 2 Focus Slots
    await db.execute("INSERT INTO focus_slots (lane, project_id, updated_at) VALUES ('A', 'proj-demo-2', datetime('now')) ON CONFLICT(lane) DO UPDATE SET project_id=excluded.project_id, updated_at=datetime('now')");
    await db.execute("INSERT INTO focus_slots (lane, project_id, updated_at) VALUES ('B', 'proj-demo-1', datetime('now')) ON CONFLICT(lane) DO UPDATE SET project_id=excluded.project_id, updated_at=datetime('now')");

    // 3 Priorities
    await db.execute(
      `INSERT INTO weekly_priorities (id, week_start, position, title, project_id, done, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, project_id=excluded.project_id, updated_at=datetime('now')`,
      ["prio-1", "2026-07-13", 1, "Concluir Setup Inicial", "proj-demo-1"]
    );
    await db.execute(
      `INSERT INTO weekly_priorities (id, week_start, position, title, project_id, done, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, project_id=excluded.project_id, updated_at=datetime('now')`,
      ["prio-2", "2026-07-13", 2, "Testar Funcionalidade", "proj-demo-2"]
    );
    await db.execute(
      `INSERT INTO weekly_priorities (id, week_start, position, title, project_id, done, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET title=excluded.title, project_id=excluded.project_id, updated_at=datetime('now')`,
      ["prio-3", "2026-07-13", 3, "Treino Idiomas", null]
    );

    // 2 Courses
    await db.execute(
      `INSERT INTO courses (id, institution, title, category, status, priority, started_on, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET institution=excluded.institution, title=excluded.title, status=excluded.status, updated_at=datetime('now')`,
      ["course-1", "Escola Fictícia", "Formação Tech", "Dev", "Concluído", "Baixa", "2025-01-10"]
    );
    await db.execute(
      `INSERT INTO courses (id, institution, title, category, status, priority, started_on, archived, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET institution=excluded.institution, title=excluded.title, status=excluded.status, updated_at=datetime('now')`,
      ["course-2", "Plataforma X", "Masterclass Frontend", "Dev", "Em andamento", "Alta", "2026-07-01"]
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
    console.log("Demo dataset seeded successfully!");
  } catch (error) {
    await db.execute('ROLLBACK');
    console.error("Failed to seed demo data:", error);
    throw error; // Don't hide the error
  }
}

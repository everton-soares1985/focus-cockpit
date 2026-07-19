use rusqlite::{params, Connection, ErrorCode};

const INITIAL_MIGRATION: &str = include_str!("../../migrations/01_initial.sql");
const DOMAIN_RULES_MIGRATION: &str = include_str!("../../migrations/02_domain_rules.sql");

fn migrated_database() -> Connection {
    let connection = Connection::open_in_memory().expect("open in-memory sqlite");
    connection
        .execute_batch(INITIAL_MIGRATION)
        .expect("apply initial migration");
    connection
        .execute_batch(DOMAIN_RULES_MIGRATION)
        .expect("apply domain migration");
    connection
}

fn insert_project(connection: &Connection, id: &str, lane: &str) {
    connection
        .execute(
            "INSERT INTO projects (
                id, name, lane, status, archived, created_at, updated_at
             ) VALUES (?1, ?2, ?3, 'Ativo', 0, datetime('now'), datetime('now'))",
            params![id, format!("Project {id}"), lane],
        )
        .expect("insert project");
}

#[test]
fn migrations_create_expected_schema_and_empty_focus_slots() {
    let connection = migrated_database();
    let table_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master
             WHERE type = 'table'
               AND name IN (
                 'projects', 'focus_slots', 'weekly_priorities', 'plan_items',
                 'plan_notes', 'courses', 'credentials', 'shortcuts'
               )",
            [],
            |row| row.get(0),
        )
        .expect("count tables");
    let slot_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM focus_slots", [], |row| row.get(0))
        .expect("count focus slots");

    assert_eq!(table_count, 8);
    assert_eq!(slot_count, 2);
}

#[test]
fn domain_migration_preserves_existing_rows() {
    let connection = Connection::open_in_memory().expect("open in-memory sqlite");
    connection
        .execute_batch(INITIAL_MIGRATION)
        .expect("apply initial migration");
    insert_project(&connection, "existing-project", "A");

    connection
        .execute_batch(DOMAIN_RULES_MIGRATION)
        .expect("apply domain migration");

    let project_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM projects WHERE id = 'existing-project'",
            [],
            |row| row.get(0),
        )
        .expect("count existing project");
    assert_eq!(project_count, 1);
}

#[test]
fn focus_slot_rejects_project_from_the_wrong_lane() {
    let connection = migrated_database();
    insert_project(&connection, "project-b", "B");

    let error = connection
        .execute(
            "UPDATE focus_slots SET project_id = 'project-b' WHERE lane = 'A'",
            [],
        )
        .expect_err("lane mismatch must fail");

    assert_eq!(
        error.sqlite_error_code(),
        Some(ErrorCode::ConstraintViolation)
    );
}

#[test]
fn focus_slot_is_cleared_when_project_is_archived() {
    let connection = migrated_database();
    insert_project(&connection, "project-a", "A");
    connection
        .execute(
            "UPDATE focus_slots SET project_id = 'project-a' WHERE lane = 'A'",
            [],
        )
        .expect("set focus");

    connection
        .execute(
            "UPDATE projects SET archived = 1 WHERE id = 'project-a'",
            [],
        )
        .expect("archive project");

    let focus: Option<String> = connection
        .query_row(
            "SELECT project_id FROM focus_slots WHERE lane = 'A'",
            [],
            |row| row.get(0),
        )
        .expect("read focus");
    assert_eq!(focus, None);
}

#[test]
fn plan_period_rejects_an_end_before_the_start() {
    let connection = migrated_database();
    let error = connection
        .execute(
            "INSERT INTO plan_items (
                id, title, category, start_year, start_semester,
                end_year, end_semester, status, created_at, updated_at
             ) VALUES (
                'invalid-plan', 'Invalid', 'Cursos', 2027, 2,
                2027, 1, 'Planejado', datetime('now'), datetime('now')
             )",
            [],
        )
        .expect_err("invalid period must fail");

    assert_eq!(
        error.sqlite_error_code(),
        Some(ErrorCode::ConstraintViolation)
    );
}

#[test]
fn weekly_priority_position_is_unique_inside_a_week() {
    let connection = migrated_database();
    connection
        .execute(
            "INSERT INTO weekly_priorities (
                id, week_start, position, title, created_at, updated_at
             ) VALUES ('priority-1', '2026-07-13', 1, 'First', datetime('now'), datetime('now'))",
            [],
        )
        .expect("insert first priority");

    let error = connection
        .execute(
            "INSERT INTO weekly_priorities (
                id, week_start, position, title, created_at, updated_at
             ) VALUES ('priority-2', '2026-07-13', 1, 'Duplicate', datetime('now'), datetime('now'))",
            [],
        )
        .expect_err("duplicate position must fail");

    assert_eq!(
        error.sqlite_error_code(),
        Some(ErrorCode::ConstraintViolation)
    );
}

#[test]
fn archiving_a_course_keeps_its_credential() {
    let connection = migrated_database();
    connection
        .execute(
            "INSERT INTO courses (
                id, title, status, archived, created_at, updated_at
             ) VALUES ('course-1', 'Course', 'Concluído', 0, datetime('now'), datetime('now'))",
            [],
        )
        .expect("insert course");
    connection
        .execute(
            "INSERT INTO credentials (
                id, course_id, kind, title, stored_path, original_name,
                mime_type, created_at, updated_at
             ) VALUES (
                'credential-1', 'course-1', 'certificate', 'Certificate',
                'internal/demo.pdf', 'demo.pdf', 'application/pdf',
                datetime('now'), datetime('now')
             )",
            [],
        )
        .expect("insert credential");

    connection
        .execute("UPDATE courses SET archived = 1 WHERE id = 'course-1'", [])
        .expect("archive course");

    let credential_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM credentials", [], |row| row.get(0))
        .expect("count credentials");
    assert_eq!(credential_count, 1);
}

#[test]
fn sqlite_accepts_a_bound_vacuum_destination() {
    let connection = migrated_database();
    let destination = std::env::temp_dir().join(format!(
        "focus-cockpit-vacuum-{}.sqlite3",
        std::process::id()
    ));
    let _ = std::fs::remove_file(&destination);

    connection
        .execute("VACUUM INTO ?1", params![destination.to_string_lossy()])
        .expect("create consistent snapshot");

    let snapshot = Connection::open(&destination).expect("open snapshot");
    let table_count: i64 = snapshot
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table'",
            [],
            |row| row.get(0),
        )
        .expect("count snapshot tables");
    assert!(table_count >= 8);
    drop(snapshot);
    let _ = std::fs::remove_file(destination);
}

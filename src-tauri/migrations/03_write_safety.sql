-- 03_write_safety.sql
-- Keep cross-table invariants inside SQLite so each frontend write remains atomic.

CREATE TRIGGER validate_weekly_priority_project_before_insert
BEFORE INSERT ON weekly_priorities
WHEN NEW.project_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM projects
            WHERE id = NEW.project_id
              AND archived = 0
        )
        THEN RAISE(ABORT, 'weekly_priority_project_unavailable')
    END;
END;

CREATE TRIGGER validate_weekly_priority_project_before_update
BEFORE UPDATE OF project_id ON weekly_priorities
WHEN NEW.project_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM projects
            WHERE id = NEW.project_id
              AND archived = 0
        )
        THEN RAISE(ABORT, 'weekly_priority_project_unavailable')
    END;
END;

CREATE TRIGGER clear_focus_before_project_delete
BEFORE DELETE ON projects
BEGIN
    UPDATE focus_slots
    SET project_id = NULL, updated_at = datetime('now')
    WHERE project_id = OLD.id;
END;

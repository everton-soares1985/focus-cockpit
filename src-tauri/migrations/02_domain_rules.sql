-- 02_domain_rules.sql
-- Enforce invariants that span more than one column or table.

INSERT INTO focus_slots (lane, project_id, updated_at)
VALUES ('A', NULL, datetime('now'))
ON CONFLICT(lane) DO NOTHING;

INSERT INTO focus_slots (lane, project_id, updated_at)
VALUES ('B', NULL, datetime('now'))
ON CONFLICT(lane) DO NOTHING;

CREATE TRIGGER validate_focus_lane_before_insert
BEFORE INSERT ON focus_slots
WHEN NEW.project_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM projects
            WHERE id = NEW.project_id
              AND lane = NEW.lane
              AND archived = 0
        )
        THEN RAISE(ABORT, 'focus_project_lane_mismatch')
    END;
END;

CREATE TRIGGER validate_focus_lane_before_update
BEFORE UPDATE OF lane, project_id ON focus_slots
WHEN NEW.project_id IS NOT NULL
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM projects
            WHERE id = NEW.project_id
              AND lane = NEW.lane
              AND archived = 0
        )
        THEN RAISE(ABORT, 'focus_project_lane_mismatch')
    END;
END;

CREATE TRIGGER prevent_focused_project_lane_change
BEFORE UPDATE OF lane ON projects
WHEN EXISTS (
    SELECT 1 FROM focus_slots
    WHERE project_id = OLD.id AND lane <> NEW.lane
)
BEGIN
    SELECT RAISE(ABORT, 'focused_project_lane_change');
END;

CREATE TRIGGER clear_focus_when_project_archived
AFTER UPDATE OF archived ON projects
WHEN NEW.archived = 1 AND OLD.archived = 0
BEGIN
    UPDATE focus_slots
    SET project_id = NULL, updated_at = datetime('now')
    WHERE project_id = NEW.id;
END;

CREATE TRIGGER validate_plan_period_before_insert
BEFORE INSERT ON plan_items
WHEN (NEW.end_year * 2 + NEW.end_semester) <
     (NEW.start_year * 2 + NEW.start_semester)
BEGIN
    SELECT RAISE(ABORT, 'plan_end_before_start');
END;

CREATE TRIGGER validate_plan_period_before_update
BEFORE UPDATE OF start_year, start_semester, end_year, end_semester ON plan_items
WHEN (NEW.end_year * 2 + NEW.end_semester) <
     (NEW.start_year * 2 + NEW.start_semester)
BEGIN
    SELECT RAISE(ABORT, 'plan_end_before_start');
END;

CREATE TRIGGER validate_plan_note_group_before_insert
BEFORE INSERT ON plan_notes
WHEN NEW.group_name NOT IN ('current_priority', 'future_course', 'suggested_project')
BEGIN
    SELECT RAISE(ABORT, 'invalid_plan_note_group');
END;

CREATE TRIGGER validate_plan_note_group_before_update
BEFORE UPDATE OF group_name ON plan_notes
WHEN NEW.group_name NOT IN ('current_priority', 'future_course', 'suggested_project')
BEGIN
    SELECT RAISE(ABORT, 'invalid_plan_note_group');
END;

CREATE INDEX projects_lane_archived_idx ON projects (lane, archived);
CREATE INDEX projects_status_archived_idx ON projects (status, archived);
CREATE INDEX weekly_priorities_week_idx ON weekly_priorities (week_start, position);
CREATE INDEX plan_items_period_idx ON plan_items (start_year, start_semester, sort_order);
CREATE INDEX courses_status_archived_idx ON courses (status, archived);
CREATE INDEX shortcuts_favorite_archived_idx ON shortcuts (favorite, archived, sort_order);

-- 01_initial.sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lane TEXT NOT NULL CHECK (lane IN ('A', 'B')),
    area TEXT,
    status TEXT NOT NULL,
    priority TEXT,
    next_action TEXT,
    last_progress TEXT,
    folder_path TEXT,
    notes TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE focus_slots (
    lane TEXT PRIMARY KEY CHECK (lane IN ('A', 'B')),
    project_id TEXT UNIQUE,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE weekly_priorities (
    id TEXT PRIMARY KEY,
    week_start TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
    title TEXT NOT NULL,
    project_id TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (week_start, position),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE plan_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    start_year INTEGER NOT NULL,
    start_semester INTEGER NOT NULL CHECK (start_semester IN (1, 2)),
    end_year INTEGER NOT NULL,
    end_semester INTEGER NOT NULL CHECK (end_semester IN (1, 2)),
    status TEXT NOT NULL,
    color TEXT,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE plan_notes (
    id TEXT PRIMARY KEY,
    group_name TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    institution TEXT,
    title TEXT NOT NULL,
    category TEXT,
    status TEXT NOT NULL,
    priority TEXT,
    started_on TEXT,
    completed_on TEXT,
    notes TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE credentials (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    issuer TEXT,
    issued_on TEXT,
    stored_path TEXT NOT NULL,
    thumbnail_path TEXT,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE TABLE shortcuts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('file', 'folder')),
    path TEXT NOT NULL,
    category TEXT,
    notes TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

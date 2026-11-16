CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL UNIQUE CHECK (
    entry_date = date(entry_date)
  ),
  summary TEXT NOT NULL DEFAULT '' CHECK (length(summary) <= 180),
  content_md TEXT NOT NULL DEFAULT '' CHECK (length(content_md) <= 100000),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_journal_entries_date ON journal_entries(entry_date);

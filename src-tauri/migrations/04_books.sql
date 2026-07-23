CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 180),
  author TEXT CHECK (author IS NULL OR length(author) <= 160),
  status TEXT NOT NULL CHECK (
    status IN ('Quero ler', 'Lendo', 'Concluído', 'Pausado', 'Abandonado')
  ),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (
    progress_percent BETWEEN 0 AND 100
  ),
  current_page INTEGER CHECK (current_page IS NULL OR current_page >= 0),
  total_pages INTEGER CHECK (total_pages IS NULL OR total_pages > 0),
  started_on TEXT,
  completed_on TEXT,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 5000),
  file_path TEXT CHECK (file_path IS NULL OR length(file_path) <= 2048),
  link TEXT CHECK (link IS NULL OR length(link) <= 2048),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    current_page IS NULL
    OR total_pages IS NULL
    OR current_page <= total_pages
  ),
  CHECK (
    started_on IS NULL
    OR completed_on IS NULL
    OR completed_on >= started_on
  )
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_title ON books(title COLLATE NOCASE);

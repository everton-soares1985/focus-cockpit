# Focus Cockpit

**Focus Cockpit** is a local-first, offline-by-default desktop application designed for Windows to replace spreadsheet-based career, project, course, and file management. 

This is a personal portfolio and organizational tool designed under the **Lane B** concept (personal/portfolio side projects), kept completely separate from the core **Lane A** operations.

## Status

**Currently in Phase 0 (Foundation).**
The complete product is still under development. At this stage, the project has established its secure desktop foundation, database architecture, and strict security rules.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite, Vitest
- **Backend**: Tauri 2 (Rust)
- **Database**: SQLite (Local, WAL mode) via Tauri SQL Plugin

## Privacy & Security
- **100% Offline**: No remote servers, no cloud sync, no tracking.
- **Local Database**: All data is strictly kept locally in the application's data directory.
- **Security First**: Strict Content Security Policy (CSP), minimized capabilities, and isolated IPC.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run frontend checks and tests
pnpm lint
pnpm test

# Build frontend only
pnpm build

# Run desktop app locally in development mode
pnpm tauri dev

# Build the final Windows installer (.msi / .exe)
pnpm tauri build
```

## Roadmap

The application is structured into the following core screens:
- [ ] **Foco**: Daily/weekly priorities and dashboard.
- [ ] **Plano**: Long-term career planning.
- [ ] **Projetos**: Lane A & Lane B active projects tracking.
- [ ] **Cursos**: Course and learning management.
- [ ] **Diplomas**: Certificates and PDF credential storage.
- [ ] **Arquivos**: Quick shortcuts to local folders and files.

---
*Created by Everton Soares.*

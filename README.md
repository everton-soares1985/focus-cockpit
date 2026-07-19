# Focus Cockpit

Focus Cockpit is a local-first Windows desktop application for answering a small set of practical questions: what deserves attention now, what comes next, what is planned for the future, and where important projects, courses, credentials, and files are located.

It is a personal productivity tool and a public portfolio project. The product replaces a collection of evolving spreadsheets without becoming a generic task manager, cloud platform, or AI assistant.

> The interface is written in Brazilian Portuguese. The repository documentation is in English for portfolio accessibility.

## Development status

The native foundation and domain layer are implemented. The final visual interface is currently being integrated on top of the stable contracts.

- Local SQLite schema and versioned migrations
- Lane A / Lane B focus selection
- Three weekly priorities
- Projects, career plan, courses, credentials, and file shortcuts
- Safe native file opening and credential import/export
- Consistent backup and guarded restore
- Demonstration dataset with targeted cleanup
- Unit, repository, migration, and invariant tests
- Windows NSIS installer configuration

No production release has been published yet.

## Product boundaries

Focus Cockpit is intentionally small:

- no login, subscription, analytics, or telemetry;
- no cloud synchronization or runtime API calls;
- no disk scanning or automatic file indexing;
- no arbitrary shell execution;
- no automatic moving, renaming, or deletion of personal files;
- no general-purpose task manager, Kanban, chat, or AI agent.

The application stores only paths manually selected by the user. Diplomas and certificates are copied only after an explicit import action; the original files are never modified.

## Screens

| Screen | Purpose |
| --- | --- |
| Foco | One active project per Lane, three weekly priorities, and favorite shortcuts |
| Plano | A semester-based career timeline inspired by an evolved spreadsheet |
| Projetos | Searchable project table with Lane, status, priority, and next action |
| Cursos | Course planning and completion records linked to credentials |
| Diplomas | Local gallery for imported PDFs and images |
| Arquivos | Manual locator for safe file and folder shortcuts |

## Architecture

```text
React screens
  ├─ feature hooks (TanStack Query)
  ├─ Zod domain schemas
  └─ typed SQLite repositories
           │
           ▼
     painel.sqlite3

Frontend platform adapters
           │ narrow IPC commands
           ▼
Tauri / Rust
  ├─ validated file opening
  ├─ private credential storage
  └─ verified backup and restore
```

The code is organized by feature. There are no generic `utils`, `helpers`, or `common` folders, and the frontend cannot send arbitrary commands to the operating system.

## Technology

- Tauri 2 and Rust
- React 19 and TypeScript
- Vite and Tailwind CSS 4
- TanStack Query and React Hook Form
- Zod
- SQLite through the Tauri SQL plugin
- Vitest and Testing Library

## Privacy and local storage

Real user data is stored in the operating system's private application configuration directory, outside the Git repository:

```text
Focus Cockpit application directory
├── painel.sqlite3
├── credentials/
├── thumbnails/
└── backups/
```

The public repository contains source code, migrations, tests, and fictional demonstration metadata only. Database files, imported documents, backups, build output, and local paths are ignored by Git.

Credential imports accept PDF, PNG, JPG/JPEG, and WebP up to 25 MB. The Rust layer checks extension, detected content type, size, canonical path, and storage boundary. File shortcuts reject executable or script extensions before opening.

Backups contain a consistent SQLite snapshot, imported credentials, thumbnails, a schema version, sizes, and SHA-256 hashes. Restore validates the archive and creates an automatic safety backup before replacing local state.

## Development

Requirements:

- Windows 10 or newer
- Node.js 22.19 or newer
- pnpm 11.14
- Rust stable with the MinGW target on Windows
- WebView2

Install and run:

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
```

Quality gates:

```powershell
pnpm check

Set-Location src-tauri
cargo fmt --check
cargo clippy --locked -- -D warnings

Set-Location migration-tests
cargo test --locked
```

Build the per-user Windows installer:

```powershell
pnpm build:windows
```

The NSIS setup executable is generated under `src-tauri/target/release/bundle/nsis/` and does not require administrator privileges for the default installation mode.

## Repository safety

Before publishing a change:

1. Run every quality gate.
2. Confirm no real database, credential, backup, or local path is staged.
3. Use only fictional content in screenshots and demonstration records.
4. Review native capability changes separately from visual changes.

## License

[MIT](LICENSE) © 2026 Everton Soares.

# Focus Cockpit 0.1 — Release Candidate Walkthrough

This document records the verified state of the first complete desktop candidate. It replaces the earlier Phase 0 report, which described only the project foundation.

## Delivered product

- **Foco:** one selected project per Lane, last progress, next action, three weekly priorities, and favorite shortcuts.
- **Plano:** semester timeline with overlap-aware tracks plus editable priority, course, and suggested-project notes.
- **Projetos:** searchable table with Lane, area, status, priority, next action, last progress, folder state, focus selection, and archive controls.
- **Cursos:** searchable course repository with status, dates, priority, and credential relationship.
- **Diplomas:** local PDF/image gallery with secure import, preview, export, metadata editing, and course association.
- **Arquivos:** manual file/folder locator with categories, favorites, path copying, relocation, native availability checks, and safe opening.
- **Backup:** consistent `.focusbackup` creation, integrity inspection, guarded restore, and automatic pre-restore safety copy.
- **Onboarding:** fictional demonstration data or an empty private database, without cloud services or telemetry.

## Integration corrections

The visual implementation was reviewed against the native and domain contracts before integration. The release candidate includes the following corrections:

- restored strict ESLint rules instead of suppressing explicit `any` and state-effect findings;
- replaced browser `alert`/`confirm` flows with accessible inline feedback and confirmation dialogs;
- added keyboard trapping, Escape handling, labelled dialogs, and focus restoration;
- exposed the project area and last-progress fields throughout the interface;
- prevented overlapping timeline items from occupying the same visual track;
- added real native path inspection and disabled unsafe or missing file actions;
- restricted backup files to the `.focusbackup` workflow and allowed credential blob previews in the CSP;
- granted the explicit `sql:allow-execute` desktop capability required for local writes. This was discovered only by opening the packaged executable; a successful compilation alone did not reveal it.

## Verification performed

- `pnpm lint`
- `pnpm test`: 15 test files and 30 tests passing
- `pnpm build`
- `cargo fmt --check`
- `cargo clippy -- -D warnings`
- security-policy crate: 5 tests passing
- migration test crate: 8 tests passing
- `pnpm build:windows`: NSIS installer produced successfully
- packaged `focus-cockpit.exe` launched with the production ACL and existing SQLite data
- all six screens visually inspected at the configured 1280×800 window size
- a project created through the packaged UI and confirmed in SQLite, then removed after QA
- privacy scan performed for personal paths, credentials, secrets, and unrelated repository names

## Visual evidence

The versioned screenshots in [`docs/screenshots`](docs/screenshots) were captured from the packaged Windows application with fictional records. They are suitable for the public portfolio repository.

## Known non-blocking note

The production JavaScript bundle currently triggers Vite's advisory warning for chunks larger than 500 kB. This does not affect desktop operation. Route-level code splitting is an optimization for a later release, not a correctness requirement for 0.1.

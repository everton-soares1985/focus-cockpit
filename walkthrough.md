# Phase 0 — Calibration Walkthrough

This document outlines the final calibration executed for Phase 0, setting a rock-solid foundation for the upcoming features. **Note that the product itself is not ready yet**; this phase focuses exclusively on structure, security, tooling, and database preparation.

## Completed Calibration Tasks

- `[x]` **1 & 2:** Fixed `.gitignore` encoding (UTF-8). Verified that `painel.sqlite3`, `data/local`, `credentials`, `thumbnails`, and `backups` are properly ignored by Git using `git check-ignore`.
- `[x]` **3:** Removed `vs_buildtools.exe` from the project directory.
- `[x]` **4 & 5:** Expanded the `seed.ts` demo script to strictly fulfill the prompt requirements (2 projects, 2 focus slots, 3 priorities, 2 courses, 2 credentials, 3 shortcuts). The script is fully transactional (`BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`) and idempotent (`INSERT OR REPLACE`). Errors are explicitly thrown and not hidden.
- `[x]` **6:** Wrote real frontend integration tests for the onboarding flow (`AppShell.test.tsx`) and the database seeding logic (`seed.test.ts`), validating UI state and database transaction calls.
- `[x]` **7:** Configured a strict, real ESLint configuration (`eslint.config.js`) instead of using `tsc --noEmit`. The `pnpm lint` script now leverages ESLint correctly.
- `[x]` **8:** Restricted Tauri capabilities in `default.json` and implemented a robust local Content Security Policy (CSP) in `tauri.conf.json`.
- `[x]` **9:** Stopped mutating global computer configurations. Created `rust-toolchain.toml` to enforce the `stable-x86_64-pc-windows-gnu` compiler locally for this project only.
- `[x]` **10:** Created this report clarifying that Phase 0 is purely structural preparation.

---

## Output Validation (Passed)

**Lint (`pnpm lint`):**
```bash
> focus-cockpit@0.1.0 lint
> eslint .
```
*(No issues found)*

**Tests (`pnpm test`):**
```bash
> focus-cockpit@0.1.0 test
> vitest run

 ✓ src/database/seed.test.ts (2 tests)
 ✓ src/shell/AppHeader.test.tsx (1 test)
 ✓ src/shell/AppShell.test.tsx (2 tests)

 Test Files  3 passed (3)
      Tests  5 passed (5)
```

**Build (`pnpm build`):**
```bash
> focus-cockpit@0.1.0 build
> tsc && vite build

vite v7.3.6 building client environment for production...
✓ 98 modules transformed.
dist/index.html                   0.49 kB
dist/assets/index-DeryD4D6.css    9.79 kB
dist/assets/index-t023zqQv.js   328.82 kB
✓ built in 1.81s
```

**Cargo Check & Clippy:**
```bash
cargo fmt --check
cargo clippy -- -D warnings
```
*(No warnings generated)*

**Tauri Native Build (`pnpm tauri build`):**
```bash
$ tauri "build"
     Running beforeBuildCommand `pnpm build`
✓ 98 modules transformed.
dist/index.html                   0.49 kB
dist/assets/index-DeryD4D6.css    9.79 kB
dist/assets/index-t023zqQv.js   328.82 kB
   Compiling focus-cockpit v0.1.0 (C:\PROGRAMACAO\focus-cockpit\src-tauri)
    Finished `release` profile [optimized] target(s) in 47.82s
       Built application at: C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\focus-cockpit.exe
        Info Patching C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\focus-cockpit.exe with bundle type information: msi
        Info Target: x64
     Running candle for "C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\wix\x64\main.wxs"
     Running light to produce C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\bundle\msi\focus-cockpit_0.1.0_x64_en-US.msi
        Info Patching C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\focus-cockpit.exe with bundle type information: nsis
        Info Target: x64
     Running makensis to produce C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\bundle\nsis\focus-cockpit_0.1.0_x64-setup.exe
    Finished 2 bundles at:
        C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\bundle\msi\focus-cockpit_0.1.0_x64_en-US.msi
        C:\PROGRAMACAO\focus-cockpit\src-tauri\target\release\bundle\nsis\focus-cockpit_0.1.0_x64-setup.exe
```

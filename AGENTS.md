# Electron Desktop App Guide (Post-Port Baseline)

## Current Product State
This project baseline is now Electron-first for desktop practice workflows.

Implemented desktop branch:
- Branch: `feat/electron-42-port`
- Commit: `7b6799a`
- Report: `features/electron-port-report.md`

Core workflow preserved:
- local import
- tempo/pitch control
- A/B loops
- markers
- shortcuts
- per-song project restore

## Runtime and Architecture
1. Process split
- `main`: `app/electron/main.ts`
- `preload`: `app/electron/preload.ts`
- `renderer`: existing Vue/Pinia app in `app/src`

2. Security defaults
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- deny `window.open`
- deny-by-default permission requests
- IPC allowlist only

3. Renderer API contract
Exposed namespace:
- `window.desktopApi`

Methods:
- `pickFolder()`
- `refreshFolder(folderId)`
- `readTrack(folderId, relativePath)`

Response envelope:
- `{ ok: true, data }`
- `{ ok: false, code, message }`

## Data Contracts
1. Library source types
- `'desktop-directory' | 'webkitdirectory'`

2. Snapshot model
- Persist `folderId` token (not browser directory handles)
- Legacy snapshot migration handled in repository layer

3. Audio engine
- Supports file + byte-buffer loading (`loadFile`, `loadArrayBuffer`)

## Build and Run
From `app/`:
- Web dev: `npm run dev`
- Web build: `npm run build`
- Desktop dev: `npm run dev:desktop`
- Desktop build: `npm run build:desktop`
- Desktop dist: `npm run dist:desktop`
- Tests: `npm run test`

Important runtime prerequisite:
- `ELECTRON_RUN_AS_NODE` must be unset when running Electron UI.

Direct desktop launch example:
```bash
env -u ELECTRON_RUN_AS_NODE ./node_modules/electron/dist/electron .
```

## Dependency and License Policy
Allowed licenses:
- MIT
- BSD
- Apache-2.0
- LGPL

v1 runtime exclusion:
- GPL-only dependencies

Status:
- Policy defined
- CI enforcement and notices generation still pending implementation

## Pending Work (Next Milestones)
1. Compliance automation
- add CI license gate (allowlist + GPL denylist)
- generate `THIRD_PARTY_NOTICES.md`

2. Desktop QA hardening
- cross-platform packaging smoke (Win/macOS/Linux)
- long-file memory behavior checks
- folder move/unmount recovery scenarios

3. Release operations
- document signing/notarization pipeline
- keep auto-update deferred until signing path is stable

## Historical Context
The pre-port browser-only plan has been superseded by this Electron baseline.
Reference document retained at:
- `features/electron-port.md`
- `features/electron-port-report.md`

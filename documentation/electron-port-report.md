# Electron Port Report (Completed)

## Scope
Port Vue/Vite web app to Electron desktop app with secure process separation, IPC-backed folder library import, and preserved practice workflow (tempo/pitch, loops, markers, per-track project restore).

## Delivery Metadata
- Port branch: `feat/electron-42-port`
- Port commit: `7b6799a`
- Remote: `origin` (`https://github.com/marccdb/app-music-tweaker.git`)
- PR URL: `https://github.com/marccdb/app-music-tweaker/pull/new/feat/electron-42-port`
- Electron version: `42.3.0` (pinned)

## Implemented Changes
1. Electron runtime and security model
- Added Electron `main` process entrypoint: `app/electron/main.ts`
- Added Electron `preload` bridge: `app/electron/preload.ts`
- Security defaults enabled:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - deny `window.open`
  - deny-by-default permission handler
- Added strict IPC allowlist and result envelope:
  - `desktop:pick-folder`
  - `desktop:refresh-folder`
  - `desktop:read-track`
  - response format: `{ ok: true, data } | { ok: false, code, message }`

2. Desktop API + renderer migration
- Added typed renderer contract: `app/src/types/desktopApi.d.ts`
- Replaced `showDirectoryPicker`/directory-handle persistence path with IPC-backed folder token path in store:
  - `window.desktopApi.pickFolder()`
  - `window.desktopApi.refreshFolder(folderId)`
  - `window.desktopApi.readTrack(folderId, relativePath)`
- Preserved web fallback folder path (`webkitdirectory`) for browser mode.

3. Data model and persistence updates
- `LibrarySourceType` changed to:
  - `'desktop-directory' | 'webkitdirectory'`
- `LibrarySnapshot` changed to persist `folderId` token instead of `FileSystemDirectoryHandle`.
- Added legacy snapshot compatibility logic in `folderLibraryRepository` to handle old `'directory-handle'` snapshots.

4. Audio load path improvements
- Added `AudioEngine.loadArrayBuffer()`.
- Desktop track selection now avoids duplicate full-file reads by reusing IPC-provided bytes.

5. UX and behavior hardening
- Import cancel (`PICKER_CANCELLED`) no longer disconnects existing folder state.
- Refresh guarded against re-entry in both UI and store logic.
- Restore path validates desktop folder token by refresh before marking folder connected.

6. Tooling and packaging
- Added scripts:
  - `dev:desktop`
  - `build:desktop`
  - `dist:desktop`
- Added configs:
  - `app/vite.desktop.config.ts`
  - `app/tsconfig.electron.json`
  - updated `app/tsconfig.json` references
- Added packaging baseline (`electron-builder`) in `app/package.json`.

## Files Changed in Port Commit
- `app/electron/main.ts`
- `app/electron/preload.ts`
- `app/package.json`
- `app/package-lock.json`
- `app/src/App.vue`
- `app/src/App.refresh-button.test.ts`
- `app/src/lib/audioEngine.ts`
- `app/src/lib/folderLibraryRepository.ts`
- `app/src/stores/practice.ts`
- `app/src/stores/practice.refreshFolderScan.test.ts`
- `app/src/stores/practice.loop-ab.test.ts`
- `app/src/types/practice.ts`
- `app/src/types/desktopApi.d.ts`
- `app/tsconfig.electron.json`
- `app/tsconfig.json`
- `app/tsconfig.node.json`
- `app/vite.desktop.config.ts`

## Validation Executed
- `npm run test` -> pass (`30` tests)
- `npm run build` -> pass
- `npm run build:desktop` -> pass

## Runtime Prerequisite
If desktop app starts with Node-style errors (for example: missing `BrowserWindow` export), ensure this environment variable is not set:
- `ELECTRON_RUN_AS_NODE`

Run desktop app with:
```bash
cd app
env -u ELECTRON_RUN_AS_NODE ./node_modules/electron/dist/electron .
```

## Known Gaps Remaining
1. Compliance pipeline not yet implemented in repo CI:
- license allowlist/denylist gate
- `THIRD_PARTY_NOTICES.md` generation

2. Manual cross-platform packaging smoke still needed:
- Windows / macOS / Linux artifact checks

3. No auto-update pipeline (intentionally deferred).

4. Optional future optimization:
- stream/chunked read path for very large media files.

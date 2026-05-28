## Electron 42.3.0 Port Plan (electron-pro Owned)

### Summary
Port current Vue/Vite web app to Electron desktop app with secure `main`/`preload`/`renderer` split, keep core practice workflow unchanged, isolate work on dedicated branch/worktree, keep OSS license policy enforcement in CI and release pipeline.  
Electron version pinned to `42.3.0` (verified latest stable on 2026-05-27 from Electron releases page).

### Implementation Changes
1. **Branch and ownership**
   - `electron-pro` owns port execution end-to-end.
   - Create isolated worktree + branch from remote main:
   - `git fetch origin`
   - `git worktree add ../app-music-tweaker-electron -b feat/electron-42-port origin/main`
   - Do all desktop work in new worktree, leave current tree (`main` + untracked `features/`) untouched.

2. **Desktop architecture**
   - Add Electron process split:
   - `main`: app lifecycle, window creation, folder dialogs, recursive file scan/read, IPC handlers.
   - `preload`: typed `contextBridge` API only (`desktopApi` namespace).
   - `renderer`: existing Vue/Pinia/audio UI logic, no Node globals.
   - Security defaults: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strict IPC allowlist, deny `window.open`, deny-by-default permission handlers, CSP for packaged app.

3. **API migration (browser -> Electron)**
   - Replace `showDirectoryPicker`/`FileSystemDirectoryHandle` flow with IPC-backed folder import:
   - `library.pickFolder()`, `library.refresh(folderId)`, `library.readTrack(folderId, relativePath)`.
   - Keep IndexedDB project persistence in renderer for v1; remove persisted directory-handle objects from snapshot model.
   - Add buffer-based engine load path (`loadArrayBuffer`) so Electron track bytes do not depend on browser `File` picker.
   - Keep web fallback path intact for browser build (`webkitdirectory` route).

4. **Tooling and packaging**
   - Add Electron `main` and `preload` TS entrypoints plus Vite orchestration for desktop dev/build.
   - Add scripts: `dev:desktop`, `build:desktop`, `dist:desktop` while preserving web scripts.
   - Package targets for v1: Windows + macOS + Linux installers/artifacts.
   - Auto-update explicitly deferred to `v1.1` after signing/notarization pipeline stabilizes.

5. **Compliance and release ops**
   - Enforce runtime license gate in CI with GPL/AGPL denylist and approved-license allowlist (MIT/BSD/Apache-2.0/LGPL).
   - Generate `THIRD_PARTY_NOTICES.md` in release pipeline from production dependency tree.
   - Keep ffmpeg/codec manifest requirement in desktop release docs when ffmpeg path added.

### Public Interfaces / Types
1. `window.desktopApi` (preload surface) adds:
   - `pickFolder(): Result<{ folderId, folderName, tracks }>`
   - `refreshFolder(folderId): Result<{ tracks }>`
   - `readTrack(folderId, relativePath): Result<{ name, mimeType, arrayBuffer }>`
2. `LibrarySnapshot` shape changes:
   - remove browser handle field
   - add stable desktop folder reference token/path id
3. `AudioEngine` adds:
   - `loadArrayBuffer(buffer, metadata)` alongside existing file path
4. IPC response envelope standardized:
   - `{ ok: true, data } | { ok: false, code, message }`

### Test Plan
1. **Unit**
   - IPC input validation and error envelope mapping.
   - Folder scan/path normalization and duplicate track-id stability.
   - Project/schema migration for snapshot shape change.
   - Audio engine buffer-load path parity with existing file-load behavior.
2. **Integration**
   - Import folder -> select track -> play/pause -> tempo/pitch -> loops/markers -> save/restore project.
   - Folder moved/permission fail -> error UX -> re-pick folder recovery.
3. **E2E (Electron runtime)**
   - App boot, library import, playback controls, loop/marker shortcuts, persistence across relaunch.
4. **Manual QA**
   - Windows/macOS/Linux packaging smoke.
   - Long-file memory behavior and transport stability.
   - Permission/error messaging and reconnect flow.

### Assumptions and Defaults
1. Keep project repository in renderer IndexedDB for v1 to minimize refactor; revisit native store in later milestone.
2. Preserve browser build support while adding desktop target.
3. First desktop release includes Win + macOS + Linux; updater postponed.
4. `electron-pro` remains primary subagent for implementation and follow-up fixes.
5. Electron version source: https://github.com/electron/electron/releases/

# ModAudio

Desktop-first music practice app for loop training.

ModAudio loads local audio/video tracks, shows waveform, and gives practice controls for:
- tempo change (50% to 150%)
- pitch shift (-12 to +12 semitones)
- A/B loop definition and multi-loop sections
- timeline markers
- per-song project restore (tempo/pitch/volume/loops/markers)

## What App Does

From code in `app/src` + `app/electron`:
- imports folder from desktop dialog (Electron IPC) or fallback `webkitdirectory` input
- scans nested folders for supported media files
- loads selected track into Web Audio + `soundtouchjs`
- renders waveform with `wavesurfer.js` + draggable loop regions
- saves project state to IndexedDB per track fingerprint/path
- saves last library snapshot and restores it on app start
- refreshes desktop folder content without re-picking folder

## Supported Media Extensions

`.aac .aif .aiff .flac .m4a .m4b .m4v .mkv .mov .mp3 .mp4 .oga .ogg .opus .wav .weba .webm .wma`

## Keyboard Shortcuts

- `Space`: play/pause
- `A`: set loop start
- `B`: set loop end
- `Esc`: reset A/B definition
- `L`: toggle loop on/off
- `M`: add marker
- `ArrowLeft` / `ArrowRight`: seek -2s / +2s
- `ArrowUp` / `ArrowDown`: jump markers

## Tech Stack

- Vue 3 + Pinia + TypeScript
- Vite 8
- Electron 42
- electron-builder 26
- Web Audio API + `soundtouchjs`
- `wavesurfer.js` regions plugin
- IndexedDB via `idb`
- Vitest + Testing Library + Playwright

## Run And Build

Run from `app/`:

```bash
npm install
npm run dev            # Web dev server
npm run build          # Web production build
npm run dev:desktop    # Electron desktop dev
npm run build:desktop  # Build renderer + electron bundles
npm run dist:desktop   # Package desktop app (AppImage/Snap on Linux)
npm run test           # Unit tests
npm run e2e            # Playwright e2e
```

Important for direct Electron launch:

```bash
env -u ELECTRON_RUN_AS_NODE ./node_modules/electron/dist/electron .
```

## Electron Architecture

- Main process: `app/electron/main.ts`
- Preload bridge: `app/electron/preload.ts`
- Renderer app: `app/src`

### Security Defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- blocks `window.open`
- denies permission requests by default
- IPC channel allowlist + sender URL validation
- folder/file access scoped to persisted allowlist and safe relative paths

### Renderer Desktop API

Exposed on `window.desktopApi`:
- `pickFolder()`
- `refreshFolder(folderId)`
- `readTrack(folderId, relativePath)`

Result envelope:
- success: `{ ok: true, data }`
- failure: `{ ok: false, code, message }`

## Persistence

IndexedDB stores:
- `modaudio-practice-db/projects`: per-song practice projects
- `modaudio-library-db/library`: last imported library snapshot

Desktop folder permissions map persists in Electron userData:
- `folder-allowlist.v1.json`

## Project Layout

```text
modaudio/
  app/
    electron/                 # Main + preload
    src/
      components/             # UI pieces (waveform, controls)
      stores/                 # Pinia practice state/actions
      lib/                    # audio engine, repositories, helpers
    scripts/afterPack.cjs     # electron fuse setup
    release/                  # desktop build artifacts
  documentation/
```

## Current Status

Electron baseline already ported and active.
Reference docs:
- `features/electron-port.md`
- `features/electron-port-report.md`

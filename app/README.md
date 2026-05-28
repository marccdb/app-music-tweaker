# App Music Tweaker (Electron Baseline)

Desktop-first practice workflow app built with Vue 3 + Vite + Electron.

## Run and Build

From `app/`:

- `npm run dev` - web dev
- `npm run build` - web production build
- `npm run dev:desktop` - Electron desktop dev
- `npm run build:desktop` - Electron desktop production build
- `npm run dist:desktop` - Electron package output
- `npm run test` - unit tests

If running Electron directly, make sure `ELECTRON_RUN_AS_NODE` is unset.

## Performance Workflow

Use this flow for repeatable desktop performance checks:

1. Build desktop bundle:
   - `npm run build:desktop`
2. Capture baseline metrics (manual measurement + template update):
   - `npm run perf:baseline`
   - Fill `../features/electron-performance-baseline.md`
3. Run a new measurement cycle and compare:
   - `npm run perf:check`
   - Fill `../features/electron-performance-report.md`

## Measurement Checklist Mapping

The checklist below maps each tracked item to where it is recorded:

- Startup cold/warm timings -> baseline/report tables: `Startup`
- Library scan at 1k tracks -> baseline/report tables: `Library Scan`
- Library scan at 10k tracks -> baseline/report tables: `Library Scan`
- Track load (small file) -> baseline/report tables: `Track Load`
- Track load (large file) -> baseline/report tables: `Track Load`
- Playback FPS stability -> baseline/report tables: `Playback FPS`

Use identical hardware, OS mode, and dataset between baseline and check runs.

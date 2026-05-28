# Desktop QA Hardening

## Automated Coverage

Workflow: `.github/workflows/desktop-ci.yml`

### Cross-platform packaging smoke

Job: `package-smoke`

- Linux: `PACKAGE_SMOKE_TARGET=--linux`
- macOS: `PACKAGE_SMOKE_TARGET=--mac`
- Windows: `PACKAGE_SMOKE_TARGET=--win`

Command executed:

- `npm run qa:package-smoke`
- Internally runs `electron-builder --dir --publish never` to validate unpacked app creation without release signing.

### Long-file memory behavior check

Job: `long-file-memory`

Command executed:

- `npm run qa:memory-long-file`

Default behavior (`app/scripts/memory-long-file-check.mjs`):

- Creates temporary 256 MB file
- Re-reads file 3 times
- Logs RSS memory after each pass
- Fails if peak RSS or post-GC RSS exceed configured limits

Configurable env vars:

- `MEMORY_SMOKE_FILE_MB`
- `MEMORY_SMOKE_ITERATIONS`
- `MEMORY_SMOKE_MAX_PEAK_RSS_MB`
- `MEMORY_SMOKE_MAX_POST_GC_RSS_MB`

### Folder move/unmount recovery scenarios

Unit coverage in `app/src/stores/practice.refreshFolderScan.test.ts` now includes:

- refresh failure disconnects folder
- restore path when desktop snapshot refresh fails after folder move
- track load failure when file becomes unavailable after import

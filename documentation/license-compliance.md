# License Compliance Automation

This repository enforces runtime dependency licenses for the desktop app from `app/`.

## Policy

Policy config file: `app/license-policy.json`

- Allowed licenses: MIT, BSD variants, Apache-2.0, LGPL variants
- Denylist: GPL/AGPL licenses (LGPL excluded from deny rule)
- Package exceptions (explicitly approved):
  - `idb` -> `ISC`
  - `picocolors` -> `ISC`

## Commands

Run from `app/`:

- `npm run licenses:check`
  - Reads runtime dependency tree (`npm ls --omit=dev --all --json --long`)
  - Fails when license metadata violates allowlist/denylist policy
- `npm run licenses:notices`
  - Regenerates `app/THIRD_PARTY_NOTICES.md`
  - Includes package metadata and discovered license text files from installed dependencies

## CI Gate

Workflow: `.github/workflows/desktop-ci.yml`

Quality job enforces:

1. `npm run licenses:check`
2. `npm run licenses:notices`
3. `git diff --exit-code -- THIRD_PARTY_NOTICES.md`

If dependency set or license text changes, update and commit `app/THIRD_PARTY_NOTICES.md`.

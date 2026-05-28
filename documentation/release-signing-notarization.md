# Release Signing and Notarization Pipeline

This document defines release operations for desktop distribution.

## Scope

Platforms:

- macOS
- Windows
- Linux

Goals:

- signed artifacts
- notarized macOS artifacts
- reproducible release flow in CI

## Pipeline Stages

1. Build
- Run from `app/`: `npm run dist:desktop`
- Artifact output: `app/release/`

2. Sign
- macOS: Developer ID Application certificate
- Windows: Authenticode certificate
- Linux: signing optional by target/channel policy

3. Notarize (macOS)
- Submit signed app via Apple notarization API
- Wait for successful notarization result
- Staple notarization ticket to distributed artifact

4. Verify
- Validate signature and notarization before publish
- Retain logs and checksums for release record

## CI/CD Requirements

Secrets expected (example names):

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`
- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

Operational requirements:

- restrict release workflow to protected branches/tags
- require successful `Desktop CI` workflow before release job
- keep signing keys in CI secret manager only

## Auto-update Status

Auto-update remains deferred.

Reason:

- update channel should start only after signing + notarization flow is stable and audited in CI
- unsigned or inconsistently signed artifacts must never enter update feed

Activation gate for auto-update:

1. repeatable signed builds across all target platforms
2. notarization success on each macOS release
3. documented rollback path for broken release

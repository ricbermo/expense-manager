# Biome Tooling Design

## Goal

Replace ESLint with Biome as the project's single formatter and linter. Prettier is not installed and requires no removal.

## Configuration

- Add an exact `@biomejs/biome` development dependency.
- Add `biome.json` with Biome's recommended lint rules and default formatter settings.
- Configure `files.ignoreUnknown` and the supplied inclusion and exclusion patterns so generated output, test reports, and local agent metadata are not processed.
- Enable import organization as a Biome assist action.

## Scripts

- `lint` runs `biome check .`.
- `format` writes Biome formatting changes.
- `format:check` validates formatting without modifying files.

## Removal and Verification

- Remove ESLint dependencies and `eslint.config.mjs`.
- Update the npm lockfile through npm.
- Verify Biome recognizes the configuration and run formatting and lint checks without writing unrelated source changes.

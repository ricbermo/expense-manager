# Biome Tooling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace ESLint with Biome for project formatting and linting.

**Architecture:** Biome is installed locally as an exact development dependency and configured at the repository root. npm scripts expose separate lint and formatting workflows, while `biome check` combines linting, formatting validation, and import organization checks.

**Tech Stack:** npm, Biome 2, Next.js, TypeScript

---

### Task 1: Replace the Quality Tooling Configuration

**Files:**
- Create: `biome.json`
- Modify: `package.json:5-14`
- Modify: `package.json:35-45`
- Modify: `package-lock.json`
- Delete: `eslint.config.mjs`

**Step 1: Add the failing configuration validation target**

Run: `npx @biomejs/biome check .`

Expected: FAIL because `@biomejs/biome` is not installed or `biome.json` does not exist.

**Step 2: Install Biome and remove ESLint dependencies**

Run: `npm install --save-dev --save-exact @biomejs/biome && npm uninstall eslint eslint-config-next`

Expected: `package.json` and `package-lock.json` list exact Biome and no ESLint dependencies.

**Step 3: Add the Biome configuration**

Create `biome.json` with the current schema, recommended linter settings, import organization, and:

```json
"files": {
  "ignoreUnknown": true,
  "includes": [
    "**",
    "!**/.next",
    "!**/out",
    "!**/build",
    "!**/coverage",
    "!**/playwright-report",
    "!**/test-results",
    "!.agents",
    "!.claude",
    "!.opencode",
    "!.impeccable"
  ]
}
```

**Step 4: Replace scripts and remove ESLint configuration**

Set `lint` to `biome check .`, add `format` as `biome format --write .`, add `format:check` as `biome format .`, and delete `eslint.config.mjs`.

**Step 5: Verify configuration loading**

Run: `npm run lint`

Expected: Biome runs using `biome.json`; any existing diagnostics are reported as remediation work rather than configuration failures.

### Task 2: Verify Formatting Workflows

**Files:**
- Verify: `biome.json`
- Verify: `package.json`

**Step 1: Check formatting without writes**

Run: `npm run format:check`

Expected: Biome reports formatting status without changing tracked files.

**Step 2: Confirm the formatter command is available**

Run: `npm run format -- --help`

Expected: Biome format command help is displayed; no files are changed.

**Step 3: Inspect the final toolchain diff**

Run: `git diff -- biome.json package.json package-lock.json eslint.config.mjs`

Expected: The diff contains only the Biome migration and preserves unrelated worktree changes.

**Step 4: Commit**

Do not commit unless the user explicitly requests one. If requested, stage only `biome.json`, `package.json`, `package-lock.json`, and `eslint.config.mjs`.

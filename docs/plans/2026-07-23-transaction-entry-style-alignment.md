# Transaction Entry Style Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the “Registrar movimiento” flow feel like the calm, compact ledger experience established by the dashboard while preserving all existing transaction behavior.

**Architecture:** Keep the existing `TransactionForm` state, validation, and submission logic. Change only the dialog shell, field grouping, action hierarchy, and responsive classes in the form; keep shared design tokens and primitives as the source of truth.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Base UI, React Hook Form, Biome.

---

### Task 1: Reframe the transaction dialog shell

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx:553-698`

**Steps:**
1. Replace the narrow `max-w-sm` dialog sizing with a responsive panel that is wider on desktop and full-height enough for mobile scrolling.
2. Add a concise dialog description that clarifies the common path without introducing marketing copy.
3. Reduce form section spacing and align controls with the dashboard's compact rhythm.
4. Keep the amount field prominent but reduce its fintech-style visual weight.

### Task 2: Normalize the primary action hierarchy

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx:665-695`

**Steps:**
1. Keep the main save action as the only default/emphasized button.
2. Render “Guardar y añadir otro” as a quieter outline action in the same footer group.
3. Convert “Más detalles” into a subdued disclosure control separated from completion actions.
4. Preserve disabled and submitting states.

### Task 3: Clarify form groups and responsive behavior

**Files:**
- Modify: `src/components/transactions/transaction-form.tsx:562-1088`

**Steps:**
1. Give the type selector a compact fieldset treatment with a visible group label.
2. Present required core fields as one coherent group.
3. Add a subtle “Opciones avanzadas” section label for conditional classification and metadata.
4. Preserve all existing conditional rendering and form values.
5. Ensure touch targets remain at least 44px on mobile and the layout remains usable at narrow widths.

### Task 4: Verify the visual alignment

**Files:**
- Verify: `src/app/page.tsx`
- Verify: `src/app/transactions/page.tsx`
- Verify: `src/components/transactions/transaction-form.tsx`

**Steps:**
1. Run `npm run lint`.
2. Run `npm run build`.
3. Run `node .agents/skills/impeccable/scripts/detect.mjs --json src/app/transactions/page.tsx src/components/transactions/transaction-form.tsx`.
4. Confirm no data or submission behavior changed through existing transaction tests and static inspection.

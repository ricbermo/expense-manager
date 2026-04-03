# Personal Finance UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mejorar la UI del Personal Finance Tracker con un estilo profesional sobrio, mayor consistencia visual y mejor legibilidad de datos financieros sin cambiar logica de negocio.

**Architecture:** Se mantiene la arquitectura funcional actual (hooks, rutas y flujos), y se aplica una capa de rediseno incremental basada en tokens de tema, tipografia y patrones reutilizables de layout/estado. El trabajo se concentra en shell global, navegacion, cabeceras y paginas principales (`dashboard`, `movimientos`, `cuentas`, `presupuesto`), con verificaciones de accesibilidad y responsive.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react.

---

### Task 1: Preparar tokens visuales y tipografia global

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Revisar dashboard y cuentas.
- Esperado: lenguaje visual financiero consistente (tipografia y colores base claros).
- Actual: paleta neutra generica y tipografia base no diferenciada por contexto financiero.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: se observa estilo generico sin la nueva base profesional sobria.

**Step 3: Write minimal implementation**

- Cambiar fuente principal a `IBM Plex Sans` en layout global.
- Ajustar tokens de color base en `globals.css` segun diseno aprobado (navy/slate + acento sobrio).
- Mantener compatibilidad con componentes actuales (sin romper variables existentes).

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: toda la app usa nueva tipografia y colores base consistentes.

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: establish professional finance visual tokens and typography"
```

### Task 2: Unificar shell de contenido y espaciado por pagina

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/transactions/page.tsx`
- Modify: `src/app/accounts/page.tsx`
- Modify: `src/app/budgets/page.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Navegar entre las 4 paginas principales.
- Esperado: ancho maximo, gutters y ritmo vertical consistentes.
- Actual: espaciados y densidad visual con diferencias perceptibles entre pantallas.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: inconsistencias de layout visibles entre modulos.

**Step 3: Write minimal implementation**

- Definir patron de contenedor comun (max-width + padding horizontal consistente).
- Aplicar patron a las cuatro paginas sin cambiar contenido funcional.
- Validar espacio inferior para evitar solape con `BottomNav` fija.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: estructura visual uniforme y sin contenido oculto por la barra inferior.

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/transactions/page.tsx src/app/accounts/page.tsx src/app/budgets/page.tsx
git commit -m "feat: standardize page shell spacing and content containers"
```

### Task 3: Refinar PageHeader para jerarquia y acciones consistentes

**Files:**
- Modify: `src/components/layout/page-header.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/transactions/page.tsx`
- Modify: `src/app/accounts/page.tsx`
- Modify: `src/app/budgets/page.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Comparar encabezados de cada pagina.
- Esperado: mismo patron de titulo, subtitulo y acciones.
- Actual: headers con variaciones de estructura y densidad.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: los encabezados no se perciben como parte de un sistema unico.

**Step 3: Write minimal implementation**

- Mejorar `PageHeader` para soportar subtitulo y acciones con alineacion estable.
- Aplicar el nuevo patron en todas las paginas principales.
- Mantener heading principal semantico por pagina (`h1`).

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: headers coherentes en jerarquia y comportamiento.

**Step 5: Commit**

```bash
git add src/components/layout/page-header.tsx src/app/page.tsx src/app/transactions/page.tsx src/app/accounts/page.tsx src/app/budgets/page.tsx
git commit -m "feat: unify page header hierarchy and action layout"
```

### Task 4: Mejorar BottomNav con barra flotante y estados interactivos

**Files:**
- Modify: `src/components/layout/bottom-nav.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Probar navegacion en mobile.
- Esperado: barra inferior claramente separada, activa e interactiva.
- Actual: barra funcional pero visualmente plana y con estado activo mejorable.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: se identifica falta de jerarquia visual en la nav inferior.

**Step 3: Write minimal implementation**

- Convertir barra en estilo flotante con margen y borde/sombra sutil.
- Reforzar estado activo/inactivo y feedback hover/focus (sin layout shift).
- Garantizar tap targets comodos y `cursor-pointer` en elementos clickeables.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: nav mas clara, tactil y consistente con el sistema visual.

**Step 5: Commit**

```bash
git add src/components/layout/bottom-nav.tsx
git commit -m "feat: redesign bottom navigation with floating finance style"
```

### Task 5: Reestructurar Dashboard para lectura financiera rapida

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/dashboard/spending-by-category.tsx` (si se requiere ajuste visual)
- Modify: `src/components/dashboard/monthly-trend.tsx` (si se requiere ajuste visual)

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Entrar al dashboard y escanear KPIs en 5 segundos.
- Esperado: montos clave distinguidos al instante y bloques con consistencia visual.
- Actual: informacion correcta pero jerarquia visual mejorable.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: KPI y graficas sin el nuevo tratamiento de prioridad visual.

**Step 3: Write minimal implementation**

- Unificar plantilla visual de KPI cards (tipografia, color semantico, spacing).
- Mejorar encabezados y contenedores de graficas para legibilidad.
- Mantener logica de datos intacta.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: dashboard mas escaneable y consistente.

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/spending-by-category.tsx src/components/dashboard/monthly-trend.tsx
git commit -m "feat: improve dashboard visual hierarchy for financial metrics"
```

### Task 6: Unificar experiencia de Movimientos (toolbar, lista y vacios)

**Files:**
- Modify: `src/app/transactions/page.tsx`
- Modify: `src/components/transactions/transaction-list.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Revisar toolbar mensual y lista de movimientos.
- Esperado: controles claros y listado con foco visual en montos.
- Actual: toolbar y lista funcionales, pero con jerarquia visual mejorable.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: la pantalla no refleja aun el nuevo patron visual aprobado.

**Step 3: Write minimal implementation**

- Mejorar barra mensual (area de click/espaciado/estilo).
- Reforzar escaneo de filas (monto dominante, metadata secundaria).
- Mejorar empty state con CTA contextual.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: flujo de movimientos mas claro y rapido de leer.

**Step 5: Commit**

```bash
git add src/app/transactions/page.tsx src/components/transactions/transaction-list.tsx
git commit -m "feat: polish transactions view hierarchy and empty states"
```

### Task 7: Unificar Cuentas y Presupuesto con resumenes y estados coherentes

**Files:**
- Modify: `src/app/accounts/page.tsx`
- Modify: `src/components/accounts/account-card.tsx`
- Modify: `src/app/budgets/page.tsx`
- Modify: `src/components/budgets/budget-card.tsx`

**Step 1: Write the failing test**

Escenario manual que hoy falla:
- Comparar tarjetas y resumenes entre cuentas y presupuesto.
- Esperado: mismo lenguaje visual para KPIs, tarjetas y estados.
- Actual: estilos similares pero no completamente uniformes.

**Step 2: Run test to verify it fails**

Run: `npm run dev`
Expected: se observan diferencias visuales evitables entre ambos modulos.

**Step 3: Write minimal implementation**

- Homologar tarjetas de resumen (balance total, gastado/presupuesto).
- Estandarizar apariencia de `AccountCard` y `BudgetCard`.
- Mantener semantica de colores para estado positivo/negativo/alerta.

**Step 4: Run test to verify it passes**

Run: `npm run dev`
Expected: modulos de cuentas y presupuesto se perciben como una sola familia visual.

**Step 5: Commit**

```bash
git add src/app/accounts/page.tsx src/components/accounts/account-card.tsx src/app/budgets/page.tsx src/components/budgets/budget-card.tsx
git commit -m "feat: align accounts and budgets cards with unified finance UI"
```

### Task 8: Cerrar accesibilidad, motion y verificacion tecnica

**Files:**
- Modify: `src/app/globals.css` (si requiere ajustes finales)
- Modify: `src/components/layout/bottom-nav.tsx` (si requiere ajustes de focus)
- Modify: `src/components/layout/page-header.tsx` (si requiere ajustes semanticos)

**Step 1: Write the failing test**

Checklist final que hoy puede fallar parcialmente:
- Focus visible en controles interactivos.
- Respeto de `prefers-reduced-motion`.
- Contraste adecuado en textos secundarios.
- No hay scroll horizontal en mobile.

**Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: detectar posibles issues de estilo/tipos antes del cierre.

**Step 3: Write minimal implementation**

- Ajustar focus states globales y transiciones.
- Agregar/ajustar reglas de reduced motion donde aplique.
- Corregir cualquier inconsistencia de contraste y responsive detectada.

**Step 4: Run test to verify it passes**

Run: `npm run lint && npm run build`
Expected: lint y build completan sin errores.

**Step 5: Commit**

```bash
git add src/app/globals.css src/components/layout/bottom-nav.tsx src/components/layout/page-header.tsx src/app/page.tsx src/app/transactions/page.tsx src/app/accounts/page.tsx src/app/budgets/page.tsx src/components/accounts/account-card.tsx src/components/budgets/budget-card.tsx src/components/transactions/transaction-list.tsx src/components/dashboard/spending-by-category.tsx src/components/dashboard/monthly-trend.tsx
git commit -m "feat: complete professional ui refresh for personal finance tracker"
```

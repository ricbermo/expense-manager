## Contexto

La aplicacion actual de finanzas personales ya cubre los flujos clave (dashboard, movimientos, cuentas, presupuestos), pero la UI todavia se percibe heterogenea entre pantallas.

El objetivo es elevar la calidad visual y de uso hacia un estilo profesional sobrio, con mejor legibilidad de datos financieros, consistencia de componentes y una navegacion mas clara en mobile y desktop.

## Objetivos

- Unificar el lenguaje visual en todas las paginas principales.
- Mejorar la jerarquia de informacion para lectura rapida de montos, fechas y estados.
- Refinar navegacion y layout sin romper los flujos funcionales existentes.
- Estandarizar estados de carga, vacio y feedback de interaccion.
- Cumplir criterios de accesibilidad (contraste, focus, jerarquia de headings, reduced motion).

## No objetivos

- No cambiar modelo de datos, consultas ni reglas de negocio.
- No redisenar informacion funcional de hooks ni rutas de navegacion.
- No introducir dark/light switch nuevo (se mantiene esquema actual de tema).

## Alcance

- Sistema visual global y tokens base en `src/app/globals.css`.
- Ajustes de layout shell en `src/app/layout.tsx`.
- Refinamiento de navegacion en `src/components/layout/bottom-nav.tsx`.
- Refinamiento de cabeceras en `src/components/layout/page-header.tsx`.
- Aplicacion del patron visual en:
  - `src/app/page.tsx`
  - `src/app/transactions/page.tsx`
  - `src/app/accounts/page.tsx`
  - `src/app/budgets/page.tsx`
- Ajustes de estilo en componentes de soporte (cards/listas/formularios) solo cuando sea necesario para consistencia visual.

## Enfoque seleccionado

Se adopta el enfoque "Financial Console" (recomendado), priorizando evolucion incremental sobre reemplazo completo.

Razon:

- Permite mejora significativa de UX/UI sin riesgo alto de regresiones.
- Conserva mapas mentales existentes de usuarios actuales.
- Facilita despliegue por fases y validacion visual por modulo.

## Sistema de diseno base

Basado en la recomendacion de `ui-ux-pro-max` para contexto fintech/personal finance:

- Estilo: minimalismo profesional tipo Swiss (espaciado limpio, grid, alta legibilidad).
- Tipografia: `IBM Plex Sans` como fuente principal para titulos y cuerpo.
- Paleta principal:
  - Primary: `#0F172A`
  - Secondary: `#1E3A8A`
  - CTA: `#CA8A04`
  - Background: `#F8FAFC`
  - Text: `#020617`
- Interacciones: hover/focus sobrios (150-250ms), sin transformaciones que muevan layout.
- Anti patrones a evitar:
  - efectos demasiado "playful"
  - gradientes morado/rosa tipicos de plantillas AI
  - indicadores dependientes solo de color

## Arquitectura de interfaz

### 1) Shell de aplicacion

- Mantener `BottomNav` en mobile, pero con tratamiento visual de barra flotante y estado activo mas evidente.
- Usar ancho maximo consistente para contenido principal en todas las paginas.
- Asegurar padding inferior del contenido para no solapar con navegacion fija.

### 2) Patron de estructura por pagina

Cada vista sigue la secuencia:

1. `PageHeader` (titulo + contexto + acciones)
2. Toolbar de periodo/filtros (cuando aplique)
3. Bloque de resumen/KPI
4. Contenido principal (listas, tarjetas o graficas)

Esto elimina variaciones arbitrarias entre modulos y mejora orientacion del usuario.

## Diseno por modulo

### Dashboard (`src/app/page.tsx`)

- Consolidar 4 KPIs en plantilla visual uniforme (tipografia, padding, borde, contraste).
- Reforzar jerarquia del numero principal sobre texto auxiliar.
- Normalizar contenedores de graficas (`SpendingByCategory`, `MonthlyTrend`) con encabezado claro y espaciado consistente.

### Movimientos (`src/app/transactions/page.tsx`)

- Convertir selector mensual en toolbar estable con mayor area de click.
- Mejorar escaneo de items de transaccion: monto con foco visual, metadata secundaria menos dominante.
- Empty state con accion primaria para crear movimiento.

### Cuentas (`src/app/accounts/page.tsx`)

- Destacar balance total como bloque KPI principal.
- Homogeneizar estilo de tarjetas de cuenta (bordes, iconografia, acciones).
- Diferenciar tipos de cuenta con acentos sutiles sin saturar color.

### Presupuesto (`src/app/budgets/page.tsx`)

- Hacer mas claro el resumen "gastado vs presupuesto".
- Estandarizar `BudgetCard` con indicador de progreso y estado textual (normal/alerta/excedido).
- Preservar accion de copiar mes previo, mejorando affordance visual.

## Componentes y reutilizacion

- `PageHeader`: agregar variante visual consistente para titulo/subtitulo/acciones.
- `BottomNav`: mejorar fondo, elevacion, activo/inactivo, focus ring y targets tactiles.
- Tarjetas de resumen: definir clase/patron reutilizable para KPI cards.
- Skeleton y empty states: definir estructura visual unica para toda la app.
- Botones y acciones: mantener semantica de variantes shadcn, ajustando tokens para coherencia.

## Flujo de datos y comportamiento

No se cambian contratos de datos. Los hooks (`useDashboard`, `useTransactions`, `useAccounts`, `useBudgets`) conservan su API.

Los cambios son de presentacion:

- reorganizacion visual de los datos ya disponibles
- jerarquia tipografica y cromatica
- estado de interaccion (hover/focus/loading/empty)

## Manejo de errores, carga y estados vacios

- Mantener skeletons durante carga con anatomia similar al contenido final.
- Empty states deben incluir mensaje claro y, cuando aplica, CTA para continuar flujo.
- Confirmaciones destructivas se mantienen, pero con copy consistente en tono y claridad.

## Accesibilidad

- Mantener jerarquia de headings sin saltos (`h1`, `h2`, `h3`).
- Garantizar contraste minimo AA para texto y elementos informativos.
- Focus visible en todos los elementos interactivos.
- No depender solo del color para estados (agregar texto y/o icono de apoyo).
- Respetar `prefers-reduced-motion` para animaciones no esenciales.

## Responsive

- Sin scroll horizontal en 375px.
- Ajuste de grids y bloques KPI para 375/768/1024/1440.
- Densidad de informacion mayor en desktop, lectura lineal clara en mobile.

## Verificacion

Pruebas manuales minimas:

1. Revisar dashboard, movimientos, cuentas y presupuesto en 375/768/1024/1440.
2. Confirmar consistencia visual de headers, cards, toolbar mensual y nav inferior.
3. Validar contraste y visibilidad de focus en interacciones clave.
4. Activar `prefers-reduced-motion` y verificar reduccion de animaciones.
5. Validar que no existan regresiones funcionales en crear/editar/eliminar entidades.

## Riesgos

- Riesgo de inconsistencias puntuales entre paginas si algun componente conserva estilos legados.
- Posible sobreajuste visual en mobile si no se valida densidad de contenido.
- Cambios de tipografia pueden alterar saltos de linea y requerir tuning de spacing.

## Resultado esperado

Una UI de finanzas personales mas profesional, clara y consistente, con mejor lectura de datos, mejor navegacion y estandares de accesibilidad/interaccion mas altos, sin cambios de negocio ni ruptura de flujos actuales.

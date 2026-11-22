# Interface Design System — SIM Medical SaaS

## Direction and Feel
**Clinical institutional precision.** Like a hospital's internal software panel — not a startup dashboard. Dense, functional, serious. The UI feels like it belongs under fluorescent office light next to paper forms and laminated badges.

**NOT:** Tech-blue SaaS, warm consumer app, colorful startup.
**IS:** Authoritative, quiet, precise. Calm like a filled-out clinical record.

## Domain
- Clinical records, laminated ID badges, binders, consultation forms
- Hospital corridors, waiting rooms, nurses' station monitors
- Institutional blue from printed health ministry documents
- Matte cream of clinical paper, surgical gray of equipment

## Depth Strategy
**Borders-only.** No card shadows. Cards are defined by `1px solid var(--border-default)`. Only dropdowns and overlays get a shadow (`--shadow-overlay`) to communicate contextual lift.

> Rationale: Shadows feel consumer/friendly. Borders-only feels tool-like and precise. Clinic software should feel like a precise tool.

## Spacing Base Unit
**4px** (`--space-1` through `--space-12`). All gaps, padding, and margins must be multiples of 4px.

## Color Palette
- **Brand / primary action:** `--clinical-500` (#e5322b, SIM red). Used for the main button of each screen, active menu marker and overdue cases — never for large surfaces.
- **Navigation rail:** graphite `--rail-surface` (#15191f) with `--rail-*` tokens.
- **Background:** `--surface-canvas: #f3f4f6` — neutral gray, never pure white
- **Cards:** `--surface-raised: #ffffff`
- **Inset (inputs, table headers):** `--surface-inset: #f6f7f9`

## Text Hierarchy (4 levels — always use all four)
| Token | Role |
|---|---|
| `--ink-primary` | Headings, data values, primary labels |
| `--ink-secondary` | Supporting text, captions |
| `--ink-tertiary` | Metadata, timestamps, deltas |
| `--ink-muted` | Disabled, placeholder |
| `--ink-brand` | Links, interactive labels, module badges |
| `--ink-inverse` | Text on dark (header) surfaces |

## Border Progression (4 levels)
| Token | Use |
|---|---|
| `--border-subtle` | Row dividers, inner separations |
| `--border-default` | Card edges, section outlines |
| `--border-strong` | Emphasis, chevron icons |
| `--border-focus` | Focus ring (`--clinical-500`) |

## Navigation
- Left rail (`components/layout/Sidebar.tsx`), 240px, graphite. Groups from `lib/nav-config.ts` are collapsible section headers; the active item gets a 3px red marker and pending counters (`contador`) come from `/inicio/resumen`.
- Top bar (52px, white): breadcrumbs + global search (Ctrl/⌘ K, `CommandPalette.tsx`).
- Below `lg` the rail becomes a slide-over menu.

## Signature Element
**Capacity bar on stat cards.** A 4px bar spanning the full card bottom shows volume/load visually. Replaces the standard icon-left + big-number pattern. Color matches the stat's semantic color at 70% opacity.

## Typography
- **Font:** IBM Plex Sans (self-hosted via @fontsource, no Google Fonts at build time)
- **Case numbers, IDs, dates, counts:** IBM Plex Mono via `.dato-mono`
- **Headlines:** Tight tracking (`-0.025em`), bold weight
- **Labels:** `.label-clinical` class — `0.733rem`, `font-weight: 600`, `letter-spacing: 0.07em`, uppercase
- **Data values:** `.data-value` class — `1.8rem`, `font-weight: 700`, `letter-spacing: -0.03em`, tabular-nums

## Border Radius
- `--radius-xs: 3px` — tiny chips
- `--radius-sm: 5px` — inputs, buttons, icon containers
- `--radius-md: 7px` — cards, dropdowns
- `--radius-lg: 10px` — welcome banner, major containers

## Key Component Patterns

Shared building blocks live in `components/ui/panel.tsx`: `Panel`, `PanelHeader`, `Etiqueta`, `Pildora`, `EstadoOrden`, `Indicador` (stat card with capacity bar). Page headers use the unboxed `.encabezado-modulo` class.

### Stat Card
```
[icon-container (8×8, radius-sm)] [delta text right-aligned, ink-tertiary]
[data-value class] 
[label, ink-secondary, 12px]
[4px capacity bar full-width at bottom]
```

### Module Header
```
[label-clinical badge in ink-brand]
[h1 in ink-primary]
[description in ink-secondary, 13px]
```

### Activity Row
```
[status icon (14px)] [patient name bold / action secondary] [timestamp ink-tertiary right]
border-bottom: border-subtle
```

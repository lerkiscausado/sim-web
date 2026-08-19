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
- **Primary:** `--clinical-900` to `--clinical-400` — institutional hospital blue, slightly cool, authoritative
- **Background:** `--surface-canvas: #f0f4f8` — slightly blue-tinted gray, never pure white
- **Cards:** `--surface-raised: #ffffff`
- **Inset (inputs):** `--surface-inset: #eef2f7` — slightly darker than surroundings, signals "type here"

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
- Surface: `--nav-surface` (clinical-900) — compact 56px instrument panel
- Text: `--nav-ink` (dim), `--nav-ink-active` (white), `--nav-ink-accent` (clinical-300 for role/tagline)
- Active underline: `--nav-indicator` (2px bar, clinical-300)
- Dropdowns: white surface, shadow-overlay, 2px left accent border on active items

## Signature Element
**Capacity bar on stat cards.** A 4px bar spanning the full card bottom shows volume/load visually. Replaces the standard icon-left + big-number pattern. Color matches the stat's semantic color at 70% opacity.

## Typography
- **Font:** Inter — precise, legible, neutral enough for clinical use
- **Headlines:** Tight tracking (`-0.025em`), bold weight
- **Labels:** `.label-clinical` class — `0.733rem`, `font-weight: 600`, `letter-spacing: 0.07em`, uppercase
- **Data values:** `.data-value` class — `1.8rem`, `font-weight: 700`, `letter-spacing: -0.03em`, tabular-nums

## Border Radius
- `--radius-xs: 3px` — tiny chips
- `--radius-sm: 5px` — inputs, buttons, icon containers
- `--radius-md: 7px` — cards, dropdowns
- `--radius-lg: 10px` — welcome banner, major containers

## Key Component Patterns

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

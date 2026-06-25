# RupeeFlow UI/UX Redesign

This document records the major design decisions made during the full UI/UX refresh.

## Design Philosophy

The redesign targets a **modern SaaS aesthetic** comparable to Linear, Stripe, and Vercel — prioritizing clarity, whitespace, and subtle polish over decorative elements. All changes are visual and structural; no business logic was modified.

## Color Palette

The existing green-on-dark brand identity was preserved:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#59b655` | CTAs, active states, accents |
| Primary dark | `#3d8f3a` | Hover states |
| Primary soft | `#1c321d` | Subtle backgrounds, badges |
| Background | `#101010` | Page background |
| Surface | `#161616` | Cards, panels |
| Border | `#30382f` | Dividers, inputs |

New derived tokens were added for depth without changing the palette: `surface-elevated`, `surface-hover`, `text-tertiary`, `primary-glow`, and `destructive-soft`.

## Typography

- **Font**: Geist Sans applied globally (previously loaded but unused; body fell back to Arial)
- **Hierarchy**: Uppercase tracking-wider labels (11–12px) → body (14px) → headings (16–32px) → stat values (30px+)
- **Numbers**: Tabular nums on all monetary values for alignment

## Spacing & Layout

- **Grid**: 8px base unit via Tailwind defaults (`gap-4`, `p-5`, `py-6`)
- **Border radius**: 6px (sm), 10px (md), 14px (lg), 20px (xl) — replacing the previous uniform 8px
- **Content width**: `max-w-7xl` retained for main content areas
- **Sidebar**: 256px fixed, with slide-in drawer on mobile (< lg breakpoint)

## Component System

A lightweight component library was introduced in `app/_components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Button` | Primary, secondary, ghost, outline, destructive variants |
| `Card` | Default, elevated, ghost surfaces with consistent padding |
| `Modal` | Shared dialog with backdrop blur, escape-to-close, scroll lock |
| `Input` / `Textarea` | Form fields with label, hint, and error states |
| `Badge` | Status indicators |
| `StatCard` | Dashboard metric tiles with optional icon and trend |
| `EmptyState` | Illustrated zero-data states |
| `LoadingState` / `Skeleton*` | Skeleton loaders replacing plain "Loading..." text |
| `Alert` | Error, success, and info messages |
| `ComingSoon` | Placeholder pages with feature previews |

Icons use **Lucide React** for consistency across navigation, stats, and empty states.

## Navigation Redesign

- Sidebar now includes **Lucide icons** per route and a user profile footer
- **Mobile navigation**: Hamburger menu with overlay drawer (previously sidebar was hidden with no alternative)
- **Sticky header** with page title, description, and action buttons
- Header actions: Import + Add expense (both trigger the receipt import modal via shared context)
- Profile dropdown with initials avatar instead of generic user icon

## Page-Level Changes

### Login
- Ambient gradient background with subtle green glow orbs
- Redesigned hero with tighter typography and staggered animations
- Preview card uses elevated surface with improved table styling
- Feature cards with icons; step cards with large step numbers

### Dashboard
- Stat cards with icons, accent glow on primary metric
- Budget utilization progress bar (visual only — uses existing hardcoded budget data)
- Chart restyled: area fill, natural curve, reduced grid noise
- Latest receipt card with structured store/amount/date layout

### Expenses
- Skeleton loading instead of text spinner
- Rich empty state with icon and guidance
- Table with uppercase column headers, row hover states, ghost action buttons
- Receipt detail modal uses shared `Modal` component

### Receipt Import Modal
- Refactored to use shared `Modal`, `Button`, `Input`, `Alert`
- Fixed button label: "Export" → "Import"
- Improved drag-and-drop zone with hover/drag states
- Controlled via `ReceiptImportProvider` context so header "Add expense" works

### Placeholder Pages (Budgets, Approvals, Report)
- Replaced plain "coming soon" text with `ComingSoon` component
- Each page shows planned features as a preview list

## Motion & Interaction

CSS-only animations (no Framer Motion dependency):

- `fade-in`, `fade-up`, `scale-in` for page entry and modals
- Stagger delays for sequential element reveals
- Shimmer skeleton loaders
- Button `active:scale-[0.98]` press feedback
- Card hover border/shadow transitions
- Smooth sidebar drawer slide (300ms)

## Accessibility

- Focus rings via `.focus-ring` utility (primary glow, no outline)
- Modal: escape key closes, body scroll locked, backdrop click closes
- ARIA labels preserved on icon buttons
- Color contrast maintained on dark surfaces
- Responsive behavior preserved and improved (mobile nav)

## Files Changed

```
frontend/app/globals.css                          — Design tokens, animations
frontend/app/layout.tsx                           — Geist font on body
frontend/app/_components/ui/*                     — Component library (10 files)
frontend/app/_components/dashboard-shell.tsx        — Full shell redesign
frontend/app/_components/receipt-import-modal.tsx   — Modal refactor
frontend/app/_lib/receipt-import-context.tsx        — Shared import modal state
frontend/app/(pages)/login/page.tsx                 — Landing page redesign
frontend/app/(pages)/(authenticated)/dashboard/overview-content.tsx
frontend/app/(pages)/(authenticated)/expenses/*
frontend/app/(pages)/(authenticated)/budgets/page.tsx
frontend/app/(pages)/(authenticated)/approvals/page.tsx
frontend/app/(pages)/(authenticated)/report/page.tsx
frontend/package.json                               — Added lucide-react
```

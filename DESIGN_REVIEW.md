# Design Review: Skill Evaluator

Reviewed against: informal design read from `design-taste-frontend` (no `DESIGN_BRIEF.md`/`.design/` folder exists in this project)
Philosophy: technical dev-tool / audit aesthetic — Geist Sans + Geist Mono, zinc neutrals, single blue accent, semantic verdict colors (emerald/amber/rose), restrained motion
Date: 2026-07-21

## Screenshots Captured

No Playwright MCP or Cursor IDE Browser MCP was available in this session, and the in-app Browser pane tool (`mcp__Claude_Browser__*`) has no file-save parameter on its screenshot action — it only returns images inline for visual inspection. As a result, **no PNG files were persisted to a `screenshots/` folder.** All visual analysis below is based on inline captures taken during this session at the following viewports/states, plus DOM/contrast measurements taken via injected JavaScript:

| View                          | Breakpoint         | What was inspected |
| ----------------------------- | ------------------ | --- |
| Input (empty + focused + filled) | Desktop 1280×800 | Dropzone, textarea focus ring, button states |
| Pre-check (unanswered / answered / warning banner) | Desktop 1280×800 | Yes/No button states, warning banner |
| Full report (Gatilho/Estrutura/Direcionamento/Poda) | Desktop 1280×800 | Verdict badges, checklist, contrast |
| Full report, checklist item checked | Desktop 1280×800 | Checked-state styling |
| Full report | Tablet 768×1024 | Reflow, spacing |
| Input + Full report | Mobile 375×812 | Reflow, stat row wrapping, touch targets |
| Input | Desktop 1280×800, light mode (`prefers-color-scheme: light`) | Light-mode contrast, palette |

If a persisted screenshot folder is required for this review to be actionable by others, a follow-up pass with Playwright MCP (or manually attached screenshots) is needed.

## Summary

The implementation is clean, restrained, and true to the intended dev-tool aesthetic — zinc neutrals, mono accents for data/labels, a single blue interactive accent, and well-differentiated verdict colors all read as intentional rather than default AI output. The two real problems are both accessibility gaps that would fail a WCAG AA audit: **no visible keyboard focus indicator on any `<button>`**, and **a handful of secondary-text elements that lose enough contrast in dark mode to fail AA** for normal text. Both are narrow, mechanical fixes, not redesigns.

## Must Fix

> **Status: fixed** (verified via real Tab-key navigation and canvas-based contrast recheck after the fix).

1. **No visible focus indicator on any `<button>` element.** Every interactive `<button>` in the app (Sim/Não, checklist toggle rows, "Nova avaliação", "Upload", "Adicionar", "Avaliar skill", "Ver relatório completo") has no `focus:` or `focus-visible:` Tailwind classes at all — confirmed via computed style (`outlineStyle: "none"`, `boxShadow: "none"`) on multiple buttons. Only the `<textarea>` in [InputPanel.tsx:127](components/skill-evaluator/InputPanel.tsx#L127) has a focus ring (`focus:ring-1 focus:ring-blue-500`). A keyboard-only user tabbing through the pre-check questions or the manual checklist has no way to see which control is focused. _Fix: add a consistent `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950` (or the light-mode equivalent offset color) to every `<button>` — the input's existing ring color is a good baseline to reuse._

2. **Several secondary-text elements fail WCAG AA contrast in dark mode.** Measured via canvas-based contrast calculation against the actual rendered background:
   - `InputPanel.tsx:114` — the "usar exemplo" link: `text-zinc-500` with **no `dark:` override at all** → measured **4.12:1** against the `zinc-950` page background (needs 4.5:1 for normal text). This is an interactive element, not decoration.
   - `PreCheckPanel.tsx:55` — the "Antes do relatório" eyebrow label: `text-zinc-500`, no `dark:` override → same 4.12:1 failure.
   - `ScoreSummary.tsx:23` — the "Veredito geral" eyebrow label: `text-zinc-500`, no `dark:` override → same failure.
   - `ManualChecklist.tsx:19` — the "Checklist manual" label: explicitly sets `dark:text-zinc-500` (i.e. deliberately keeps the same shade in dark mode) → same failure.

   In every case, sibling elements in the same files already do this correctly (e.g. `AxisCard.tsx:28` and `InputPanel.tsx:167` use `text-zinc-500 dark:text-zinc-400`, which measured **7.59:1** — comfortably passes). The fix is mechanical: these four spots are missing the same `dark:text-zinc-400` pattern already used elsewhere. _Fix: add `dark:text-zinc-400` (or lighter) to all four; re-verify in light mode too since light-mode `zinc-500` measured 4.62:1, which passes but only barely — consider standardizing on `zinc-400`/`zinc-500` pairing project-wide so this doesn't recur._

## Should Fix

> **Status: fixed** (verified at 375px viewport after the fix).

1. **`ScoreSummary`'s stat row wraps awkwardly at mobile (375px).** The row `4 bom · 0 atenção · 0 crítico · 46 palavras no corpo` ([ScoreSummary.tsx:30](components/skill-evaluator/ScoreSummary.tsx#L30)) uses a plain `flex gap-4` with no wrap strategy. At 375px viewport width, each `<span>`'s own text wraps mid-phrase instead of the row reflowing as a whole, so the number and its label end up visually separated onto different lines (e.g. "4" on one line, "bom" on the next, at the same time as "0" / "atenção" do the same) — it reads as a rendering glitch rather than intentional layout. _Fix: switch to `grid grid-cols-2 gap-x-4 gap-y-1 sm:flex` (or similar) so each stat stays a single unbreakable unit and the whole set reflows into a 2×2 grid on narrow viewports instead of each phrase wrapping internally._

2. **Heading hierarchy skips a level.** The page has one `<h1>` ("Audite seu SKILL.md...") followed directly by four `<h3>`s (Gatilho/Estrutura/Direcionamento/Poda) in `AxisCard.tsx` — there is no `<h2>` anywhere. Screen readers navigating by heading level will see a jump from 1 to 3. _Fix: change the axis titles in `AxisCard.tsx` from `<h3>` to `<h2>`, since they're the top-level sections directly under the page's single `<h1>`._

## Could Improve

1. **The Next.js dev-mode indicator (bottom-left "N" badge) visually overlaps the "Avaliar skill" button at 375px width** in local development. This is Next.js's own dev-only overlay (not part of the app's code) and won't ship to production, so it's not an app defect, but worth knowing if you're screenshotting or demoing at mobile widths locally — it can make the CTA look partially obscured. No action needed beyond awareness.
2. The "usar exemplo" / "Upload" / "Adicionar" secondary actions are all small (`text-xs`) and sit close together in the `InputPanel` header row — functionally fine on desktop, but worth a quick check that they don't crowd each other at very narrow widths if the component is ever reused outside this max-width-3xl container.

## What Works Well

- **Aesthetic fidelity is strong.** Zinc neutrals + a single blue accent + Geist Mono for labels/counts reads immediately as a technical audit tool, not a generic AI-templated page — no stray gradients, no mismatched fonts, no decorative clutter.
- **Verdict color system is well-executed and accessible.** The green/amber/rose badges measured **9.19:1** contrast in dark mode against their card backgrounds — comfortably passes AAA, and the semantic mapping (good/warning/critical) stays consistent everywhere it appears.
- **Dark/light mode both hold up.** Palette, spacing, and hierarchy translate cleanly between modes (verified via forced `prefers-color-scheme`); nothing looks like a naive inversion.
- **Responsive reflow at tablet (768px) is genuinely good** — single-column layout, consistent spacing, no cramped or orphaned elements, the "Nova avaliação" button holds its position cleanly next to the wrapping title.
- **Interactive feedback on the manual checklist is clear**: checking an item fills the checkbox, shows a check icon, and strikes through the label — an obvious, well-executed state change users won't miss.
- **The textarea's focus ring** (the one place a focus style exists) is a good model for what the missing button focus styles should look like.

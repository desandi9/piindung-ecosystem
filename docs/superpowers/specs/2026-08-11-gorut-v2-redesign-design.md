# GoRUT V2 Redesign — Design Specification

Date: 2026-08-11  
Status: Approved visual direction; implementation pending  
Scope owner: GoRUT V2 only

## 1. Objective

Redesign every GoRUT V2 screen into a modern, interactive civic operations command center that makes financial collection work easier to understand and act on. The product must feel consistent across desktop operations and the PLPK/Kordes mobile applications, provide first-class light and dark themes, and use motion to explain state and continuity.

Success means users can answer these questions quickly:

1. What is happening now?
2. What needs attention first?
3. What action should I take next?
4. Where is a collection batch in the PLPK → Kordes → UPZIS → PC flow?

## 2. Scope

### Included routes

- `/gorut-v2/dashboard`
- `/gorut-v2/munfiq`
- `/gorut-v2/penghimpunan/penjemputan-plpk`
- `/gorut-v2/penghimpunan/verifikasi-kordes`
- `/gorut-v2/penghimpunan/verifikasi-upzis`
- `/gorut-v2/penghimpunan/verifikasi-pc`
- `/gorut-v2/monitoring`
- `/gorut-v2/laporan`
- `/gorut-v2/dokumen-administrasi`
- `/gorut-v2/mobile/plpk`
- `/gorut-v2/mobile/kordes`
- Existing GoRUT V2 redirects and compatibility paths.

### Included UI layers

- Desktop and tablet shell: sidebar, header, navigation, search/command entry, user identity, theme control and mobile drawer.
- Dashboard, operational list/detail flows, filters, tables, cards, forms, dialogs, drawers, reports and document viewers.
- PLPK and Kordes mobile app shells, navigation, home screens, task lists, forms, review sheets and secondary screens.
- Loading, empty, error, success, disabled and unavailable states.
- Responsive behavior, accessibility and motion behavior.

### Excluded

- PIINDUNG pages outside `/gorut-v2`.
- Backend/API, permissions, authentication, persistence, export formats and business-rule changes.
- Changes to existing data derivation in `features/gorut-v2` unless required to expose already-available display information.
- New operational capabilities not already represented in the product.
- Framework migration or replacement of the existing Next.js/React/CSS stack.

## 3. Approved direction

The final direction combines the action-first hierarchy of the Superdesign light Command Center draft with the depth and atmosphere of the dark Operations draft.

Reference drafts:

- Current-state baseline: `63c255ca-27f3-4201-bbdf-7df7f7624068`
- Command Center light: `b9dd8bf7-9d3a-4fab-8a01-506b4d52e501`
- Operations dark: `2916d64a-94d3-4e7f-99fe-9ad4d7d70384`

The implementation must keep all product copy in Indonesian. English labels invented by the dark concept are not part of the approved design.

## 4. Design principles

### Action before decoration

Urgent tasks, stalled batches and explicit next actions appear before secondary analytics. Charts support decisions; they do not dominate the interface merely for visual interest.

### One clear hierarchy

Pages use one dominant region, a secondary supporting region and low-emphasis detail. Equal-weight card grids are avoided. Nested bordered cards are reduced.

### Calm, trustworthy data presentation

NU green remains the brand accent. Warm mineral neutrals and deep green/navy ink provide the foundation. Semantic amber, red and blue appear only when their meaning requires them.

### Progressive disclosure

Lists remain scannable. Details and editing open in contextual drawers or sheets so users keep their place. Complex forms expose one logical group at a time.

### Motion explains change

Animation indicates entrance, hierarchy, continuity, progress and confirmation. It must never slow a routine task or hide required information.

## 5. Visual system

### Typography

- Primary UI: Manrope, weights 400/500/600/700.
- Data and identifiers: Geist Mono or system monospace fallback.
- Financial values and counts use tabular numerals.
- Page titles: 30–36px desktop, 24–28px mobile, tight tracking.
- Body: 13–15px with comfortable 1.55–1.7 line height.
- Labels remain sentence case except truly compact categorical labels.

### Light theme

- Canvas: `#F3F6F4`
- Elevated canvas: `#F8FAF8`
- Surface: `#FFFFFF`
- Muted surface: `#EAF0EC`
- Primary ink: `#10261D`
- Secondary ink: `#40564C`
- Muted ink: `#718078`
- Subtle line: `#DCE5E0`
- Brand: `#087A4F`
- Brand hover: `#066440`
- Brand soft: `#DDF2E7`

### Dark theme

- Canvas: `#09130F`
- Elevated canvas: `#0D1914`
- Surface: `#122019`
- Muted surface: `#172A21`
- Strong surface: `#20372C`
- Primary ink: `#EDF7F1`
- Secondary ink: `#BDD0C5`
- Muted ink: `#82988D`
- Subtle line: `#233A30`
- Brand: `#35C889`
- Brand hover: `#55D9A0`
- Brand soft: `#173B2C`

### Shape and elevation

- Controls: 8px radius.
- Rows and compact cards: 12px.
- Panels and sheets: 16px.
- Hero/large containers: up to 22px.
- Full pills are reserved for compact segmented controls or statuses.
- Borders are used sparingly; a surface change and separator edge are preferred.
- Shadows are tinted toward the green/black canvas and remain restrained.

## 6. Theme architecture

The existing root `next-themes` provider remains the source of truth. GoRUT adds its own semantic CSS token layer beneath `.gorut-viewport` and `.dark .gorut-viewport` so GoRUT can evolve without changing unrelated PIINDUNG styling.

Theme behavior:

- Header exposes a Light / Dark / System menu.
- Mobile exposes the same selection from its profile/settings surface.
- Preference persists through `next-themes`.
- System mode follows operating-system changes.
- Both themes are rendered from semantic tokens; dark mode is not implemented with filters or blanket opacity.
- Theme transition is short and must not flash or animate large layout properties.

## 7. Shared application architecture

### `GorutAppShell`

Introduce a shared GoRUT-specific shell that composes:

- Desktop sidebar/navigation rail.
- Shared header and theme control.
- Main content container.
- Mobile navigation drawer.
- Desktop/mobile responsive switch.
- Optional mobile bottom navigation.
- Shared loading and page-transition boundaries.

Existing page shells continue to own their page data and actions; they supply title, navigation state, target summary and content to `GorutAppShell`. This removes repeated wrapper markup without moving business logic.

### Shared primitives

Create or normalize GoRUT-specific primitives only where repeated patterns justify them:

- `GorutPageHeader`
- `GorutThemeControl`
- `GorutCommandTrigger`
- `GorutMetric`
- `GorutStatusBadge`
- `GorutSummaryBand`
- `GorutFilterBar`
- `GorutDataTableFrame`
- `GorutEmptyState`
- `GorutErrorState`
- `GorutSkeleton`
- `GorutDrawer` / `GorutSheet` wrappers around existing Radix primitives.

Shared primitives receive display/state props. They do not own domain data fetching or mutate operational data.

## 8. Desktop information architecture

### Sidebar

- Expanded width around 240px; collapsed rail around 76px.
- Real GoRUT brand asset replaces the generic dashboard icon where practical.
- Navigation groups remain consistent with current routes and permissions.
- Active item uses a tonal surface and brand indicator.
- Collapse preserves icon position; labels fade without causing content jumps.
- Collection target becomes a concise health summary, not a nested mini-dashboard.

### Header

- Compact sticky header with page identity, command/search trigger, notifications, theme menu and user menu.
- Search/command displays `/` or `⌘K` affordance only if the interaction is actually available; unavailable controls remain explicitly disabled.
- Page-specific primary actions remain in the page header, not mixed into global navigation.

### Page structure

Desktop pages use:

1. Compact page header and contextual metadata.
2. Summary/health band where meaningful.
3. Sticky filters or task controls.
4. Primary content table, workflow or document surface.
5. Contextual drawer or sheet for details and edits.

## 9. Dashboard design

The dashboard becomes action-first.

### Primary order

1. Operational heading, active period and theme/command affordances.
2. Priority action queue with severity, age, consequence and direct next action.
3. Collection health surface with net amount, target progress, active Munfiq and batch completeness.
4. Interactive trend chart with line/bar mode, focus/hover tooltip and active period.
5. PLPK → Kordes → UPZIS → PC workflow showing bottlenecks and progress.
6. Status composition, regional progress and shortcuts as supporting information.

### Dashboard interactions

- Keyboard-focusable chart points and tooltips.
- Mode change animates chart geometry without remounting the page.
- Workflow stage and priority row link to existing operational routes.
- No new backend data is required; all values continue to come from `buildDashboardControl` and existing stores.

## 10. Operational list and verification pages

Munfiq, collection and verification pages share a common visual grammar:

- Summary band groups related counts instead of separate equal cards.
- Filter bar is sticky where vertical scroll makes it useful.
- Active filters show a count and removable chips.
- Desktop table headers remain visible; identity columns may remain sticky.
- Row hover/focus exposes available actions without hiding the primary row content.
- Mobile uses task cards with the same content priority as desktop.
- Detail drawers preserve list position.
- Verification screens make current stage, blocking reason and next valid action visually explicit.
- Correction states use clear inline explanations rather than color alone.

## 11. Monitoring, reports and documents

### Monitoring

- Treat the page as an operations control room.
- Region/period controls remain visible while users inspect results.
- Bottlenecks and stale work rank above aggregate totals.
- Tables and cards use consistent status language with verification pages.

### Reports

- Filters, summary and export remain in a clear top-to-bottom flow.
- CSV export behavior and filename logic are unchanged.
- Disabled export communicates why it is unavailable.
- Mobile report cards preserve financial alignment and status readability.

### Documents

- Catalog, selected document and preview form a stable master-detail composition on desktop.
- Mobile uses a list followed by a full-height preview sheet.
- Existing HTML fallback and PDF behavior remain unchanged.

## 12. Mobile PLPK and Kordes

Mobile is an app-native experience, not a compressed desktop page.

### Shared mobile rules

- Respect safe areas and 44px minimum touch targets.
- Persistent bottom navigation uses stable icon positions.
- Primary field action stays thumb-reachable.
- Detail/edit/review screens use bottom or full-height sheets.
- Forms preserve entered values between steps and make validation local to the field.
- Loading, offline-like storage delays and empty states use the final layout geometry.

### PLPK

- Home prioritizes today’s route, unresolved visits and collection progress.
- Collection flow communicates step, saved state and review before confirmation.
- Journal/history remains scannable with date and amount hierarchy.

### Kordes

- Home prioritizes the verification queue and overdue items.
- Verification detail shows evidence, discrepancy and available decision in one sequence.
- Recap and journal use the same financial/status language as desktop.

## 13. Motion system

Use the existing stack. CSS handles simple state and entrance animation; Motion may be used for interruptible drawers, shared-layout transitions or complex list reordering. GSAP is not required for routine product UI.

Timing:

- Hover/press/focus: 120–180ms.
- Menus, tabs and filters: 200–280ms.
- Drawer/sheet/page section: 320–480ms.
- Restrained list stagger: 30–50ms between items.

Rules:

- Animate transform and opacity for primary motion.
- Sidebar collapse maintains icon anchors and avoids workspace jumps.
- Charts animate initial draw once and update when data/mode changes.
- Theme change uses a short color transition with no scale or blur.
- Buttons provide pressed feedback around `scale(.98)`.
- `prefers-reduced-motion` and the existing `data-animations="off"` escape hatch disable non-essential motion.
- Loading motion must not prevent users from reading already-available content.

## 14. Data flow and behavior preservation

All domain state remains where it currently lives.

- Dashboard continues to derive values from current `features/gorut-v2` data and stores.
- Collection and mobile apps continue to share `collection-store`/PLPK data behavior.
- Filters, sorting, pagination, selection, CSV export, local storage and dialog actions keep their current contracts.
- Shared presentation primitives receive already-derived props.
- Theme preference is the only new persisted UI preference and uses the existing theme provider.
- No page may introduce fake success, fake saving or a dead interactive control.

## 15. Loading, empty and error states

- Skeletons match the redesigned geometry and do not cause large layout shifts.
- Empty states explain what is missing and provide the next valid action when one exists.
- Filter-empty states offer reset without losing unrelated page state.
- Errors are inline, specific and recoverable.
- Disabled/unavailable features retain explicit labels or tooltips.
- Toasts are reserved for transient confirmations; validation and actionable errors remain in context.

## 16. Accessibility

- WCAG AA contrast in both themes.
- Visible keyboard focus on all actionable elements.
- Skip-to-content support in the shared shell.
- Semantic landmarks and descriptive section headings.
- Tables retain semantic headers and accessible sort state.
- Charts expose a text summary and accessible point labels.
- Status never relies on color alone.
- Drawers/dialogs use focus trapping, accessible titles/descriptions and reliable close behavior.
- Mobile touch targets are at least 44px where practical.
- Reduced-motion support is mandatory.

## 17. Responsive matrix

Primary verification sizes:

- Desktop: 1440×1000.
- Compact desktop/tablet landscape: 1024×768.
- Mobile large: 430×932.
- Mobile standard: 390×844.

No GoRUT page may create horizontal page scrolling. Tables may use an intentional internal scroll region when there is no clearer responsive representation.

## 18. Implementation sequence

### Phase 1 — Foundation and shell

- Semantic theme tokens, Manrope/tabular typography and theme control.
- Shared `GorutAppShell`, sidebar, header, mobile drawer and navigation.
- Shared motion and accessibility utilities.

### Phase 2 — Dashboard

- Action-first command center composition.
- Chart, workflow, priority queue and responsive behavior.

### Phase 3 — Desktop operational workflows

- Munfiq.
- PLPK collection.
- Kordes, UPZIS and PC verification.
- Shared summaries, filters, tables, cards, drawers and states.

### Phase 4 — Monitoring, reports and documents

- Control-room hierarchy.
- Report/export surface.
- Document master-detail experience.

### Phase 5 — Mobile PLPK and Kordes

- Shared mobile tokens and navigation.
- Role-specific home, task, detail, form, journal and recap screens.

Each phase must compile and pass focused tests before the next phase begins. Existing user changes in dirty files must be merged rather than overwritten.

## 19. Testing and verification

### Automated

- Existing `features/gorut-v2` and component tests remain passing.
- Add focused tests for theme state, shell navigation state and any extracted pure presentation logic.
- Lint touched files.
- Run the production build before completion.

### Interaction

- Sidebar expansion/collapse and persistence.
- Light/Dark/System theme selection and hydration behavior.
- Mobile drawer and bottom navigation.
- Dashboard chart mode, links and keyboard tooltips.
- Filters, sorting, selection, pagination and reset.
- Drawers/dialogs, validation, confirmations and close behavior.
- CSV export and document preview behavior.

### Visual

- Capture all four viewport sizes in light and dark themes.
- Check overflow, sticky regions, focus indicators, touch targets and text truncation.
- Compare operational states: populated, loading, filtered-empty, naturally empty, error, disabled and success.

## 20. Acceptance criteria

- Every included GoRUT V2 route uses the approved design system.
- Light and dark themes are complete and readable across desktop and mobile.
- Theme preference persists and System mode works.
- All existing GoRUT navigation, filters, validation, exports, stores and workflows continue to work.
- Priority work is easier to locate than in the current design.
- Desktop and mobile have intentional layouts, not accidental responsive collapse.
- Motion is smooth, restrained and reduced-motion compliant.
- No unrelated PIINDUNG interface is modified.
- Build, focused tests and visual QA pass before completion is claimed.

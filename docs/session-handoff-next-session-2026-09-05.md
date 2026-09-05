# Next Session Handoff — 2026-09-05

## 1. Purpose and operating boundary

This project is a reusable, PRD-driven design harness for Harnessthon. The current sample product is a Korean **wedding-invitation gathering scheduler**, but the harness itself must remain domain-neutral: do not embed wedding-specific visual systems, components, or assumptions as defaults for future PRDs.

The sample product helps a couple manage a shared contact pool, form invitation gatherings, collect availability, confirm dates, and avoid calendar conflicts. The prototype is mobile-first and is being designed as a native iOS product.

### Source of truth, in priority order

1. Explicit user instructions and the current PRD.
2. Existing product/repository tokens, components, and approved user changes.
3. Verified rules in `DESIGN.md`, if present and relevant to the target platform.
4. Approved reference principles and the reference log.
5. Platform guidance (Apple HIG for iOS work).

Do not treat a visual reference, an example system, or an older decision as a reason to override the PRD or a newer user instruction. Record unconfirmed choices as assumptions in `brief.md`.

## 2. Project locations and assets

- Project root: `/Users/sohyeon/Desktop/harnessthon-team5/harnessthon-2-team-5`
- Current PRD: `docs/invitation-gathering-scheduler-prd-v1.md`
- Harness: `.claude/skills/oss-design-harness/SKILL.md`
- Brief template: `templates/brief.md`
- Decisions template: `templates/decisions.md`
- Previous handoff: `docs/session-handoff-2026-09-05.md`
- Figma file: https://www.figma.com/design/C1XY5hdQkldY4GZBdXJWXP/test1?node-id=0-1
- Figma page ID: `0:1`

Existing modified/new files listed in the previous handoff must be preserved. Never discard, reset, or overwrite user changes merely to make a new direction consistent.

## 3. Product model and prototype scope

### Users

- **Organizer / couple planner**: create gatherings, select contacts, set candidate times and a deadline, track responses, remind non-responders, choose a date, and share the confirmed plan.
- **Invitee**: opens an invitation link, marks availability, submits, and later sees the outcome.

### Core object model

`Couple workspace → Contact → Gathering → Candidate time → Invitee response → Confirmed schedule`

One contact may belong to multiple groups/gatherings without duplication. A gathering remains a persistent object with the lifecycle: **Draft → Awaiting responses → Ready to confirm → Confirmed → Completed**. Its detail view is the durable home for that lifecycle.

### Required user flows

- New organizer: empty Home → create gathering → select contacts → configure candidates/deadline → send invitation → track responses → compare candidates → confirm → share.
- Returning organizer: Home → identify missing responses → see non-responders/remind → response status → confirm.
- Invitee: invitation link → select availability → submit → completion/outcome.
- Root navigation: **Home / Gatherings / Calendar / Contacts**.

The prototype must make visible: multi-group membership, late/unanswered response, schedule conflict, one 1:1 gathering, one 3–6-person gathering, one joint gathering, and the required gathering statuses.

## 4. Design and interaction rules

### Native iOS baseline

- Design for **native iOS**, not an iPhone-sized mobile web page.
- Prefer Apple HIG patterns and the iOS/iPadOS UI Kit whenever a suitable component is available. Use the Kit structurally if a remote component cannot be imported, and document that limitation.
- Follow iOS system typography; do not use undersized text.
- Use **SF Symbols only** for all new iOS icons. Do not mix SF Symbols with Lucide, Material, or custom icon families. Choose icons by semantic meaning, not decoration.
- Standard horizontal content margin: **16pt**.
- Icon touch target: **44 × 44pt**.
- Use established iOS patterns for navigation bars, lists, forms, tabs, sheets, alerts, pickers, toggles, selection, and system feedback instead of inventing a custom control.

### Navigation and CTA rules

- Bottom Tab Bar is only for persistent root destinations; use it on Home and Gatherings/List root surfaces, with the active tab matching the current destination.
- Do **not** add a tab bar to create/setup, detail, review/decision, invitee-response, confirmation, or other navigation-stack flows just for visual consistency.
- Non-root back navigation uses a **44pt iOS-style back hit area**. The former round back-disc pattern is removed; do not restore it.
- Each screen must expose one obvious next action. Put secondary actions in the navigation hierarchy or progressive disclosure.
- Brand primary: **`#E8845D`**. Reserve it for the primary CTA and explicit selected states; use neutral/system secondary colors for surfaces, metadata, routine controls, and decoration.
- Primary CTA: a **12pt-radius rounded rectangle**, not a pill. Keep it visible and clear of the bottom safe area/tab bar.

### Auto Layout, reusable structure, and accessibility

- Apply nested **Figma Auto Layout** by default to screens, navigation bars, sections, cards, lists, rows, forms, and buttons.
- Use Hug contents, Fill container, fixed sizing, padding, and gaps deliberately. Do not apply superficial Auto Layout while retaining a fixed/absolute-positioned internal layout that breaks with content changes.
- Refactor only the part actively being revised unless broader work is requested; early screens may still be absolute-positioned and must not be destabilized wholesale.
- Build reusable components/variants for repeated controls: navigation bar, tab bar, primary button, list/contact row, status label/badge, avatars, date-candidate cards, filters, and stateful controls.
- Use named color/type styles, a consistent spacing grid (default assumption: 4pt unless a project token says otherwise), semantic layer names such as `Screen/`, `Section/`, `Card/`, `ListItem/`, `Action/`, and `State/`.
- Include the states actually required by the flow—such as default, selected, disabled, overdue, empty, error, and conflict—without manufacturing needless variants.
- Do not communicate conflict, response, or deadline risk through color alone; retain legible text and/or icon cues.

## 5. Image, avatar, and dummy-data policy

- Do not leave a meaningful photographic region empty.
- Use **Unsplash first** for context-relevant photography; **Pexels second** if needed.
- Use **DiceBear** (or one consistent equivalent system) for fictional avatars. Keep the same person’s avatar stable across every screen.
- Use **Lorem Picsum only** for semantically neutral placeholders, never for meaningful product photography.
- Choose photos that fit the PRD’s real context and the adopted reference direction. For this sample, appropriate subjects include couples, invitations, flowers, meals, and wedding-related social scenes.
- Keep photo lighting, saturation, subject treatment, crop, and aspect ratio coherent within a single experience. Avoid irrelevant stock images, meaningless decorative photos, repeated imagery, or copy-pasted reference assets.

Concept B’s hero currently uses `assets/concept-b-wedding-hero-unsplash.jpg` (Figma image hash `ed174d907b5d06f236efaffeba4fc15b8813b218`). Preserve it unless the user asks to change it.

## 6. Reference-driven design rules

- References are evidence for **underlying UX/visual principles**, not screens to duplicate. Extract the hierarchy, interaction model, spacing rhythm, information density, and visual tone, then adapt them to the PRD and user flow.
- PRD functionality and the approved user flow are the functional authority.
- When researching, log at least three relevant reference examples in `brief.md`, including what to adopt and what not to adopt. Useful sources by role:
  - Recent / Refero / Mobbin: real product flows and UI patterns.
  - SaaSFrame: desktop SaaS, admin, dashboard, and B2B patterns.
  - Radix: component interaction behavior and accessibility baseline (for web work).
  - Land-book: visual/brand exploration for landing, editorial, commerce, or marketing work.
  - Apple Design Resources, iOS/iPadOS UI Kit, Apple HIG, and SF Symbols: iOS work.
- Do not use inspiration galleries as a reason to add impractical motion, arbitrary decoration, or a non-native interaction model.
- First infer the target platform from the PRD. Do not transplant iOS conventions into web work or web conventions into native iOS work.

## 7. Concept separation

- **Concept A** is the production scheduler direction. Preserve it while making normal fixes and extensions.
- **Concept B** is a separate Joy-informed alternative. Its purpose is to interpret, not replicate, Joy’s guest-management principles.
- If the user asks for “시안 B” or any reference-driven alternative, create or modify a **separate Figma frame**. Never overwrite Concept A.
- Keep shared functional requirements/data consistent across alternatives unless the user explicitly asks to test a product-structure difference.

## 8. Figma workflow and validation contract

Before every Figma change:

1. Read the target file/page/frame metadata and inspect its current screenshot.
2. Identify existing components/styles/assets to reuse and the current Auto Layout structure.
3. Preserve all existing user changes; make the narrowest change that completes the requested work.

After every Figma change:

1. Capture a screenshot of the changed frame(s).
2. Visually verify hierarchy, text wrapping/overflow, 16pt margins, safe-area/tab-bar clearance, CTA visibility, visual consistency, and state legibility.
3. Check structure separately: palette/style reuse, spacing grid, semantic layer names, reusable components, and required variants.
4. If a screenshot fails, diagnose before editing: fix a local property locally; return to alternative exploration only if the direction itself is wrong; escalate to requirements alignment after repeated directional failure.

The completion decision remains human-led. Do not silently declare a visual direction “good enough” after repeated failures.

## 9. Harness execution model and decision records

### Requirement alignment (stage 0)

Before designing an uncertain product, define roles, end goals, objects, relationships, lifecycle, concurrent management, return visits, edge cases, and the minimum coherent screen set. A persistent object that changes over time needs a detail/home view.

Distinguish PRD facts from layout/screen assumptions. Store assumptions, reference reactions, extracted rules, product interpretation, and provisional tokens in `brief.md`.

Ask open, evidence-led questions only when a material choice genuinely requires input: present the reference/context and ask for a free-text reaction rather than a label-only question. Otherwise make a reversible, documented assumption and proceed.

### Divergence and convergence (stage B)

When the requirement is clear but the form is not, choose no more than two independent decision axes. Create two options per axis, vary one factor at a time, and keep the PRD/data constant. Evaluate task completion and extensibility (tokens/components/states). Record options, discarded paths, selection rationale, and trade-offs in `decisions.md`.

### Structural and visual verification (stages A and C)

- **A / structural**: inspect Figma data for palette, type, spacing, component reuse, semantic names, and state coverage.
- **C / visual**: always inspect actual screenshots for hierarchy, rhythm, density, coherence, edge states, and AI-slop patterns (irrelevant 3D art, excessive gradients, needless cards, decorative icons).
- After two failed local revisions for the same cause, return to stage B. After two failed B-stage changes for the same cause, return to stage 0.

## 10. Current Figma state — checked 2026-09-05

The current Figma page (`0:1`) was inspected before creating this handoff. It contains the Concept A flow plus three independent Concept B frames. The Figma page screenshot is a wide board of 390pt × 844pt mobile frames.

### Concept A — scheduler flow

| Purpose | Figma ID |
| --- | --- |
| Home — in progress | `18:2` |
| Home — empty | `22:2` |
| Select contacts | `24:2` |
| Select candidate times | `24:23` |
| Invitee response | `24:45` |
| Calendar conflict | `24:65` |
| Response status | `29:2` |
| Confirmed gathering | `29:35` |
| Gatherings list | `34:2` |
| Gathering detail | `34:26` |
| Candidate decision review | `34:44` |
| Invitee response submitted | `34:62` |

### Concept B — separate Joy-informed direction

| Purpose | Figma ID |
| --- | --- |
| Wedding Hub | `35:2` |
| Guest List | `35:68` |
| RSVP Hub | `35:89` |

### Confirmed completed work

- Built Concept A’s full flow and Concept B’s separate direction.
- Replaced affected GNB round back-discs with Auto Layout iOS navigation bars and 44pt back hit areas.
- Applied the 16pt mobile margin standard.
- Standardized current primary CTAs to 12pt rounded rectangles.
- Added Bottom Tab Bars to empty Home and Gatherings root screens; the Gatherings tab is active on the list screen.
- Moved the Gatherings-list CTA above the tab-bar safe area.
- Verified key navigation, empty Home, and Gatherings list with screenshots.

### Known limitations, based on current Figma inspection

- Legacy Lucide layers remain in the file, including back-arrow frames and the tab-bar icons on the Gatherings list; do not add more. Migrate them to SF Symbols during the next navigation/component pass.
- Some early frames are still largely absolute-positioned. New work uses Auto Layout; migrate only the actively revised area unless a planned component refactor is in scope.
- The Apple iOS Kit library was available, but importing a specific remote component previously failed. Reproduce Apple patterns structurally when necessary and note the limitation.
- Concept B’s frame metadata still shows Lucide icon layers from the earlier direction; treat this as migration backlog, not authorization to mix icon families.

## 11. Recommended next work

1. Read and screenshot the current target frame before editing.
2. Audit Concept A navigation and root tabs; migrate remaining Lucide navigation/tab icons to matching SF Symbols without changing the information architecture.
3. Normalize iOS system typography and create/reuse Auto Layout components for navigation bars, tab bars, primary buttons, rows, and status labels.
4. Review every Concept A frame at 390pt width for text overflow, bottom-safe-area collisions, CTA visibility, and accessibility/state clarity.
5. Continue Concept B only when explicitly requested; keep all such work in Concept B frames.

## 12. Autonomous execution guardrails

- Proceed autonomously with normal, reversible design work that is clearly within the PRD, current flow, and these rules. Keep a short assumption/decision log rather than blocking on every minor ambiguity.
- Stop and request direction when a choice would alter product scope, functional requirements, target platform, concept ownership/separation, a user-approved visual direction, or an existing user change.
- Never reset, delete, or mass-replace existing Figma/user work to achieve consistency. Inspect first, change narrowly, and verify afterward.
- Do not add screens, objects, visual flourishes, or interactions without a clear user goal, lifecycle state, or PRD basis.
- Favour the smallest coherent experience; keep low-priority features (automation, sync, messaging, authentication, notifications, recommendations, payments, unrelated wedding logistics) out of the first prototype unless specifically requested.
- At handoff, update this record with actual completed changes, remaining limitations, current Figma IDs, and the next safest action. Recheck context/session status before a long continuation when available.

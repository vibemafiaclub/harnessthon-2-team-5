# Session Handoff - 2026-09-05

## Objective

Build a reusable, PRD-driven design harness for the Harnessthon. The current sample product is a Korean wedding invitation gathering scheduler, but the harness must remain domain-neutral for future PRDs.

## Source Material

- Sample PRD: `docs/invitation-gathering-scheduler-prd-v1.md`
- Harness instructions: `.claude/skills/oss-design-harness/SKILL.md`
- Brief and decision templates: `templates/brief.md`, `templates/decisions.md`
- Figma file: https://www.figma.com/design/C1XY5hdQkldY4GZBdXJWXP/test1?node-id=0-1
- Figma page ID: `0:1`

## Product Model

Primary roles:

- Organizer: the couple creates invitation gatherings, selects contacts and time candidates, checks response progress, sends reminders, and confirms a schedule.
- Invitee: opens an invitation link, chooses availability, and receives confirmation.

Object relationship:

`Couple workspace -> Contact -> Gathering -> Candidate time -> Invitee response -> Confirmed schedule`

Core organizer states:

- No gathering: primary CTA is `새 모임 만들기`.
- Existing gathering with missing responses: primary CTA is `미응답자 확인`.
- Enough responses: review candidates and confirm a time.
- Confirmed: share the final schedule.

## Approved UX Decisions

- Both organizer and invitee flows are mobile.
- Root destinations use Bottom Tab Bar; setup, detail, review, response, and confirmation use a navigation stack.
- Root navigation currently contains Home, Gatherings, Calendar, and Contacts.
- The home empty state and gathering list have persistent tab bars. The active tab must match the current root destination.
- Creation and response flows must not gain a tab bar just to make screens look consistent.
- The smallest coherent product structure is preferred over adding screens without a clear object, state, or decision.

## Design System Rules

- Target platform is native iOS, not generic responsive mobile web.
- Use Apple HIG patterns and the iOS/iPadOS UI Kit whenever a suitable component is available.
- Use SF Symbols only for future iOS icon work. Do not introduce or mix Lucide, Material, and SF Symbols. Existing Lucide layers should be migrated when the navigation system is next refactored.
- Typography follows the iOS system hierarchy; avoid undersized text.
- Standard horizontal content margin: `16pt`.
- Common icon hit area: `44 x 44pt`.
- Use nested Figma Auto Layout for screen, navigation, sections, cards, lists, rows, forms, and buttons.
- Primary color: `#E8845D`, only for the primary CTA. Other UI uses neutral/system secondary colors.
- Primary CTA geometry: `12pt` corner radius, based on the populated Home card CTA. Do not use pill-shaped primary buttons.
- Design priorities: a single obvious next action, high CTA visibility, simplicity, and progressive disclosure.

## Reference Rules

- When the user supplies a reference, extract its visual and UX principles; do not copy it.
- PRD and approved user flow remain the functional source of truth.
- A new concept must be created in a separate Figma frame. Never overwrite Concept A when producing Concept B.
- Image sources: Unsplash for context-relevant photography; Pexels as secondary; DiceBear for stable fictional avatars; Lorem Picsum only for non-meaningful placeholders.

## Existing Figma Screens

### Concept A - Scheduler Flow

| Purpose | Figma ID |
| --- | --- |
| Home with a gathering | `18:2` |
| Home empty state | `22:2` |
| Select contacts | `24:2` |
| Select candidate times | `24:23` |
| Invitee response | `24:45` |
| Calendar conflict | `24:65` |
| Response-status detail | `29:2` |
| Confirmed gathering | `29:35` |
| Gathering list | `34:2` |
| Gathering detail | `34:26` |
| Candidate decision review | `34:44` |
| Invitee response submitted | `34:62` |

### Concept B - Joy-Inspired Direction

Concept B is a distinct direction and must remain separate from Concept A.

| Purpose | Figma ID |
| --- | --- |
| Wedding hub home | `35:2` |
| Guest list | `35:68` |
| RSVP hub | `35:89` |

The Concept B hero photo uses `assets/concept-b-wedding-hero-unsplash.jpg` and is placed in Figma with image hash `ed174d907b5d06f236efaffeba4fc15b8813b218`.

## Work Completed This Session

- Expanded the harness and PRD with product-model, lifecycle, return-visit, reference-adaptation, and image-source guidance.
- Created the full Concept A flow and the separate Concept B direction in Figma.
- Replaced the broken custom back-disc treatment with Auto Layout navigation bars on the affected Concept A flow screens.
- Applied the 16pt mobile margin standard.
- Standardized primary CTAs to 12pt rounded rectangles across the current screens.
- Added Bottom Tab Bars to the empty Home and Gatherings root screens; made the Gatherings tab active on the list screen and moved its CTA above the tab-bar safe area.
- Verified screenshots for the key navigation, empty Home, and Gatherings list screens after the changes.

## Important Current Limitations

- Several existing icon layers are Lucide from before the iOS rule was finalized. Do not add more. Migrate them to SF Symbols during the next navigation/component pass.
- Many early screens are still absolute-positioned despite the current Auto Layout rule. New work must use Auto Layout by default; refactor only the areas being actively revised to avoid destabilizing the MVP.
- The iOS Kit library was available in Figma, but importing a specific remote component failed. Use the Kit when importable; otherwise reproduce the Apple pattern structurally and document the limitation.

## Recommended Next Steps

1. Audit Concept A against the iOS rules: migrate remaining Lucide navigation/tab icons to SF Symbols and normalize system typography.
2. Establish reusable Figma components/variants for iOS navigation bars, tab bars, primary buttons, list rows, and status labels using Auto Layout.
3. Review all Concept A screens at 390pt width for text overflow, bottom safe-area conflicts, and CTA visibility.
4. Continue Concept B only when the user asks for that alternative direction; never modify Concept A as part of that work.

## Current Workspace State

Modified or new files that must not be discarded:

- `.claude/skills/oss-design-harness/SKILL.md`
- `templates/brief.md`
- `templates/decisions.md`
- `docs/invitation-gathering-scheduler-prd-v1.md`
- `assets/concept-b-wedding-hero.png`
- `assets/concept-b-wedding-hero-unsplash.jpg`
- `docs/session-handoff-2026-09-05.md`

## Context Monitoring

The local session log stores recent context usage in the latest `token_count` event under `~/.codex/sessions/.../rollout-*.jsonl`.

Current check at handoff creation: approximately 37% (`95,486 / 258,400` input-context tokens). Recheck before continuing; compaction and tool output can change the number.

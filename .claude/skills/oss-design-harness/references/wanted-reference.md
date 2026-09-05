# Wanted (원티드) Reference Design System

<!-- design-md:section experience -->
## 1. Experience

### Visual Theme & Atmosphere

Wanted is a Korean career platform that connects job discovery, company information, career content, and employer services around the idea that every working person should be able to work more like themselves. Its current product is quieter and denser than a campaign page: white surfaces, `#171719` headings, `#333333` body copy, restrained translucent metadata, and `#0066ff` reserved for recognizable actions. The signature visual unit is not a generic elevated card but a job result composed from a 12px media thumbnail, a compact 16px/600 position title, company and location metadata, and generous grid rhythm.

Montage is Wanted's current official product-experience design system. Its 2026 site frames reusable foundations and components as a way to combine individual parts into a consistent, intuitive service, and publishes cross-platform component guidance rather than only a static brand kit. The live product and Montage capture both visibly used Pretendard Variable. Wanted Sans Variable and Pretendard JP Variable were present as declared downloadable faces but had zero visible computed use in the inspected nodes, so this reference keeps their existence as font evidence without rendering either as the current UI family.

**Key Characteristics:**
- `#0066ff` interactive accent on a white product canvas
- Loaded Pretendard Variable with 1,575 visible uses across product and Montage
- 12px image/card geometry, 8px controls, and 16px overlay menus
- Product search dialog captured through safe interaction on four product routes
- Current job-card composition documented separately from Montage primitives

### Do's and Don'ts

### Do
- Reserve `#0066ff` for clear actions and selection meaning.
- Use the verified flat job-card composition for career listings.
- Keep declared fonts separate from visibly used fonts.

### Don't
- Do not render Wanted Sans as current product UI merely because its files are declared.
- Do not invent colored semantic states or filled CTAs from an old snapshot.
- Do not turn every content block into a shadowed 12px card.

### Brand Narrative

Wanted's service story connects career possibility with a concrete browsing and matching workflow. Montage extends that promise internally: separate foundations and components combine into one coherent product experience, emphasizing extensibility, consistency, and efficiency. The current product therefore feels systematic without looking like a component showcase—blue actions and job information carry the experience while decoration stays secondary. The relationship matters because career decisions require both emotional confidence and reliable comparison. Wanted's public product supplies the browsable opportunities, while Montage documents how repeatable interaction patterns keep that information coherent as teams add new features. Typography stays neutral and highly legible so role and company evidence can lead. Brand color marks actions and ownership without turning every listing into campaign content.

### Principles

1. **Help people work more like themselves.** Career choices should remain understandable and user-directed.
2. **Compose consistency from reusable parts.** Follow Montage's published extensibility, consistency, and efficiency framing.
3. **Information leads decoration.** Job role, company, and metadata establish hierarchy before campaign color.
4. **Font truth follows visible use.** A declared asset is not automatically the current UI face.

### Personas

Public surfaces establish task contexts, not verified biographical personas:
- A job seeker comparing role, company, location, and reward information.
- A working professional using search to narrow a new career direction.
- An employer or product maker consulting Wanted's company service or Montage guidance.

Project-specific names, ages, goals, company sizes, and conversion assumptions are intentionally unspecified and must come from the product brief.

<!-- design-md:section foundations -->
## 2. Foundations

<!-- design-md:claim foundations kind=rules-or-constraints lang=en -->
### Color Palette & Roles

- **Primary action** (`#0066ff`): current account/action text across four product surfaces.
- **Heading** (`#171719`): product headings, position titles, and controls.
- **Body** (`#333333`): dominant product list and card copy.
- **Secondary** (`#858688`): the observed 61% metadata color resolved on white.
- **Canvas** (`#ffffff`): page, dialog, and content surface.
- **Subtle surface** (`#f8f8f8`): current secondary product background.
- **Hairline** (`#e8e9ea`): the observed 16% control boundary resolved on white.

The old marketing orange, pink, sky, violet, semantic error/success/warning, and `#f7f7f8` claims were not promoted because the current capture did not establish those roles at the same surface boundary.
<!-- design-md:claim-end -->

### Depth & Elevation

Most current product cards are flat. Controls use an inset 1px translucent boundary, while the captured Montage menu uses a low-opacity two-layer shadow. No generic modal shadow is promoted.

### Motion & Easing

No reusable duration or easing token was established. Dialog/menu expansion proves state change only; it does not authorize a universal motion curve.

**Tier 2 attempts:** getdesign.md/wanted and styles.refero.design search; unavailable as positive evidence

<!-- design-md:section typography-assets -->
## 3. Typography & Assets

### Typography Rules

### Font evidence boundary

| Evidence class | Resolution |
|---|---|
| Official product-use | Montage publishes Wanted's current product typography utilities and scale. |
| Live surface-use | Pretendard Variable loaded/high with 1,575 visible uses across six captured surfaces. |
| Official distributed asset | Montage links font resources; asset licensing must be checked per resource before redistribution. |
| Declared-only | Pretendard JP Variable and Wanted Sans Variable were declared with source files but zero visible use. |
| Evidence boundary | Campaign-only use of Wanted Sans and native-app overrides remain unresolved. |

### Current observed hierarchy

| Role | Size | Weight | Line height | Tracking |
|---|---:|---:|---:|---:|
| Section heading | 22px | 600 | 30px | -0.4268px |
| Job position | 16px | 600 | 24px | 0.0912px |
| Supporting title | 15px | 600 | 22px | 0.144px |
| Product body | 14px | 400 | 20px | normal |
| Metadata | 12px | 500 | 16px | 0.3024px |

Montage's official typography utility documents a broader scale from Display 1 through Caption 2. That published scale is useful system context; the smaller machine token set above contains only roles grounded in this capture.

<!-- design-md:section components-states -->
## 4. Components & States

### Component Stylings

### Current verified components

#### Header account action
- Transparent background, `#0066ff` label, 8px radius
- 1px translucent inset boundary; 7px × 14px padding; 32px height

#### Job filter trigger
- Transparent, `#171719`, 8px radius, 1px translucent inset boundary
- 7px × 11px padding; 36px height; 14px/400

#### Mini job card
- Horizontal 120×90 media with 12px radius and 14px content gap
- Position title 16px/600/24px

#### Directory job card
- 308×205 media thumbnail with 12px radius and 8px bottom margin
- Body uses 0 6px padding and 2px internal gap; position title 16px/600

#### Search dialog
- White full-screen search surface revealed through the current header
- Input `#171719`, 16px/400/24px; `dialog-open` observed on four product routes

#### Montage menu
- 16px radius, 4px gap, subtle two-layer shadow
- Open overlay captured on both Montage surfaces

No filled apply CTA, segmented control, form validation, toast, or native navigation token is promoted without a current matching sample.

### States

The current full-screen search dialog and Montage menu open states were captured. Default product buttons and filters were captured without a safe hover/focus expansion. Error, success, loading, empty, disabled, and application-completion states remain absent.

<!-- design-md:section layout-platforms -->
## 5. Layout & Platforms

### Layout Principles

- Job discovery uses repeatable grid rhythm while the card body itself stays flat.
- Keep 12px media rounding distinct from 8px product controls and 16px overlays.
- Dense metadata belongs below a clear 16px/600 position title.
- Product composition and Montage documentation examples may share foundations but are not interchangeable evidence.

### Responsive Behavior

The inspected product adapts repeated job units and search overlays while retaining the same type and radius hierarchy. Exact breakpoints and native-app navigation behavior were not promoted from these desktop captures.

<!-- design-md:section content-locales -->
## 6. Content & Locales

### Voice & Tone

Wanted's official system language is practical, encouraging, and centered on helping working people become more themselves. Product copy should make the next career action legible without overpromising a match or outcome. Search, filter, and job-detail language should prioritize concrete role, company, location, and process information. Employer-facing or system documentation may be more technical, but should preserve the same directness and respect for the reader's decision. Use direct labels, specific role/company information, and respectful guidance rather than motivational clichés.

<!-- design-md:section governance -->
## 7. Governance

### Agent Prompt Guide

> Build a calm Korean career-discovery surface with a white canvas, `#171719` headings, `#333333` body text, `#0066ff` actions, Pretendard Variable, flat job cards, 12px media, and compact 8px filter controls. Include only observed search-dialog state; omit speculative status colors and native patterns.

<!-- design-md:claim authority kind=evidence-backed-reconstruction lang=en -->
### Authority

This document is an evidence-backed reconstruction, not authority for an unrelated target project.
<!-- design-md:claim-end -->

<!-- design-md:claim application-priority order=prompt-fact,repository-fact,system-contract,reference-inspiration lang=en -->
### Application priority

1. Direct user instructions for the requested scope.
2. Repository facts.
3. This system contract.
4. Reference inspiration.
<!-- design-md:claim-end -->

<!-- design-md:claim unknowns policy=absent-at-smallest-unresolved-boundary lang=en -->
### Unknowns

Omit only the smallest unresolved value or group. Do not replace it with a plausible default.
<!-- design-md:claim-end -->

<!-- design-md:claim changes policy=review-record-validate-before-adoption lang=en -->
### Changes

Record, review, and validate changes before adoption.
<!-- design-md:claim-end -->

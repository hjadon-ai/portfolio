# F004: Visual clarity, refreshed colors, and animated diagrams

- **Status:** Done
- **Branch:** `feature/portfolio-astitva-favicons`
- **Pull request:** Not created

## Goal

Make the portfolio easier to read and scan, with a restrained color scheme, simpler visual hierarchy, and purposeful animated diagrams that explain the existing engineering story.

## Review findings

- `src/styles.css` uses many independent color literals and muted text colors. Several detail, tag, and metadata styles use 9–12px type, making dense sections harder to read.
- Alternating section backgrounds, numbered labels, decorative orbit rings, and repeated badges compete with the content.
- The hero orbit and AI symbol are decorative rather than explanatory. The case studies describe engineering work almost entirely through text.
- F001 already provides keyboard navigation and reduced-motion handling. F002 provides a balanced card grid and separates professional work from Astitva. Preserve these improvements.

These are source-review observations and design recommendations, not a completed contrast audit or evidence of visitor behavior.

## User flow

1. A visitor selects a role and sees a clear headline, readable summary, two primary actions, and a compact engineering diagram.
2. The visitor scans impact and work cards, then opens a case study for detail.
3. In Astitva and AI practice, the visitor uses a diagram to understand the approved engineering themes and human-directed workflow. The same information remains readable with animation paused or disabled.

## In scope

### 1. Color system

Use a light theme with white cards, a pale slate page surface, navy text, and teal actions. Keep color accents limited to primary actions, selection, and diagram emphasis.

| Token | Proposed value | Use |
| --- | --- | --- |
| Page | `#F8FAFC` | Main background |
| Surface | `#FFFFFF` | Cards, menus, dialogs |
| Text | `#0F172A` | Headings and body |
| Secondary text | `#475569` | Supporting copy and metadata |
| Primary | `#0F766E` | Buttons, links, selected states |
| Primary hover | `#115E59` | Hover/active action state |
| Soft accent | `#CCFBF1` | Diagram emphasis and subtle highlights |
| Border | `#CBD5E1` | Decorative dividers |
| Focus | `#6D28D9` | Keyboard focus ring |

- Define CSS variables and apply them consistently, including the local editor's shared controls.
- Verify actual text/control contrast before finalizing colors; darken tokens where necessary. Decorative borders must not be the only cue identifying a control.
- Keep the purple localhost and teal production favicon distinction.
- Use text, icons, or line styles alongside color to distinguish diagram states.

### 2. Readability and simplicity

- Retain the existing locally bundled fonts; body text 16px, supporting text at least 14px, small labels at least 12px. Keep touch controls comfortably sized.
- Use body line height around 1.65 and reading widths around 60–70 characters. Increase case-study detail text from its current 12px size.
- Use a consistent spacing scale and reduce excessive section gaps while preserving clear separation.
- Prefer a neutral page and white cards over multiple unrelated background colors. Limit dark surfaces to one intentional emphasis area, if needed.
- Remove decorative section/card numbering and the hero's `01 / 03` label; preserve meaningful dates, metrics, and content ordering.
- Keep case-study cards concise by showing their existing description and technology tags; detailed approved text remains in the dialog.
- Keep the F002 two-column desktop work grid and single-column mobile grid.
- Preserve existing career summaries and facts; simplify presentation rather than rewriting supported experience.

### 3. Explain through diagrams

Build code-native SVG/HTML diagrams with React and CSS. Use three bounded visuals rather than adding animation to every section:

1. **Hero — engineering practice:** Replace the decorative orbit with a conceptual path: Understand → Design → Build → Review. Caption it “An illustration of engineering practice.” It describes a general process, not a measured delivery result or a claim that every project followed these steps.
2. **Astitva detail — engineering themes:** Show a responsive group of six labeled tiles corresponding to C01–C06: Workspace, Finance integration, Daily priorities, Protected chat, Human-directed Codex workflow, Family sharing. Highlight a tile briefly while its unchanged approved sentence appears alongside it. Do not draw service-to-service arrows, infrastructure boundaries, or a deployment topology that the packet did not approve.
3. **AI practice — human-directed workflow:** Show Specifications → Assisted implementation → Human review as a conceptual illustration next to C05 verbatim. Caption it “Human-directed workflow illustration.” Avoid implying autonomous authorship or proving that every change followed this sequence.

- Keep approved claim sentences in regular HTML and visible without selecting tiles. Tile interaction may highlight the matching text but cannot conceal it or substitute a new factual description.
- Keep professional case-study text and presentation available; do not invent architecture diagrams for those projects in this feature.
- Reuse shared content and the single `astitva` ID. Never copy C01–C06 into a second content store.

### 4. Motion and accessibility

- Use subtle node emphasis and line reveals, without moving labels or text. No parallax, background particles, blinking, rapid pulsing, or animated metric counters.
- Use short initial sequences, no longer than four seconds, that settle into a fully readable static state. Replay is optional and explicitly user-triggered; do not loop automatically.
- Provide an accessible Pause animation control while a sequence is active and a Replay control afterward. Control labels communicate their state.
- Respect `prefers-reduced-motion`: start in the complete static state and suppress animation/replay motion. All content and interactions remain available.
- Pause while a diagram is offscreen or the page is hidden; do not resume a completed sequence automatically.
- Provide text equivalents, descriptive headings/captions, visible focus, and keyboard access to interactive tiles. Decorative SVG paths are hidden from accessibility APIs.

## Out of scope

Dark-mode/theme switching, new fonts or animation libraries, 3D/WebGL, new credentials or metrics, rewriting approved claims, native iOS or notifications claims, unapproved application architecture, backend changes, F003 draft handling, deployment, or publication.

## Wireframe or UI changes

```text
HEADER: H.        section links        role selector / mobile navigation

HERO
Headline + readable summary       Engineering practice diagram
[Explore my work] [Get in touch]   Understand → Design → Build → Review
                                 [Pause / Replay]

IMPACT: four concise metric cards
WORK: two desktop columns / one mobile column

ASTITVA DIALOG
Approved project description + scope qualification
Engineering themes: six responsive tiles
Unchanged approved sentences alongside/below the tiles
[Pause / Replay]        [Close]

AI PRACTICE
Astitva example: C05 verbatim
Specifications → Assisted implementation → Human review
General engineering practice: existing owner-supplied content
```

On mobile, diagrams appear below their associated text and use stacked nodes rather than shrinking labels. Astitva tiles use two columns where readable and one column at narrow widths. No diagram causes horizontal scrolling or obscures the dialog close control.

## API changes

None.

## MongoDB changes

None.

## Architecture decisions

- Keep the frontend-only React/TypeScript/Vite architecture, schemaVersion 1, and local editor gate.
- Use CSS design tokens and a small reusable React diagram component with native SVG/HTML; no new runtime dependency.
- Diagram labels are presentation summaries; approved wording remains the authoritative description. No private paths, snapshot IDs, or internal evidence references enter public UI.
- Store animation state only in component state; animation cannot modify shared portfolio content or saved drafts.
- Preserve native modal focus management. If diagrams add focusable controls to the dialog, update F001's current Close-only Tab handling to cycle through all visible enabled controls, with opener restoration intact.
- Update the local Prepared incorporation record for presentation changes. Feature completion and evidence preparation are separate from publication.

## Acceptance criteria

- The four role views share the same color tokens and readable typography without changes to career facts, credentials, professional featured projects, or role ordering.
- Body/supporting copy meets the proposed sizing targets. Text contrast is at least 4.5:1 for normal text and 3:1 for large text; essential control and focus indicators are clearly distinguishable against adjacent surfaces.
- At 390×844 and 1440×900, cards, diagrams, menus, and dialogs have no horizontal overflow. At 200% browser zoom, content and controls remain readable and usable.
- Decorative numbering and competing backgrounds are reduced; actual metrics/dates remain exact.
- All three diagrams have static text equivalents, readable labels, and a clear relation to their associated copy.
- C01–C06 sentences and qualifications remain unchanged. Diagram edges/captions introduce no unapproved system architecture, deployed capability, productivity, or autonomous-AI claim.
- Animation settles within four seconds; Pause works; Replay is user-triggered; offscreen/hidden-page behavior does not create continuous background animation.
- Reduced-motion users see complete static diagrams with no motion. Keyboard users can operate every diagram control and leave the dialog through Close or Escape with focus restored.
- No diagram controls appear inside the persisted portfolio JSON, and no private evidence material is bundled.
- Existing build succeeds without an added animation runtime dependency.

## Local verification

Implemented after explicit owner approval in this conversation, on `feature/portfolio-astitva-favicons`.

- `npm run build`: passed; `git diff --check`: passed. No new runtime dependency.
- All four roles checked at 1440×900 and 390×844: no horizontal document overflow; body type is 16px. Desktop and mobile screenshots inspected, including the Astitva dialog. Additional 720×450 reflow check passed.
- Measured palette ratios: navy/white 17.85:1; secondary/white 7.58:1; secondary/page 7.24:1; white/teal action 5.47:1; dark teal/soft accent 6.73:1; purple focus/white 7.10:1; control border/white 4.76:1. A DOM audit of rendered text found one low-contrast decorative symbol; its color was corrected to the primary token.
- Hero completion, Replay, and Pause verified in browser. Offscreen AI diagram reports waiting and does not advance until visible.
- Disposable production-preview fixtures checked the JavaScript reduced-motion branch (complete static state, no animation controls, all six theme descriptions present) and simulated document visibility changes (waiting while hidden, playing when visible). Fixtures were removed by the final build. Actual OS preference switching was not performed; reduced-motion CSS was reviewed in source.
- Keyboard Tab reaches theme controls from Close; theme activation exposes selected state and highlights corresponding text; Escape restores the case-study opener. The focus cycle now includes all visible enabled dialog controls.
- Shared claims, qualifications, career/credential content, AI data, professional cases, role references, and featured IDs checked against the previous commit. F004 does not change portfolio JSON. Build contains no private paths or internal evidence references.
- Animation component has no storage writes; production preview omits the editor. The owner's actual browser drafts were not opened or modified.

Remaining manual checks: actual 200% browser zoom (automation shortcut did not change zoom; the narrower viewport check is not a substitute), screen-reader walkthrough, actual OS reduced-motion switching, and a full performance/layout-shift audit. No production deployment verification was performed.

No commit, push, merge, or deployment. F003 remains Proposed.

## Open questions

None. The palette, three diagram concepts, non-looping motion, and factual boundaries above are the recommended design for owner approval.

## Owner approval

Owner explicitly approved F004 and requested implementation in this conversation.

## Owner-requested visual revision

Owner requested looping animation and a different color theme after reviewing the first implementation. This instruction supersedes the original non-looping requirement and navy/teal palette.

- Warm ivory page (`#FBF7F2`), warm white surfaces (`#FFFDF9`), plum text (`#302432`), muted supporting text (`#655463`), plum actions (`#843D68`), rose highlights (`#F4E3ED`), and blue focus rings (`#305F91`). Environment-specific favicon colors remain unchanged.
- Each visible diagram runs a six-second cycle: 4.5 seconds of node emphasis followed by 1.5 seconds in a neutral readable state, then repeats.
- Pause/Resume remain available. Selecting a theme pauses its sequence; Resume clears the manual selection and continues. Offscreen and hidden diagrams pause; reduced-motion views stay static.
- Approved wording, shared content, and persisted drafts remain unchanged.

Revision checks: build and whitespace checks passed; desktop screenshot reviewed; 390px layout has no horizontal overflow; Pause/Resume verified. Palette contrast: #655463/#fffdf9: 6.89:1, #655463/#fbf7f2: 6.56:1, #fffdf9/#843d68: 7.26:1, #305f91/#fffdf9: 6.52:1. Prior verification notes above refer to the original theme/finite animation.

### Simplified animation presentation

Owner requested removal of the “Looping illustration” status and Pause option. Removed the animation control/status row from all diagrams. Loops remain automatic, pause offscreen/when hidden, and remain static for reduced-motion preferences. Theme selection still stops its automatic emphasis to keep the selected text highlighted. This supersedes the previously specified visible Pause/Resume controls.

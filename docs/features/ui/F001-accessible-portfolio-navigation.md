# F001: Accessible dialogs and portfolio navigation

- **Status:** Done
- **Branch:** `feature/portfolio-astitva-favicons`
- **Pull request:** Not created

## Goal

Let visitors navigate role views and case studies reliably using a keyboard, including on mobile-sized screens.

## Review findings

- `src/App.tsx`, `CaseModal`: Escape closes the dialog, but no focus entry, focus containment, background inertness, or focus restoration is implemented. Earlier local keyboard review confirmed focus remained outside the dialog after Tab.
- The role picker exposes expanded state but lacks Escape dismissal and focus restoration.
- `src/styles.css` hides the main navigation below 760px. The mobile-menu button is always hidden and its handler selects roles rather than navigating sections.
- Smooth scrolling is enabled without a reduced-motion override. Sticky-header anchor offsets and a skip link are absent.

## User flow

1. A visitor tabs to Skip to content or opens the role selector.
2. The visitor chooses a role, jumps to Work or another visible section, and opens a case study.
3. Focus enters the dialog; Tab and Shift+Tab stay within it. Escape or Close returns focus to the original case-study button.

## In scope

- Focus entry, containment, restoration, and background inertness for case dialogs.
- Role selector keyboard dismissal, logical tab order, and visible focus.
- A skip link, sticky-header-safe section anchors, and reduced-motion support.
- Compact mobile section navigation distinct from the role selector, showing only sections enabled for the current role.
- Preserve external Astitva links and local editor behavior.

## Out of scope

New portfolio facts, authentication changes, new APIs, deployment, or a full visual redesign.

## Wireframe or UI changes

Mobile header: brand | current role selector | section navigation button.
Section navigation: Work, Experience, Leadership, Skills where visible for the selected role.
Dialog: title | Close, followed by the existing case-study content. No changes to approved claim wording.

## API changes

None.

## MongoDB changes

None.

## Architecture decisions

- Keep the React frontend-only architecture and shared content model.
- Recommend native dialog semantics where supported, with explicit opener restoration and scroll handling. Final choice should preserve current styling and mobile scrolling.
- Do not reinterpret the role selector as section navigation.

## Acceptance criteria

- Keyboard activation opens each case dialog with focus inside it; Tab/Shift+Tab cannot reach the background; Escape and Close restore focus to its opener.
- Selecting a role updates the view and closes its picker. Escape closes the picker and returns focus to its trigger.
- At 390px and 1440px, visitors can reach enabled sections and controls without horizontal overflow.
- Anchor headings are visible below the sticky header; the skip link becomes visible on focus.
- Reduced-motion preference disables smooth scrolling and nonessential transitions.
- Approved Astitva text, role references, featured professional projects, and local editor restrictions remain unchanged.

## Local verification

Implemented locally after owner approval in this conversation, on `feature/portfolio-astitva-favicons`.

- `npm run build`: passed (TypeScript and Vite).
- All four role views checked at 1440×900 and 390×844: one shared Astitva card each; two desktop columns and one mobile column; no horizontal document overflow.
- Keyboard: dialog entry focuses Close; Tab/Shift+Tab remain inside; Escape and Close restore the opener. Role-picker Escape restores its trigger. Skip link focuses content.
- Native modal `:modal` state confirmed; background interaction is blocked by native dialog behavior.
- Mobile navigation shows Work, Experience, Leadership, Skills and the separate Astitva link. Work jump closes navigation, focuses the section, and settles at 85px below a 67px header.
- Desktop and mobile Astitva dialog screenshots inspected; professional Challenge labels retained.
- Reduced-motion CSS and explicit-scroll branches reviewed in source; a simulated reduced-motion runtime check was not performed.
- Dialog accessible naming verified through native dialog markup/DOM; no screen-reader session was performed.
- Approved claim sentences, professional case studies, career content, credentials, AI data, and role references checked against the previous commit; only the approved Astitva context qualifier changed in bundled data. No private filesystem/evidence references found in built HTML/JavaScript.

No commit, push, merge, deployment, or source-application changes performed. F003 remains Proposed.

## Open questions

None. Recommended mobile navigation and dialog behavior are included for owner review.

## Owner approval

Owner explicitly approved F001 and F002 and requested implementation in this conversation.

# F002: Clearer case-study and AI practice presentation

- **Status:** Done
- **Branch:** `feature/portfolio-astitva-favicons`
- **Pull request:** Not created

## Goal

Help visitors distinguish professional delivery from independent engineering work and understand the Astitva case study without repeated or misleading section labels.

## Review findings

- The Selected work intro in `src/App.tsx` mentions only commerce, supply chain, and inventory even though all four roles now include Astitva.
- The Astitva Challenge field repeats its project description rather than stating an approved challenge; its Outcome contains an implementation statement and a verification qualification.
- Four cards render in a three-column desktop grid, leaving one card on a separate row.
- The AI introduction contains approved C05 wording, but does not explicitly name Astitva. Existing owner-supplied tool practices appear alongside it and could be read as Astitva-specific.

## User flow

1. A visitor opens Selected work and sees professional projects and an independent project clearly identified.
2. The visitor opens Astitva and reads its approved description and engineering approaches under accurate labels.
3. The visitor reads AI practice with a clear distinction between the Astitva example and general owner-supplied experience.

## In scope

- Recommended work intro: “Selected professional projects and independent engineering work.”
- Balanced desktop card layout: two columns for four cards, one column on mobile; preserve role-specific order.
- Astitva detail labels: Project context, Engineering approach, and Implemented scope. Keep professional case-study labels unchanged.
- Replace the current repetitive Astitva challenge text with a context qualifier: “Independent personal project. Describes a recorded committed baseline; runtime verification and current deployment availability are not established.” This is scope qualification, not a new capability claim.
- Preserve C01–C06 approved sentences verbatim; preserve the existing outcome qualification and avoid implying deployment from the application link.
- Label the AI introduction as an Astitva example and separate existing owner-supplied general tool practices visually.
- Preserve Copilot certification text and its owner-supplied provenance in the local review record.

## Out of scope

New technical claims, metrics, iOS, notifications, invented challenge/results, new credentials, rewritten career history, changing professional featured projects, or publishing evidence packets.

## Wireframe or UI changes

Selected work: inclusive introduction, followed by an ordered two-column grid on desktop.
Astitva dialog: approved description → Project context → Engineering approach → Implemented scope → existing technology tags.
AI section: Astitva example (C05 verbatim) → General engineering practice (existing owner-supplied text).

## API changes

None.

## MongoDB changes

None.

## Architecture decisions

- Keep the existing CaseStudy schema, shared `astitva` ID, and all four role references. Choose labels by case ID without duplicating case-study content.
- New public wording proposed above requires owner approval through this feature. It does not expand the approved Astitva capability claims.
- Update the separate local incorporation review record when public wording changes; keep private paths and claim/evidence references out of public content.

## Acceptance criteria

- All four roles show Astitva exactly once and preserve existing featuredCaseStudyId values.
- C01–C06 approved sentences remain exact, including owner-scoped, alias-based, PIN-protected, and human-review qualifications.
- Astitva retains its independent-project classification; no team leadership, current deployment, passing-test, autonomous authorship, or productivity claims are added.
- Professional details retain their current labels and wording.
- Four cards form two balanced desktop rows and one mobile column without overflow.
- AI visitors can identify which wording describes Astitva and which practices are owner-supplied general experience.

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

None. The proposed public introduction, context qualifier, labels, and layout are concrete recommendations for approval.

## Owner approval

Owner explicitly approved F001 and F002 and requested implementation in this conversation.

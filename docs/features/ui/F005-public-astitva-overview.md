# F005: Public Astitva engineering overview

- **Status:** Done
- **Branch:** `feature/portfolio-astitva-favicons`
- **Pull request:** Not created

## Goal

Let portfolio visitors explore the approved Astitva engineering story on a readable, shareable page without exposing the local internal report.

## User flow

1. Open the Astitva card or case-study dialog in any role view.
2. Follow the engineering-overview link to `/astitva-engineering`.
3. Browse topic anchors, the human-directed workflow illustration, and shared approved descriptions; return to the portfolio or open the separate application link.

## In scope

- Responsive overview route with a descriptive page title, skip link, topic anchors, scope qualification, shared technology tags, and return navigation.
- C01–C06 content from the existing shared `astitva` CaseStudy; no separate facts store.
- Entry links from the existing card and dialog; preserve all four role references and professional featured projects.
- Reuse the current palette and workflow diagram with its looping/reduced-motion behavior.

## Out of scope

Publishing the internal HTML report, adding unapproved statistics/iOS/notifications claims, embedding private paths or evidence identifiers, source-application modifications, commit/push/deploy.

## Wireframe or UI changes

Portfolio/back navigation → overview title and C01 description → scope qualification → topic index → finance, priorities, chat, human-directed workflow, family sharing → technologies and project links.

## API changes

None.

## MongoDB changes

None.

## Architecture decisions

- Keep frontend-only Vite/React and schemaVersion 1. Resolve the route through the existing application shell, with existing Firebase SPA rewrites.
- Overview descriptions reference shared case-study fields. The internal `docs/portfolio/index.html` remains local and untracked.
- Application URL is separate from the portfolio URL; its presence does not prove deployment of the described capabilities.

## Acceptance criteria

- Astitva card and dialog expose working overview links.
- Direct navigation/reload works locally; the overview has a unique page title and keyboard-accessible navigation.
- All six approved statements and existing scope qualification remain unchanged; no private paths or internal report are bundled.
- Desktop/mobile page fits without horizontal overflow and permits returning to the portfolio.

## Local verification

- `npm run build` passed; whitespace check passed.
- Browser navigation from Back to work → Astitva overview link passed, including Enter activation and direct overview reload.
- Desktop 1440×900 and mobile 390×844 screenshots reviewed; no horizontal overflow at 390px.
- Existing Firebase SPA rewrite inspected; no deployment/runtime verification performed against the hosted site.
- Shared content reused without editing portfolio JSON. Internal report remains outside public assets/build imports.

## Open questions

None.

## Owner authorization

Owner requested reconsideration of the local report link and directly authorized enhancement/implementation in this conversation. Work remains prepared locally, not published.

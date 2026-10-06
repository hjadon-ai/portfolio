# F006: Astitva architecture illustration

- **Status:** Done
- **Branch:** `feature/portfolio-astitva-favicons`
- **Pull request:** Not created

## Goal

Help visitors understand Astitva's engineering concerns through a restrained animated architecture illustration on its public overview, while distinguishing conceptual grouping from a verified deployment or exact runtime topology.

## User flow

1. Open the Astitva engineering overview and find Architecture at a glance below the scope note.
2. Watch a slow highlight sequence move through the workspace stack, finance integration, protected chat, and owner-controlled sharing.
3. Select a concern to highlight its approved description, or follow its existing topic link for detail.

## In scope

- One responsive illustration on `/astitva-engineering`; keep the overview's approved text visible.
- Show the workspace technologies React, Express, MongoDB, and Firebase as a grouped stack rather than asserting network routes between them (C01).
- Show a separate Hosting & delivery references row with Firebase, Render, GitHub, and GitHub Actions, as explicitly requested by the owner. Do not connect these references into a claimed deployment pipeline. Caption: “Provider labels shown for context; deployment status and pipeline connections are not represented.”
- Show three concern groups:
  - Finance: Plaid synchronization, normalized financial data, encrypted provider tokens, isolated runtime environments (C02).
  - Chat: alias/PIN access, server-controlled authorization, Firebase custom tokens, live Firestore delivery (C04).
  - Ownership: owner-scoped daily priorities, atomic capacity enforcement, calendar-aware validation; family relationship/role models and owner-controlled sharing (C03/C06).
- Add a separate human-directed Codex workflow note sourced from C05; do not place Codex in the application runtime.
- Animate emphasis around grouped nodes and concern outlines. Labels stay fixed; no fake telemetry, message streams, counters, or simulated production activity.
- Use association lines without directional arrows. The existing approved packet does not authorize an exact call sequence or deployment topology.
- Public caption: “Conceptual architecture illustration of the recorded project scope; not a live system or deployment view.”
- Reuse shared case-study content for approved descriptions. Do not create a second facts store.
- Keep looping emphasis and the simple presentation requested by the owner: no animation status row or Pause/Resume controls. Motion freezes offscreen or when the page is hidden; reduced-motion users get a complete static diagram.

## Out of scope

Exact REST/Firestore request flows, inferred database ownership, hosting/provider topology, trust-boundary claims beyond approved wording, iOS, notifications, internal evidence references, live bank/user data, new source-application work, or deployment.

A true runtime architecture diagram with directional flows would require a separately reviewed evidence update approving those relationships. This proposal does not treat feature approval as approval of new technical facts.

## Wireframe or UI changes

```text
Architecture at a glance
Conceptual scope caption

Workspace stack: [React] [Express] [MongoDB] [Firebase]

[Finance integration]  [Protected live chat]  [Ownership and sharing]
       association outlines / subtle animated emphasis

Human-directed engineering: specification-driven Codex workflow

Selected concern: unchanged approved description + topic link
```

On mobile, stack the concern groups and preserve full-size labels. All approved text remains available without interaction. The selected concern supplement is optional emphasis, not a substitute for the existing topic sections.

## API changes

None.

## MongoDB changes

None.

## Architecture decisions

- Implement with React, SVG/HTML, CSS tokens, and transient component state. No new animation dependency or schema change.
- Keep factual sentences in regular HTML, with SVG decorative paths hidden from accessibility APIs.
- Buttons have descriptive names and selected-state semantics; color is supplemented by outline/selection markers.
- Add a reusable architecture component rather than expanding the general workflow diagram with project-specific rules.
- Update the separate Prepared review record for public presentation changes; internal report remains local.

## Acceptance criteria

- The overview displays workspace technologies and all three concern groups at desktop/mobile sizes without horizontal overflow.
- Every displayed project fact is an approved sentence or a clearly labeled summary of C01–C06; no unapproved connections, deployment, scale, encryption, or autonomous-AI claims appear.
- Codex is visibly separated from application runtime concerns.
- Looping animation emphasizes groups without moving labels or obscuring readable content.
- Keyboard users select each concern and follow its topic link; no essential information depends on animation.
- Reduced-motion mode is fully static; offscreen/hidden-page motion pauses.
- No persistent draft mutation, private paths, internal packet IDs, or source-application changes.
- Existing portfolio role views, professional featured projects, and build remain intact.

## Local verification

Implemented locally after the owner requested F006 with MongoDB, Firestore, Firebase, Render, GitHub, and GitHub Actions, then asked to finish pending authorized Portfolio work.

- `npm run build` passed (TypeScript and Vite).
- Desktop 1440×900 and mobile 390×844 screenshots reviewed; document width matched each viewport without horizontal overflow.
- Enter selected Finance; Tab reached Chat; Space selected Chat; Enter followed its topic link.
- Local preview rendered all requested labels and retained shared claim wording/qualifications. Console error query returned no errors.
- CSS and React lifecycle inspected for reduced-motion static mode, IntersectionObserver visibility, and document-hidden pause. Reduced motion and hidden-page transitions were not browser-emulated.
- No hosted-site/deployment verification, push, or source-application changes.

## Open questions

None. Recommended first version is a conceptual architecture illustration. Exact runtime data-flow animation is excluded until its relationships receive evidence approval.

## Owner authorization

The owner explicitly requested F006 implementation in this conversation and later requested completion of pending Portfolio work. The hosting/delivery references are context labels, not additional evidence claims. Changes remain Prepared locally, not Published.

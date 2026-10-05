# F003: Browser draft and bundled-content awareness

- **Status:** Proposed
- **Branch:** Not created for this feature
- **Pull request:** Not created

## Goal

Make it clear when a local browser draft differs from the repository's bundled portfolio, and let the owner preview either version without losing edits.

## Review findings

- `src/App.tsx`, `initialData`: any valid stored draft overrides bundled content on the development server, so repository updates can be hidden by an older browser draft.
- The app saves data immediately on mount and does not track which bundled revision a draft was based on.
- The existing restore operation replaces the browser draft; exporting first depends on the owner remembering the warning.
- The production preview already uses bundled content because the editor is development-only. This useful distinction is not prominently explained in the editor.

## User flow

1. The owner starts the development server and opens the local editor using the existing passphrase gate.
2. The editor shows whether the displayed content is a browser draft and whether it differs from the bundled file.
3. The owner previews bundled content without replacing the draft, or exports the draft before explicitly replacing it with the bundled version.

## In scope

- Local-only draft/source status and a non-destructive bundled-content preview.
- Compare current draft content with bundled content; do not call a difference “outdated” unless a stored baseline establishes that.
- Track a bundled-content fingerprint in separate local metadata for future change detection. Existing drafts without metadata are identified as having an unknown baseline.
- Offer export before replacement, plus explicit confirmation of replacement.
- Explain that repository JSON is the deployable source and that `npm run preview` uses the built bundled content.
- Preserve JSON import/export format, the existing passphrase gate, and the current browser draft key or a lossless migration.

## Out of scope

Automatic merging, overwriting drafts on startup, cloud editing, backend storage, publishing approval automation, or exporting credentials/passphrase verifiers.

## Wireframe or UI changes

Editor status: “Browser draft differs from bundled content” with Preview bundled content and Export draft controls.
Bundle preview: “Previewing bundled content” with Return to draft. No editable controls and no draft writes while previewing.
Replace flow: export opportunity → explicit replacement confirmation → updated source status.

## API changes

None.

## MongoDB changes

None.

## Architecture decisions

- Keep comparison and metadata entirely in local browser storage; do not change PortfolioData schemaVersion.
- Use a deterministic fingerprint only to detect changes, not as proof of evidence approval or publication.
- Bundled preview must never trigger the existing draft-persistence effect with bundled preview data.
- No editor controls or draft status should appear in the production build.

## Acceptance criteria

- A pre-existing valid draft survives startup, bundle preview, role switching, and return to draft without content changes.
- Equal content shows no difference notice; differing content is identified accurately; legacy draft baseline is reported as unknown.
- Export preserves the schema and all shared IDs; no passphrase verifier or baseline metadata enters exported public content.
- Replacement requires an explicit owner action; cancel preserves the draft.
- The owner can preview bundled Astitva even when the local draft lacks it.
- Production continues to use bundled content and omit the local editor.

## Local verification

Proposal only; no new storage checks performed. After approval: `npm run build`; isolated browser profile with equal, differing, and legacy drafts; compare draft content before/after preview and cancellation; import/export round trip; inspect production preview for absence of editor controls. Do not clear or replace the owner's actual browser draft during verification.

## Open questions

None. Automatic merging is excluded; comparison, preview, and explicit replacement are the recommended behavior.

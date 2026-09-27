# Harendra Kumar Portfolio

A frontend-only portfolio built from `Harendra_Kumar_Aug-2026.pdf`. One master content file supplies the Master, Solution Architect, Principal / Staff Engineer, and Engineering Manager views.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://127.0.0.1:5173/`). `npm run build` checks TypeScript and creates a static build in `dist/`.

The public copy is deployed to Firebase Hosting at `https://harendra-play.web.app/`. The Astitva link points to `https://astitva-live.web.app/`. To redeploy after editing the bundled JSON, run `npm run build` followed by `firebase deploy --only hosting --project harendra-play`.

## Edit content

1. Open **Edit content** in the header.
2. Edit shared facts under Profile, Achievements, Experience, Case studies, Leadership, Skills, Credentials, and AI practice.
3. Select a role in the header, then use **Role versions** to change its summary, focus, section order, visible entries, entry order, and featured case study. **New view** creates another role presentation from the selected version without copying master entries.
4. Use **View portfolio** to preview. Changes are automatically kept as a draft in this browser.
5. Use **Export JSON** to download the current data. Keep that file as the durable copy. To make it the bundled default for this project, replace `src/data/portfolio.json` with the exported file. **Import JSON** restores an exported copy into the editor.

Browser storage is only a convenience draft. Clearing site data can remove it. There is no login or backend; anyone with access to the local app and files can edit or read the content.

## Content structure

`src/data/portfolio.json` contains shared content with stable IDs plus role configurations that reference those IDs. The role views never copy an experience or case study. Add a master entry first, then enable it in each desired role under **Role versions**.

The source resume is a starting point. Review client names, internal project details, metrics, and certification wording before sharing a copy outside your computer.

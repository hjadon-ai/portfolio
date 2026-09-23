# Web application

## Context

This folder will contain the single-page frontend for the Astitva portfolio.

## Instructions

- Preserve the approved public-page wireframe while adding reviewed behavior.
- Keep the first version small and easy to understand.
- Use React with Vite for the local single-page application.
- The frontend may call backend APIs, but it must not contain backend or database code.
- Work on one reviewed change at a time.

## Current step

Review F008 on the Diet screen: six targets and macro comparison, water intake, reusable Meal Library meals, quantity-scaled daily copies, and CSV preview/import.

## Run locally

1. Start MongoDB and Mailpit.
2. Install dependencies once in this folder and `server/`.
3. From the repository root, run `./scripts/start-local.sh dev` or `./scripts/start-local.sh stage`.
4. Open `http://localhost:3000`.

Vite sends relative `/api` requests to the Express server at `http://127.0.0.1:3001` during local development.

F005 is ready for manual review: Diet is accessible from the verified profile, with meal entry, daily totals, fiber, and editable targets. See `../docs/features/F005-daily-diet-tracking.md` for manual checks.

F006 is ready for manual review: Finance is accessible from the verified profile and uses Plaid Link only for Sandbox account connection. Summary and account pages read synchronized local data. See `../docs/features/F006-personal-finance.md`.

F007 is ready for manual review: authenticated pages show the active profile, and Stage confirms before opening Plaid Production Link. See `../docs/features/F007-local-stage-environment.md`.

F011 is ready for manual review: the React application uses semantic visual tokens, the shared presentation components under `src/ui/`, Lucide icons, and a responsive application shell. Existing feature behavior and API contracts remain unchanged. See `../docs/features/F011-application-visual-system.md`.

F008 is ready for manual review: the existing Diet route contains daily targets, water tracking, manual meals, and an expandable Meal Library. CSV files are sent only to the local Express preview endpoint and are not stored by the browser.

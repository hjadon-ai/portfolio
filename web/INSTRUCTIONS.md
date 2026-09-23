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

Review F006 Personal Finance with the local Express server and Plaid Sandbox.

## Run locally

1. Start MongoDB, Mailpit, and the Express server first.
2. From this folder, run `npm install` once.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Vite sends relative `/api` requests to the Express server at `http://127.0.0.1:3001` during local development.

F005 is ready for manual review: Diet is accessible from the verified profile, with meal entry, daily totals, fiber, and editable targets. See `../docs/features/F005-daily-diet-tracking.md` for manual checks.

F006 is ready for manual review: Finance is accessible from the verified profile and uses Plaid Link only for Sandbox account connection. Summary and account pages read synchronized local data. See `../docs/features/F006-personal-finance.md`.

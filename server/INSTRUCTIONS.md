# Server application

## Context

This folder will contain the Node.js backend for the Astitva portfolio.

## Instructions

- Keep REST APIs, MongoDB connection code, and MongoDB models in this folder.
- MongoDB runs on localhost using the `astitva` database.
- Use Express.js, as approved.
- Keep approved authentication APIs together; add later feature APIs and collections in small reviewed groups.
- Keep the backend separate from the web application.
- Keep a folder for design and keep api definition 
- Keep a postman collection for the ready api with local environment variables

## Current step

Review F006 Personal Finance locally with Plaid Sandbox and localhost MongoDB.

## Run locally

1. Start MongoDB on `localhost:27017`.
2. Start Mailpit with SMTP on `localhost:1025` and its inbox on `http://localhost:8025`.
3. From this folder, run `npm install` once.
4. Run `npm start`.
5. The API is available at `http://localhost:3001`.

For Finance, copy `.env.example` to the ignored `.env` file. Add `PLAID_CLIENT_ID`, the Plaid Sandbox `PLAID_SECRET`, and a 32-byte `FINANCE_TOKEN_ENCRYPTION_KEY` before starting the server. The start command loads `.env` when it exists.

Import the collection and local environment from `design/` into Postman. Postman keeps the HTTP-only login session cookie. Copy tokens from Mailpit links into `verificationToken` or `resetToken` when testing those endpoints directly.

F005 is ready for manual review: Diet is accessible from the verified profile, with meal entry, daily totals, fiber, and editable targets. See `../docs/features/F005-daily-diet-tracking.md` for manual checks.

F006 is ready for manual review: Finance uses Plaid Sandbox for connect/sync and stores the normalized result in local MongoDB. See `../docs/features/F006-personal-finance.md`.

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

Review signup email verification, the unverified-account guidance page, and the existing authenticated profile. No portfolio content API is connected yet.

## Run locally

1. Start MongoDB, Mailpit, and the Express server first.
2. From this folder, run `npm install` once.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Vite sends relative `/api` requests to the Express server at `http://127.0.0.1:3001` during local development.

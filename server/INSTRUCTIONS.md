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

Review the MongoDB-backed authentication endpoints: signup, login, current user, and logout. Portfolio APIs have not been added.

## Run locally

1. Start MongoDB on `localhost:27017`.
2. From this folder, run `npm install` once.
3. Run `npm start`.
4. The API is available at `http://localhost:3001`.

Import the collection and local environment from `design/` into Postman. Run Signup, Login, Current user, and Logout in that order so Postman can reuse the HTTP-only session cookie.

# Server design

## Context

This folder will hold the design documents for the Astitva backend.

## Instructions

- Keep REST API definitions in this folder.
- Keep the Postman collection and its local environment definition here.
- Update the API definition and Postman collection when an API is approved and implemented.
- Document approved groups of related APIs together.
- Keep MongoDB collection designs here only after they are discussed and approved.

## Current step

Review F008 Diet targets, water, Meal Library, and two-step CSV import APIs. `diet.openapi.json`, the root OpenAPI index, both local Postman environments, and the Diet Postman folder include the implemented contracts.

F005 is ready for manual review: Diet is accessible from the verified profile, with meal entry, daily totals, fiber, and editable targets. See `../../docs/features/F005-daily-diet-tracking.md` for manual checks.

F006 is ready for manual review. `finance.openapi.json` defines the Finance endpoints and the Postman collection contains matching local requests.

F007 is ready for manual review. Use `Astitva.dev.postman_environment.json` for Dev and `Astitva.stage.postman_environment.json` for Stage; neither contains provider credentials or access tokens.

F008 is ready for manual review. CSV preview accepts a UTF-8 `.csv` file in the `file` form-data field and never saves during preview. Import confirmation sends selected normalized rows as JSON.

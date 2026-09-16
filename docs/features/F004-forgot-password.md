# F004: Forgot password

- **Status:** Proposed
- **Branch:** Not created
- **Pull request:** Not created

## Goal

Allow a user who has forgotten their password to request a secure reset email and choose a new password.

## User flow

1. The user selects **Forgot password** from the login form.
2. The user submits their email address.
3. The server returns the same confirmation response whether or not the account exists.
4. If the account exists, the server creates a single-use reset token and sends a local email containing a reset link.
5. The user opens the link in the local web application.
6. The user enters and confirms a new password.
7. The web application sends the reset token and new password to the server.
8. The server updates the password hash and invalidates the reset token.
9. The web application returns the user to login with a success message.

## In scope

- Forgot-password link and email form
- Generic forgot-password response to avoid exposing registered emails
- Local password-reset email
- Single-use, expiring reset token
- New-password form with password confirmation
- Password reset API
- Invalidate the reset token after successful use
- Update OpenAPI and Postman documentation

## Out of scope

- Changing a password while already logged in
- Account recovery without email access
- Production email delivery
- Administrative password resets
- Reusing a password-reset token
- Automatically logging in after password reset

## Wireframe or UI changes

- Add **Forgot password?** below the login password field.
- Add a form that accepts an email address.
- Show the same request-confirmation message for every submitted email.
- Add a reset-password view opened by the email link.
- Show success, invalid-token, expired-token, and validation-error states.

## API changes

### Request a password reset

`POST /api/auth/forgot-password`

Request:

```json
{
  "email": "developer@example.com"
}
```

Responses:

- `202`: Always return a generic message such as: `If an account exists, a reset email has been sent.`
- `400`: Email is missing or malformed.
- `429`: Too many reset requests, if request limiting is included.

The response must not reveal whether the email exists.

### Reset the password

`POST /api/auth/reset-password`

Request:

```json
{
  "token": "token-from-reset-link",
  "password": "new-local-password"
}
```

Responses:

- `200`: Password was changed successfully.
- `400`: Token or password is missing or malformed.
- `410`: Token is invalid, expired, or already used.

## MongoDB changes

### `passwordResetTokens`

Add a collection containing:

- `tokenHash`: unique SHA-256 hash of the reset token.
- `userId`: reference to the user.
- `expiresAt`: expiration date with a MongoDB TTL index.
- `createdAt`: creation date.

Only the token hash is stored. The plain token appears only in the local reset link. Creating a new token should invalidate earlier password-reset tokens for that user.

### `users`

The successful reset replaces `passwordHash` and updates `updatedAt`. The plain password is never stored.

### `sessions`

Decide whether all active sessions for the user are deleted after a successful reset.

## Architecture decisions

The following decisions require project-owner approval before implementation:

- Reuse the local email tool selected for F003.
- Password-reset token lifetime.
- Minimum password requirements.
- Whether successful reset invalidates all active sessions.
- Whether request limiting is required for the local version.
- Whether password reset is allowed before email verification.

## Acceptance criteria

- The forgot-password response does not reveal whether an account exists.
- A registered user receives one local reset email.
- The plain reset token is not stored in MongoDB.
- A valid token changes the password once.
- An expired, modified, or used token cannot change the password.
- The old password no longer works after a successful reset.
- The new password works after a successful reset.
- API behavior is documented in OpenAPI and Postman.
- The complete flow runs locally.

## Local verification

Not implemented. Verification steps will be added after the architecture decisions are approved.

## Open questions

1. Should the reset token expire after 15 minutes, 1 hour, or 24 hours?
2. Should a successful reset log the user out of every active session?
3. Should the local version limit how often reset emails can be requested?
4. Should an unverified account be allowed to reset its password?
5. Should the password rule remain a minimum of 8 characters or become stronger?

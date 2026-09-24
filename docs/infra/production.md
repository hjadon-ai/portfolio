# Production deployment guide

This guide prepares the F012 Firebase Hosting, Render, and MongoDB Atlas environment. It does not authorize a deployment. Keep every secret in the provider dashboard and never in Git or Firebase Hosting.

## Architecture

```text
PROJECT_ID.web.app -> SERVICE_NAME.onrender.com -> MongoDB Atlas / SMTP
```

Firebase serves the static `web/dist` build. Render runs Express. Atlas stores only Production data in `astitva_prod`. Finance starts disabled.

## 1. Prepare the application

1. Run the server tests and normal web build.
2. Build the Production web bundle with the final Render origin:

   ```sh
   cd web
   VITE_API_BASE_URL=https://SERVICE_NAME.onrender.com npm run build:production
   ```

3. Confirm `web/dist` contains no Atlas, SMTP, Plaid, session, or encryption secret.

## 2. Prepare MongoDB Atlas

1. Create an empty Atlas deployment and use database `astitva_prod`.
2. Create an application database user with `readWrite` access only to `astitva_prod`.
3. After the Render service exists, copy its outbound CIDR ranges into the Atlas IP access list.
4. Store the `mongodb+srv://` URI as Render's `MONGODB_URL`. Keep TLS enabled. Do not keep `0.0.0.0/0` as the steady-state access rule.

## 3. Prepare email

1. Verify the sender domain with the selected SMTP provider.
2. Store `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` in Render.
3. Keep verification and reset links pointed to `WEB_URL`.

## 4. Create the Render service

Use `render.yaml` and keep automatic deployment disabled. Enter these values in Render:

- `MONGODB_URL`: Atlas URI for `astitva_prod`
- `WEB_URL`: `https://PROJECT_ID.web.app`
- `CORS_ORIGINS`: `https://PROJECT_ID.web.app`
- `INVITED_EMAILS`: comma-separated normalized email addresses
- SMTP values from the email provider

The Blueprint fixes `ASTITVA_ENV=production`, `PLAID_ENABLED=false`, `PLAID_ENV=production`, and the Production cookie name. Do not add Plaid credentials during the core rollout.

When Finance is approved for a later rollout, add `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_REDIRECT_URI`, and a unique `FINANCE_TOKEN_ENCRYPTION_KEY`, then set `PLAID_ENABLED=true`. Add the exact HTTPS redirect URI to the Plaid Dashboard allowlist before deploying that change.

After Render assigns its URL, add all listed Render outbound CIDRs to Atlas, deploy the service manually, and verify `GET /api/health` reports `production`, `cloud`, and Finance disabled.

## 5. Configure Firebase Hosting

From the repository root:

```sh
firebase login
firebase use --add
firebase hosting:channel:deploy review
```

Select the prepared Firebase project. The checked-in `firebase.json` serves `web/dist`, rewrites application routes to `index.html`, and applies cache headers. Preview URLs are separate origins; add the exact active preview origin to Render's `CORS_ORIGINS` only while testing it.

Deploy the live channel only after explicit approval:

```sh
firebase deploy --only hosting
```

## Smoke test

1. `GET /api/health` returns Production and cloud metadata.
2. An email outside `INVITED_EMAILS` cannot create an account or trigger email.
3. An invited email can sign up, verify, log in, reload the page, reset its password, and log out.
4. Profile and Diet read and write only Atlas Production data.
5. Finance explains that it is disabled, and every Finance API returns `503 FINANCE_DISABLED`.
6. A request from an unapproved or missing `Origin` cannot perform `POST`, `PUT`, `PATCH`, or `DELETE` operations.
7. Dev and Stage still start locally and use their original databases and cookies.

Provider domains make the session cookie third-party state. Test login persistence in the intended browser. If the browser blocks it, use sibling custom web and API domains in a separately reviewed infrastructure change.

## Rollback

1. Roll Render back to the last healthy deploy from its deployment history.
2. Roll Firebase Hosting back to the preceding release from the Firebase Hosting release history.
3. Do not delete or overwrite Atlas data during an application rollback.
4. If credentials may have been exposed, rotate them in the owning provider and update Render before redeploying.

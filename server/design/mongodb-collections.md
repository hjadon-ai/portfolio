# MongoDB collections

Databases on local MongoDB port `27017`:

- Dev: `astitva`
- Stage: `astitva_stage`

The application connects to only one database per process. It never copies or queries data across profiles.

## Finance collections (F006)

`financeConnections` stores one Plaid Item per user, provider environment, and institution. It contains `providerEnvironment` (`sandbox` or `production`), provider and institution identifiers, status, incremental transaction cursor, sync timestamps, excluded provider account IDs, and the Plaid access token encrypted with AES-256-GCM. Plaid credentials and each profile's separate encryption key remain in server environment variables. The server rejects a connection whose stored provider environment does not match the running profile before attempting to decrypt its token.

`financeAccounts` stores the normalized current view of each locally tracked account: owner and connection references, provider account ID, display name and mask, type, asset class, original currency, current/available balance, credit limit, and balance timestamp. Full account and routing numbers are never stored.

`financeTransactions` stores normalized Plaid transaction changes by stable provider transaction ID. Each document includes ownership references, provider dates, merchant/display names, amount and currency, expense/income/other direction, personal-finance category, and pending state. Monthly USD spending excludes pending, income, transfers, and loan payments.

`financeHoldings` stores the latest investment positions by account and provider security ID, including display name, ticker, quantity, price, market value, original currency, and price date. Holdings are replaced during each successful connection sync.

Finance collection indexes enforce provider-ID uniqueness within the owner/account boundary and support owner, account, connection, asset-class, and date queries. Disconnecting an institution deletes its four local data groups after Plaid confirms Item removal. Stopping one account records its provider account ID on the connection exclusion list and deletes only that account's local data.

## Diet collections (F005 and F008)

`dietMeals` stores `userId`, `consumedOn` (YYYY-MM-DD), `name`, `mealType`, optional `servingDescription`, and numeric `calories`, `proteinGrams`, `carbohydrateGrams`, `fatGrams`, `fiberGrams`, plus timestamps. F008 adds `source`, optional `sourceLibraryMealId`, and `quantity` as snapshot metadata. A library meal is copied into these fields, so later library edits and deletion do not change history. Index `(userId, consumedOn)` supports private daily queries.

`dietNutritionTargets` stores one unique `userId`, the five nutrition targets, `waterMilliliters`, and timestamps. Existing F005 documents may omit water until the owner saves the enhanced form. Targets apply to all dates, including past dates. Calories and water are whole numbers; grams have at most one decimal place. Meals allow zero; targets must be positive. Daily totals and the 4/4/9 macro comparison are calculated, not persisted.

`dietWaterEntries` stores each intake action with `userId`, `consumedOn`, positive whole-number `amountMilliliters`, and timestamps. Amounts are limited to 5,000 ml per entry. Index `(userId, consumedOn)` supports daily totals and entry deletion.

`dietLibraryMeals` stores private, reusable one-serving meals. Each document has `userId`, display `name`, unique-per-owner `normalizedName`, category, serving description, the five nutrition values, optional ingredients and notes, and timestamps. Indexes on `(userId, normalizedName)` and `(userId, category, name)` support duplicate prevention, listing, filtering, and search. Uploaded CSV data is validated in memory and is never stored as a file or preview document.

## users

Stores local accounts.

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | String | Display name |
| `email` | String | Unique, normalized login email |
| `passwordHash` | String | Bcrypt password hash; the password is never stored |
| `emailVerifiedAt` | Date or null | Time ownership of the email was verified |
| `passwordResetRequestTimestamps` | Date array | Successful reset-email requests retained for the rolling 24-hour limit |
| `createdAt` | Date | Creation time |
| `updatedAt` | Date | Last update time |

## emailVerificationTokens

Stores single-use email verification tokens. Only the SHA-256 hash is stored. Expired records are removed by a MongoDB TTL index.

| Field | Type | Purpose |
| --- | --- | --- |
| `tokenHash` | String | Unique SHA-256 hash of the emailed token |
| `userId` | ObjectId | Reference to the unverified user |
| `expiresAt` | Date | One-hour expiration and TTL field |
| `createdAt` | Date | Creation time |
| `updatedAt` | Date | Last update time |

## sessions

Stores login sessions. Expired records are removed by a MongoDB TTL index.

| Field | Type | Purpose |
| --- | --- | --- |
| `tokenHash` | String | SHA-256 hash of the browser session token |
| `userId` | ObjectId | Reference to the user |
| `expiresAt` | Date | Session expiration and TTL field |
| `createdAt` | Date | Creation time |
| `updatedAt` | Date | Last update time |

## passwordResetTokens

Stores single-use password-reset tokens. Only the SHA-256 hash is stored. Expired records are removed by a MongoDB TTL index.

| Field | Type | Purpose |
| --- | --- | --- |
| `tokenHash` | String | Unique SHA-256 hash of the emailed token |
| `userId` | ObjectId | Reference to the verified user |
| `expiresAt` | Date | One-hour expiration and TTL field |
| `createdAt` | Date | Creation time |
| `updatedAt` | Date | Last update time |

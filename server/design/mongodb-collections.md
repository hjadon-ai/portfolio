# MongoDB collections

Database: `astitva` on `mongodb://127.0.0.1:27017`

## users

Stores local accounts.

| Field | Type | Purpose |
| --- | --- | --- |
| `name` | String | Display name |
| `email` | String | Unique, normalized login email |
| `passwordHash` | String | Bcrypt password hash; the password is never stored |
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

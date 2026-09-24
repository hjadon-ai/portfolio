# MongoDB models

Keep Mongoose models here. Add or change a collection only after documenting its purpose and fields in `server/design`. Finance connections record `providerEnvironment`; each runtime profile uses its own MongoDB database. Daily Priorities embeds at most three items in one owner/date document and enforces a unique owner/date index.

# React source

This folder contains the local React interface. Keep API calls pointed at relative `/api` paths so Vite can proxy them to the Express server on port 3001. Read safe runtime metadata from `/api/health`; never put Plaid credentials or environment switching in the browser.

Use the semantic CSS variables in `styles.css` and shared presentation components in `ui/`. Feature components keep their API calls and business state. Use Lucide as the only icon source, pair important action icons with visible text, and preserve keyboard focus and responsive behavior.

Daily Priorities sends the browser's IANA timezone with each request and keeps date navigation, drafts, mutation refreshes, and stale-response protection inside its feature component.

const value = process.env.VITE_API_BASE_URL?.trim();

if (!value) {
  console.error('VITE_API_BASE_URL is required for a Production build.');
  process.exit(1);
}

let url;
try {
  url = new URL(value);
} catch (_) {
  console.error('VITE_API_BASE_URL must be a valid HTTPS origin.');
  process.exit(1);
}

if (url.protocol !== 'https:' || url.origin === 'null' || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash || /service_name/i.test(url.hostname)) {
  console.error('VITE_API_BASE_URL must be an HTTPS origin without a path, query, or fragment.');
  process.exit(1);
}

console.log(`Production API origin: ${url.origin}`);

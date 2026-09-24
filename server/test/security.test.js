const assert = require('node:assert/strict');
const test = require('node:test');
const { createRateLimit, unsafeOriginGuard } = require('../src/middleware/security');

function responseRecorder() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('Production unsafe requests require an exact approved origin', () => {
  const guard = unsafeOriginGuard({
    isProduction: true,
    corsOrigins: ['https://astitva-example.web.app']
  });
  const blocked = responseRecorder();
  guard({ method: 'POST', get: () => 'https://malicious.example' }, blocked, () => assert.fail('must block'));
  assert.equal(blocked.statusCode, 403);
  assert.equal(blocked.body.code, 'ORIGIN_NOT_ALLOWED');

  let allowed = false;
  guard({ method: 'DELETE', get: () => 'https://astitva-example.web.app' }, responseRecorder(), () => { allowed = true; });
  assert.equal(allowed, true);
});

test('Production rate limits return a stable response after the allowed count', () => {
  const limit = createRateLimit({ max: 1, windowMs: 60000 });
  const request = { ip: '127.0.0.1', app: { locals: { runtime: { isProduction: true } } } };
  limit(request, responseRecorder(), () => {});
  const blocked = responseRecorder();
  limit(request, blocked, () => assert.fail('must block'));
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.code, 'RATE_LIMITED');
});

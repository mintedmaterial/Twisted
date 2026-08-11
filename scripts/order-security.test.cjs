const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174000';
const NOW = new Date('2026-08-03T12:00:00.000Z');

function securityModule() {
  return loadTypeScriptModule('src/lib/order-security.ts');
}

test('customer references use the full attempt identifier and server secret and round-trip through one parser', async () => {
  const security = securityModule();
  const reference = await security.createOrderReference(ATTEMPT_ID, 'reference-secret');

  assert.match(reference, /^TCL-[A-Z2-9]{8}-[A-Z2-9]{4}$/);
  assert.equal(security.parseOrderReference(reference.toLowerCase()), reference);
  assert.equal(security.parseOrderReference('TCL-123E4567-E89B'), null);
  assert.notEqual(
    reference,
    await security.createOrderReference('123e4567-e89b-42d3-a456-426614174001', 'reference-secret'),
  );
  assert.notEqual(reference, await security.createOrderReference(ATTEMPT_ID, 'rotated-secret'));
});

test('order-intent tokens are HMAC signed, expire, and reject any alteration', async () => {
  const security = securityModule();
  const intent = {
    intentId: '123e4567-e89b-42d3-a456-426614174111',
    issuedAt: NOW.getTime(),
    expiresAt: NOW.getTime() + 5 * 60 * 1000,
  };
  const token = await security.createOrderIntentToken(intent, 'intent-secret');

  assert.deepEqual(await security.verifyOrderIntentToken(token, 'intent-secret', NOW.getTime()), intent);
  assert.equal(await security.verifyOrderIntentToken(token, 'other-secret', NOW.getTime()), null);
  assert.equal(await security.verifyOrderIntentToken(`${token}x`, 'intent-secret', NOW.getTime()), null);
  assert.equal(await security.verifyOrderIntentToken(token, 'intent-secret', intent.expiresAt), null);
  assert.deepEqual(await security.verifySignedOrderIntentToken(token, 'intent-secret'), intent);
  assert.equal(await security.verifySignedOrderIntentToken(token, 'other-secret'), null);
});

test('Turnstile validation posts the documented Siteverify contract and accepts only the expected action and hostname', async () => {
  const security = securityModule();
  let captured;
  const fetchImpl = async (url, init) => {
    captured = { url, init, body: JSON.parse(init.body) };
    return Response.json({
      success: true,
      challenge_ts: new Date(NOW.getTime() - 30_000).toISOString(),
      hostname: 'twistedcustomleather.com',
      'error-codes': [],
      action: 'turnstile-spin-v1',
      cdata: '',
      metadata: { ephemeral_id: 'x:test' },
    });
  };

  const result = await security.verifyTurnstile({
    token: 'visitor-token',
    secret: 'turnstile-secret',
    remoteIp: '203.0.113.20',
    allowedHostnames: ['twistedcustomleather.com', 'www.twistedcustomleather.com'],
    now: NOW.getTime(),
    fetchImpl,
  });

  assert.equal(result.ok, true);
  assert.equal(captured.url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers['Content-Type'], 'application/json');
  assert.equal(captured.body.secret, 'turnstile-secret');
  assert.equal(captured.body.response, 'visitor-token');
  assert.equal(captured.body.remoteip, '203.0.113.20');
  assert.match(captured.body.idempotency_key, /^[0-9a-f-]{36}$/);
});

test('Turnstile validation fails closed for provider, action, hostname, age, shape, and transport failures', async () => {
  const security = securityModule();
  const response = (overrides = {}) => Response.json({
    success: true,
    challenge_ts: new Date(NOW.getTime() - 30_000).toISOString(),
    hostname: 'twistedcustomleather.com',
    'error-codes': [],
    action: 'turnstile-spin-v1',
    cdata: '',
    metadata: { ephemeral_id: 'x:test' },
    ...overrides,
  });
  const verify = (fetchImpl, overrides = {}) => security.verifyTurnstile({
    token: 'visitor-token',
    secret: 'turnstile-secret',
    remoteIp: '203.0.113.20',
    allowedHostnames: ['twistedcustomleather.com'],
    now: NOW.getTime(),
    fetchImpl,
    ...overrides,
  });

  assert.equal((await verify(async () => response({ success: false, 'error-codes': ['timeout-or-duplicate'] }))).ok, false);
  assert.equal((await verify(async () => response({ action: 'other-action' }))).ok, false);
  assert.equal((await verify(async () => response({ hostname: 'attacker.example' }))).ok, false);
  assert.equal((await verify(async () => response({ challenge_ts: new Date(NOW.getTime() - 300_001).toISOString() }))).ok, false);
  assert.equal((await verify(async () => new Response('bad gateway', { status: 502 }))).ok, false);
  assert.equal((await verify(async () => { throw new Error('network down'); })).ok, false);
  assert.equal((await verify(async () => response(), { token: 'x'.repeat(2049) })).ok, false);
  assert.equal((await verify(async () => response(), { secret: '' })).ok, false);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const root = path.resolve(__dirname, '..');
const security = loadTypeScriptModule('src/lib/order-security.ts');

function loadRouteModule(relativeFile, mocks, moduleCache = new Map()) {
  const absoluteFile = path.resolve(root, relativeFile);
  if (!fs.existsSync(absoluteFile)) throw new Error(`Unable to resolve route module: ${relativeFile}`);
  if (moduleCache.has(absoluteFile)) return moduleCache.get(absoluteFile).exports;
  const module = { exports: {} };
  moduleCache.set(absoluteFile, module);
  const javascript = ts.transpileModule(fs.readFileSync(absoluteFile, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: absoluteFile,
  }).outputText;
  const localRequire = (request) => {
    if (Object.hasOwn(mocks, request)) return mocks[request];
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(absoluteFile), request);
      const candidate = [base, `${base}.ts`, path.join(base, 'index.ts')].find(fs.existsSync);
      if (!candidate) throw new Error(`Unable to resolve route dependency: ${request}`);
      return loadRouteModule(path.relative(root, candidate), mocks, moduleCache);
    }
    return require(request);
  };
  new vm.Script(`(function (exports, module, require) {\n${javascript}\n})`, { filename: absoluteFile })
    .runInThisContext()(module.exports, module, localRequire);
  return module.exports;
}

let runtimeEnv;
const routeMocks = {
  '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: runtimeEnv }) },
};

function request(body = JSON.stringify({ token: 'visitor-turnstile-token' }), headers = {}) {
  return new Request('https://twistedcustomleather.com/api/order-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
      'CF-Connecting-IP': '203.0.113.20',
      ...headers,
    },
    body,
  });
}

function passingProvider() {
  return Response.json({
    success: true,
    challenge_ts: new Date().toISOString(),
    hostname: 'twistedcustomleather.com',
    'error-codes': [],
    action: 'turnstile-spin-v1',
    cdata: '',
    metadata: { ephemeral_id: 'x:test' },
  });
}

test('order-intent route rate limits before parsing and before Siteverify or R2', async () => {
  const { POST } = loadRouteModule('src/app/api/order-intent/route.ts', routeMocks);
  const calls = [];
  runtimeEnv = {
    ORDER_INTENT_RATE_LIMITER: { limit: async (input) => { calls.push(['limit', input]); return { success: false }; } },
    ORDER_ASSETS: { put: async () => calls.push(['put']) },
    TURNSTILE_SECRET_KEY: 'turnstile-secret',
    ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
    TURNSTILE_ALLOWED_HOSTNAMES: 'twistedcustomleather.com',
  };
  const originalFetch = global.fetch;
  global.fetch = async () => { calls.push(['fetch']); return passingProvider(); };
  try {
    const body = '{not-json';
    const response = await POST(request(body));
    assert.equal(response.status, 429);
    assert.deepEqual(calls, [['limit', { key: 'order-intent:203.0.113.20' }]]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('order-intent route validates Siteverify and stores only short-lived non-PII state', async () => {
  const { POST } = loadRouteModule('src/app/api/order-intent/route.ts', routeMocks);
  const puts = [];
  runtimeEnv = {
    ORDER_INTENT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ORDER_ASSETS: { put: async (...args) => { puts.push(args); return { etag: 'intent-etag' }; } },
    TURNSTILE_SECRET_KEY: 'turnstile-secret',
    ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
    TURNSTILE_ALLOWED_HOSTNAMES: 'twistedcustomleather.com,www.twistedcustomleather.com',
  };
  const originalFetch = global.fetch;
  global.fetch = async () => passingProvider();
  try {
    const response = await POST(request());
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(puts.length, 1);
    assert.match(puts[0][0], /^order-intents\/[0-9a-f-]{36}\.json$/);
    const stored = JSON.parse(puts[0][1]);
    assert.deepEqual(Object.keys(stored).sort(), [
      'checkoutAttemptId', 'checkoutFingerprint', 'checkoutLeaseExpiresAt', 'checkoutOwnerId',
      'checkoutState', 'expiresAt', 'intentId', 'issuedAt', 'uploadKeys', 'version',
    ]);
    assert.equal(stored.version, 2);
    assert.equal(stored.checkoutState, 'available');
    assert.equal(stored.checkoutAttemptId, null);
    assert.equal(stored.checkoutFingerprint, null);
    assert.equal(stored.checkoutOwnerId, null);
    assert.equal(stored.checkoutLeaseExpiresAt, null);
    assert.deepEqual(stored.uploadKeys, []);
    assert.equal(JSON.stringify(stored).includes('203.0.113.20'), false);
    assert.equal(puts[0][2].onlyIf.etagDoesNotMatch, '*');
    const claims = await security.verifyOrderIntentToken(payload.orderIntentToken, 'intent-secret');
    assert.equal(claims.intentId, stored.intentId);
    assert.equal(claims.expiresAt, stored.expiresAt);
  } finally {
    global.fetch = originalFetch;
  }
});

test('order-intent route rejects missing or oversized framing before provider work', async () => {
  const { POST } = loadRouteModule('src/app/api/order-intent/route.ts', routeMocks);
  let calls = 0;
  runtimeEnv = {
    ORDER_INTENT_RATE_LIMITER: { limit: async () => { calls += 1; return { success: true }; } },
  };
  const noLength = request(undefined, { 'Content-Length': '' });
  noLength.headers.delete('Content-Length');
  const wrongType = request(undefined, { 'Content-Type': 'text/plain' });
  const oversized = request(undefined, { 'Content-Length': '4097' });

  assert.equal((await POST(noLength)).status, 411);
  assert.equal((await POST(wrongType)).status, 415);
  assert.equal((await POST(oversized)).status, 413);
  assert.equal(calls, 0);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const root = path.resolve(__dirname, '..');
const assets = loadTypeScriptModule('src/lib/order-assets.ts');
const checkout = loadTypeScriptModule('src/lib/custom-order-checkout.ts');
const security = loadTypeScriptModule('src/lib/order-security.ts');
const ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174000';
const INTENT_ID = '123e4567-e89b-42d3-a456-426614174111';
const PHOTO_KEY = `order-uploads/${INTENT_ID}/22222222-2222-4222-8222-222222222222.jpg`;
let intentClaims;
let intentToken;
let expectedOrderReference;

test.before(async () => {
  const now = Date.now();
  intentClaims = { intentId: INTENT_ID, issuedAt: now, expiresAt: now + 300_000 };
  intentToken = await security.createOrderIntentToken(intentClaims, 'intent-secret');
  expectedOrderReference = await security.createOrderReference(ATTEMPT_ID, 'reference-secret');
});

function manifestKey(environment = 'sandbox') {
  return `order-manifests/${environment}/${ATTEMPT_ID}.json`;
}

function providerContext(overrides = {}) {
  return {
    environment: 'sandbox',
    locationId: 'sandbox-location',
    requestOrigin: 'https://twistedcustomleather.com',
    ...overrides,
  };
}

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
    const basePath = request.startsWith('@/')
      ? path.resolve(root, 'src', request.slice(2))
      : request.startsWith('.')
        ? path.resolve(path.dirname(absoluteFile), request)
        : null;
    if (basePath) {
      const candidate = [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, 'index.ts')]
        .find((file) => fs.existsSync(file));
      if (!candidate) throw new Error(`Unable to resolve route dependency: ${request}`);
      return loadRouteModule(path.relative(root, candidate), mocks, moduleCache);
    }
    return require(request);
  };
  const execute = new vm.Script(
    `(function (exports, module, require) {\n${javascript}\n})`,
    { filename: absoluteFile },
  ).runInThisContext();
  execute(module.exports, module, localRequire);
  return module.exports;
}

let runtimeEnv;
const routeMocks = {
  '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: runtimeEnv }) },
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
};

const { POST } = loadRouteModule('src/app/api/checkout/route.ts', routeMocks);

function walletCustomization() {
  return {
    walletStyle: 'Bifold',
    primaryColor: 'Saddle tan',
    leatherMaterial: 'Cowhide',
    toolingDesign: 'Oak leaves',
  };
}

function input(overrides = {}) {
  return {
    checkoutAttemptId: ATTEMPT_ID,
    productId: 'custom-wallet',
    customization: walletCustomization(),
    upgradeIds: ['gator'],
    referenceId: 'wallet-set',
    referenceImages: [],
    customerName: 'Connie Customer',
    email: 'connie@example.com',
    phone: '555-0100',
    notes: 'Please call first.',
    acknowledgedStartingPrice: true,
    ...overrides,
  };
}

async function request(
  body = input(),
  url = 'https://twistedcustomleather.com/api/checkout',
  authorizationToken = intentToken,
) {
  const serialized = JSON.stringify(body);
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(serialized)),
      'CF-Connecting-IP': '203.0.113.20',
      Authorization: `Bearer ${authorizationToken}`,
    },
    body: serialized,
  });
}

function makeBucket({ photo = null, events = [], onPhotoHead, onPutAttempt, onIntentPutAttempt } = {}) {
  const puts = [];
  const putAttempts = [];
  const deletes = [];
  const heads = [];
  const gets = [];
  const objects = new Map();
  let etagSequence = 0;
  let intentEtagSequence = 0;

  objects.set(`order-intents/${INTENT_ID}.json`, {
    key: `order-intents/${INTENT_ID}.json`,
    body: JSON.stringify({
      version: 2,
      ...intentClaims,
      uploadKeys: photo ? [PHOTO_KEY] : [],
      checkoutState: 'available',
      checkoutAttemptId: null,
      checkoutFingerprint: null,
      checkoutOwnerId: null,
      checkoutLeaseExpiresAt: null,
    }),
    options: {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { recordType: 'order-intent', expiresAt: String(intentClaims?.expiresAt) },
    },
    etag: 'intent-etag-0',
  });

  function r2Object(stored, withBody = false) {
    return {
      key: stored.key,
      etag: stored.etag,
      httpEtag: `\"${stored.etag}\"`,
      httpMetadata: stored.options.httpMetadata,
      customMetadata: stored.options.customMetadata,
      ...(withBody ? {
        text: async () => stored.body,
        json: async () => JSON.parse(stored.body),
      } : {}),
    };
  }

  return {
    puts,
    putAttempts,
    deletes,
    heads,
    gets,
    objects,
    seed: (key, body, { etag = 'seed-etag', options = {} } = {}) => {
      objects.set(key, {
        key,
        body: JSON.stringify(body),
        options: {
          httpMetadata: { contentType: 'application/json' },
          customMetadata: { recordType: 'custom-order-manifest' },
          ...options,
        },
        etag,
      });
    },
    bucket: {
      head: async (key) => {
        heads.push(key);
        if (key === PHOTO_KEY) {
          await onPhotoHead?.();
          return photo;
        }
        const stored = objects.get(key);
        return stored ? r2Object(stored) : null;
      },
      get: async (key) => {
        gets.push(key);
        if (key === PHOTO_KEY && photo) {
          return {
            key,
            etag: 'photo-etag',
            body: photo.body ?? 'temporary-image',
            httpMetadata: photo.httpMetadata,
            customMetadata: photo.customMetadata,
          };
        }
        const stored = objects.get(key);
        return stored ? r2Object(stored, true) : null;
      },
      put: async (key, body, options) => {
        if (key.startsWith('order-intents/')) {
          const existing = objects.get(key);
          if (await onIntentPutAttempt?.({ key, body: String(body), options }, { existing, objects }) === false) return null;
          if (options?.onlyIf?.etagMatches && existing?.etag !== options.onlyIf.etagMatches) return null;
          const stored = { key, body: String(body), options, etag: `intent-etag-${++intentEtagSequence}` };
          objects.set(key, stored);
          return r2Object(stored);
        }
        if (key.startsWith('order-assets/')) {
          const stored = { key, body, options, etag: `etag-${++etagSequence}` };
          objects.set(key, stored);
          puts.push({ key, body, options });
          events.push(`put:${key}:attached`);
          return r2Object(stored);
        }
        const attempt = { key, body: String(body), options };
        putAttempts.push(attempt);
        const existing = objects.get(key);
        if (await onPutAttempt?.(attempt, { existing, objects }) === false) return null;
        if (options?.onlyIf?.etagDoesNotMatch === '*' && existing) return null;
        if (options?.onlyIf?.etagMatches && existing?.etag !== options.onlyIf.etagMatches) return null;
        const parsed = JSON.parse(String(body));
        events.push(`put:${key}:${parsed.checkoutState ?? 'legacy'}`);
        puts.push({ key, body, options });
        const stored = {
          key,
          body: String(body),
          options,
          etag: `etag-${++etagSequence}`,
        };
        objects.set(key, stored);
        return r2Object(stored);
      },
      delete: async (key) => {
        events.push(`delete:${key}`);
        deletes.push(key);
        objects.delete(key);
      },
    },
  };
}

async function waitUntil(predicate, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for test condition.');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function sandboxEnv(bucket, overrides = {}) {
  return {
    SQUARE_ENVIRONMENT: 'sandbox',
    SQUARE_SANDBOX_ACCESS_TOKEN: 'sandbox-token',
    SQUARE_SANDBOX_LOCATION_ID: 'sandbox-location',
    ORDER_ASSET_TOKEN_SECRET: 'route-secret',
    ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
    ORDER_REFERENCE_SECRET: 'reference-secret',
    ORDER_CHECKOUT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ORDER_ASSETS: bucket,
    ...overrides,
  };
}

async function makeSeedManifest({
  context = providerContext(),
  checkoutState = 'pending',
  leaseExpiresAt = Date.now() - 1,
  ownerId = '33333333-3333-4333-8333-333333333333',
  checkoutUrl,
} = {}) {
  const now = new Date('2026-08-03T12:00:00.000Z');
  const order = checkout.validateCheckoutRequest(input(), now);
  order.orderReference = await security.createOrderReference(ATTEMPT_ID, 'reference-secret');
  const recordToken = await assets.createAssetToken(manifestKey(context.environment), 'route-secret');
  const body = JSON.stringify({
    idempotency_key: ATTEMPT_ID,
    description: 'Twisted Custom Leather website custom order',
    quick_pay: {
      name: 'Twisted Custom Leather Custom Order',
      price_money: { amount: order.total * 100, currency: 'USD' },
      location_id: context.locationId,
    },
    checkout_options: {
      redirect_url: `${context.requestOrigin}/checkout/success?ref=${order.orderReference}`,
      ask_for_shipping_address: true,
    },
    payment_note: checkout.makePaymentNote(
      order,
      `${context.requestOrigin}/api/order-assets/${recordToken}`,
    ),
  });
  const payloadFingerprint = await checkout.createOrderPayloadFingerprint(order, [], context, {
    contractVersion: 4,
    endpoint: `${context.environment === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'}/v2/online-checkout/payment-links`,
    apiVersion: '2026-05-20',
    body,
  });
  return {
    version: 3,
    checkoutState,
    payloadFingerprint,
    ownerId,
    leaseExpiresAt,
    providerContext: context,
    ...(checkoutUrl ? { checkoutUrl } : {}),
    checkoutAttemptId: order.checkoutAttemptId,
    orderReference: order.orderReference,
    createdAt: now.toISOString(),
    product: { id: order.product.id, name: order.product.name, startingAmount: order.product.amount },
    customization: { ...order.customization },
    upgrades: order.upgrades.map(({ id, label, amount }) => ({ id, label, amount })),
    ...(order.galleryReferenceId ? { galleryReferenceId: order.galleryReferenceId } : {}),
    referenceImages: [],
    contact: { customerName: order.customerName, email: order.email, phone: order.phone },
    notes: order.notes,
    deliveryWindow: order.deliveryWindow,
    total: order.total,
  };
}

function productionEnv(bucket) {
  return {
    SQUARE_ENVIRONMENT: 'production',
    SQUARE_PRODUCTION_ACCESS_TOKEN: 'production-token',
    SQUARE_PRODUCTION_LOCATION_ID: 'production-location',
    ORDER_ASSET_TOKEN_SECRET: 'route-secret',
    ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
    ORDER_REFERENCE_SECRET: 'reference-secret',
    ORDER_CHECKOUT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ORDER_ASSETS: bucket,
  };
}

function trustedTemporaryPhoto(originalName = 'photo.jpg') {
  return {
    httpMetadata: { contentType: 'image/jpeg' },
    customMetadata: {
      recordType: 'temporary-order-upload',
      intentId: INTENT_ID,
      originalName,
    },
  };
}

function paymentLinkResponse(url = 'https://square.example/pay/custom-order') {
  return Response.json({ payment_link: { long_url: url } });
}

test('checkout requires a signed intent and rate limits visitor plus intent before JSON parsing', async () => {
  const storage = makeBucket();
  const rateKeys = [];
  runtimeEnv = sandboxEnv(storage.bucket, {
    ORDER_CHECKOUT_RATE_LIMITER: {
      limit: async ({ key }) => { rateKeys.push(key); return { success: false }; },
    },
  });
  const invalidBody = '{not-json';
  const response = await POST(new Request('https://twistedcustomleather.com/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(invalidBody)),
      'CF-Connecting-IP': '203.0.113.20',
      Authorization: `Bearer ${intentToken}`,
    },
    body: invalidBody,
  }));

  assert.equal(response.status, 429);
  assert.deepEqual(rateKeys, [`order-checkout:203.0.113.20:${INTENT_ID}`]);
  assert.equal(storage.puts.length, 0);
});

test('sandbox checkout verifies photos, writes a private manifest first, and sends the exact Square contract', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const events = [];
  const photo = trustedTemporaryPhoto('../../trusted sketch.exe');
  const storage = makeBucket({ photo, events });
  runtimeEnv = sandboxEnv(storage.bucket);
  const token = await assets.createAssetToken(PHOTO_KEY, 'route-secret');
  const calls = [];
  global.fetch = async (...args) => {
    events.push('square');
    calls.push(args);
    return paymentLinkResponse();
  };

  const response = await POST(await request(input({
    referenceImages: [{ name: 'untrusted-name.png', url: `/api/order-assets/${token}`, contentType: 'image/jpeg' }],
  })));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    checkoutUrl: 'https://square.example/pay/custom-order',
    orderReference: expectedOrderReference,
  });
  assert.deepEqual(storage.heads, [PHOTO_KEY]);
  const manifestPuts = storage.puts.filter(({ key }) => key === manifestKey());
  const attachedKey = assets.createAttachedReferenceKey(ATTEMPT_ID, PHOTO_KEY);
  const attachedToken = await assets.createAssetToken(attachedKey, 'route-secret');
  assert.equal(storage.puts.length, 4);
  assert.deepEqual(events, [
    `put:${manifestKey()}:pending`,
    `put:${manifestKey()}:pending`,
    `put:${attachedKey}:attached`,
    'square',
    `put:${manifestKey()}:completed`,
    `delete:${PHOTO_KEY}`,
  ]);
  assert.deepEqual(manifestPuts[0].options.onlyIf, { etagDoesNotMatch: '*' });
  assert.deepEqual(manifestPuts[1].options.onlyIf, { etagMatches: 'etag-1' });
  assert.match(manifestPuts[0].options.customMetadata.payloadFingerprint, /^[0-9a-f]{64}$/);
  assert.match(manifestPuts[0].options.customMetadata.ownerId, /^[0-9a-f-]{36}$/);
  assert.equal(manifestPuts[0].options.customMetadata.checkoutState, 'pending');
  assert.equal(manifestPuts[1].options.customMetadata.checkoutState, 'pending');
  assert.equal(manifestPuts[2].options.customMetadata.checkoutState, 'completed');
  const manifest = JSON.parse(manifestPuts[0].body);
  const renewedManifest = JSON.parse(manifestPuts[1].body);
  const completedManifest = JSON.parse(manifestPuts[2].body);
  assert.equal(manifest.version, 3);
  assert.equal(manifest.checkoutState, 'pending');
  assert.deepEqual(manifest.providerContext, providerContext());
  assert.ok(manifest.leaseExpiresAt > Date.now());
  assert.ok(renewedManifest.leaseExpiresAt >= manifest.leaseExpiresAt);
  assert.equal(completedManifest.checkoutState, 'completed');
  assert.equal(completedManifest.checkoutUrl, 'https://square.example/pay/custom-order');
  assert.equal(completedManifest.payloadFingerprint, manifest.payloadFingerprint);
  assert.equal(completedManifest.ownerId, manifest.ownerId);
  assert.equal(manifest.orderReference, expectedOrderReference);
  assert.equal(manifest.product.id, 'custom-wallet');
  assert.equal(manifest.total, 190);
  assert.equal(manifest.galleryReferenceId, 'wallet-set');
  assert.deepEqual(manifest.referenceImages, [{
    key: attachedKey,
    name: 'trusted sketch.jpg',
    contentType: 'image/jpeg',
    url: `https://twistedcustomleather.com/api/order-assets/${attachedToken}`,
  }]);
  assert.notEqual(manifest.deliveryWindow, 'Tomorrow');

  assert.equal(calls.length, 1);
  const [squareUrl, squareOptions] = calls[0];
  assert.equal(squareUrl, 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links');
  assert.deepEqual({ method: squareOptions.method, headers: squareOptions.headers }, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer sandbox-token',
      'Square-Version': '2026-05-20',
      'Content-Type': 'application/json',
    },
  });
  const squareBody = JSON.parse(squareOptions.body);
  const manifestToken = await assets.createAssetToken(manifestKey(), 'route-secret');
  assert.deepEqual(squareBody, {
    idempotency_key: ATTEMPT_ID,
    description: 'Twisted Custom Leather website custom order',
    quick_pay: {
      name: 'Twisted Custom Leather Custom Order',
      price_money: { amount: 19000, currency: 'USD' },
      location_id: 'sandbox-location',
    },
    checkout_options: {
      redirect_url: `https://twistedcustomleather.com/checkout/success?ref=${expectedOrderReference}`,
      ask_for_shipping_address: true,
    },
    payment_note: `Order: ${expectedOrderReference} | Inspiration: wallet-set | Private record: https://twistedcustomleather.com/api/order-assets/${manifestToken} | Item: Custom Wallet / Total: $190`,
  });
  assert.ok([...squareBody.payment_note].length <= 500);
  assert.match(squareBody.payment_note, /wallet-set/);
  assert.match(squareBody.payment_note, /Private record: https:\/\/twistedcustomleather\.com\/api\/order-assets\//);
  assert.doesNotMatch(squareBody.payment_note, /connie@example|trusted sketch|Oak leaves/);
});

test('slow photo verification cannot make the first claim lease stale', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  t.after(() => {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
  });
  let clock = previousDateNow();
  Date.now = () => clock;
  const token = await assets.createAssetToken(PHOTO_KEY, 'route-secret');
  const storage = makeBucket({
    photo: trustedTemporaryPhoto('slow sketch.jpg'),
    onPhotoHead: () => { clock += 60_000; },
  });
  runtimeEnv = sandboxEnv(storage.bucket);
  global.fetch = async () => paymentLinkResponse();

  const response = await POST(await request(input({
    referenceImages: [{ name: 'sketch.jpg', url: `/api/order-assets/${token}`, contentType: 'image/jpeg' }],
  })));
  const firstClaim = storage.puts.find(({ options }) => options.onlyIf?.etagDoesNotMatch === '*');

  assert.equal(response.status, 200);
  assert.ok(firstClaim);
  assert.equal(JSON.parse(firstClaim.body).leaseExpiresAt, clock + 15_000);
});

test('checkout renews its pending lease with CAS immediately before Square and completes with the renewed ETag', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const events = [];
  const storage = makeBucket({ events });
  runtimeEnv = sandboxEnv(storage.bucket);
  let providerSnapshot;
  global.fetch = async () => {
    const stored = storage.objects.get(manifestKey());
    providerSnapshot = {
      etag: stored.etag,
      manifest: JSON.parse(stored.body),
      now: Date.now(),
    };
    return paymentLinkResponse();
  };

  const response = await POST(await request());
  const successfulStates = storage.puts.map(({ body }) => JSON.parse(body).checkoutState);
  const completionAttempt = storage.putAttempts.find(({ body }) => JSON.parse(body).checkoutState === 'completed');

  assert.equal(response.status, 200);
  assert.deepEqual(successfulStates, ['pending', 'pending', 'completed']);
  assert.deepEqual(events, [
    `put:${manifestKey()}:pending`,
    `put:${manifestKey()}:pending`,
    'put:' + manifestKey() + ':completed',
  ]);
  assert.equal(providerSnapshot.manifest.checkoutState, 'pending');
  assert.ok(providerSnapshot.manifest.leaseExpiresAt > providerSnapshot.now);
  assert.deepEqual(completionAttempt.options.onlyIf, { etagMatches: providerSnapshot.etag });
});

test('a failed takeover CAS rechecks the current lease clock before its next claim', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  t.after(() => {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
  });
  const baseTime = previousDateNow();
  let clock = baseTime;
  Date.now = () => clock;
  const abandoned = await makeSeedManifest({ leaseExpiresAt: baseTime - 1 });
  let replacedDuringFirstCas = false;
  const storage = makeBucket({
    onPutAttempt: ({ options }, { existing, objects }) => {
      if (options.onlyIf?.etagMatches === 'seed-etag' && !replacedDuringFirstCas) {
        replacedDuringFirstCas = true;
        const concurrentPending = {
          ...abandoned,
          ownerId: '44444444-4444-4444-8444-444444444444',
          leaseExpiresAt: baseTime + 30_000,
        };
        objects.set(manifestKey(), {
          ...existing,
          body: JSON.stringify(concurrentPending),
          etag: 'concurrent-etag',
        });
        clock = baseTime + 60_000;
        return false;
      }
      return true;
    },
  });
  storage.seed(manifestKey(), abandoned);
  runtimeEnv = sandboxEnv(storage.bucket);
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse('https://square.example/pay/fresh-cas-clock');
  };

  const response = await POST(await request());
  const successfulTakeover = storage.puts.find(({ options }) => (
    options.onlyIf?.etagMatches === 'concurrent-etag'
  ));

  assert.equal(response.status, 200);
  assert.equal(fetchCount, 1);
  assert.ok(successfulTakeover);
  assert.equal(JSON.parse(successfulTakeover.body).leaseExpiresAt, clock + 15_000);
});

test('production checkout uses only the production origin, credentials, and location', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = productionEnv(storage.bucket);
  const calls = [];
  global.fetch = async (...args) => {
    calls.push(args);
    return paymentLinkResponse();
  };

  const response = await POST(await request());

  assert.equal(response.status, 200);
  assert.equal(calls[0][0], 'https://connect.squareup.com/v2/online-checkout/payment-links');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer production-token');
  assert.equal(JSON.parse(calls[0][1].body).quick_pay.location_id, 'production-location');
});

test('invalid or cross-environment Square configuration fails closed before storage or fetch', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse();
  };

  for (const invalidEnv of [
    { SQUARE_ENVIRONMENT: 'staging', SQUARE_ACCESS_TOKEN: 'legacy', SQUARE_LOCATION_ID: 'legacy' },
    { SQUARE_ENVIRONMENT: 'sandbox', SQUARE_PRODUCTION_ACCESS_TOKEN: 'wrong', SQUARE_PRODUCTION_LOCATION_ID: 'wrong' },
  ]) {
    const storage = makeBucket();
    runtimeEnv = {
      ...invalidEnv,
      ORDER_ASSET_TOKEN_SECRET: 'route-secret',
      ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
      ORDER_REFERENCE_SECRET: 'reference-secret',
      ORDER_CHECKOUT_RATE_LIMITER: { limit: async () => ({ success: true }) },
      ORDER_ASSETS: storage.bucket,
    };
    const response = await POST(await request());
    assert.equal(response.status, 500);
    assert.equal(storage.puts.length, 0);
  }
  assert.equal(fetchCount, 0);
});

test('pre-provider manifest tombstone CAS misses and exceptions are explicitly observable', async (t) => {
  const previousFetch = global.fetch;
  const previousWarn = console.warn;
  const warnings = [];
  console.warn = (message) => { warnings.push(JSON.parse(String(message))); };
  t.after(() => {
    global.fetch = previousFetch;
    console.warn = previousWarn;
  });
  let fetchCount = 0;
  global.fetch = async () => { fetchCount += 1; return paymentLinkResponse(); };

  for (const failureMode of ['cas_miss', 'exception']) {
    let pendingIntentWrites = 0;
    const storage = makeBucket({
      onIntentPutAttempt: ({ body }) => {
        if (JSON.parse(body).checkoutState === 'pending') {
          pendingIntentWrites += 1;
          if (pendingIntentWrites >= 2 && pendingIntentWrites <= 6) return false;
        }
        return true;
      },
      onPutAttempt: ({ body }) => {
        if (JSON.parse(body).checkoutState !== 'failed') return true;
        if (failureMode === 'exception') throw new Error('tombstone storage unavailable');
        return false;
      },
    });
    runtimeEnv = sandboxEnv(storage.bucket);
    const response = await POST(await request());
    assert.equal(response.status, 500, failureMode);
    assert.equal(JSON.parse(storage.objects.get(manifestKey()).body).checkoutState, 'pending', failureMode);
  }

  assert.equal(fetchCount, 0);
  assert.ok(warnings.some(({ event }) => event === 'order_manifest_tombstone_cas_miss'));
  assert.ok(warnings.some(({ event }) => event === 'order_manifest_tombstone_failed'));
});

test('every provider and completion ambiguity retains the pending manifest, binding, and attached assets', async (t) => {
  const previousFetch = global.fetch;
  const previousConsoleError = console.error;
  console.error = () => {};
  t.after(() => {
    global.fetch = previousFetch;
    console.error = previousConsoleError;
  });
  const token = await assets.createAssetToken(PHOTO_KEY, 'route-secret');
  const checkoutInput = input({
    referenceImages: [{
      name: 'untrusted-name.png',
      url: `/api/order-assets/${token}`,
      contentType: 'image/jpeg',
    }],
  });
  const failureCases = [
    {
      name: 'provider rejection',
      providerFetch: async () => Response.json({ errors: [{ code: 'BAD_REQUEST' }] }, { status: 400 }),
    },
    {
      name: 'transport error',
      providerFetch: async () => { throw new Error('network unavailable'); },
    },
    {
      name: 'malformed provider response',
      providerFetch: async () => new Response('{not-json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    },
    {
      name: 'missing checkout URL',
      providerFetch: async () => Response.json({ payment_link: {} }),
    },
    {
      name: 'completion CAS miss',
      providerFetch: async () => paymentLinkResponse(),
      rejectCompletion: true,
    },
  ];

  for (const failureCase of failureCases) {
    let rejectedCompletion = false;
    const storage = makeBucket({
      photo: trustedTemporaryPhoto('trusted sketch.jpg'),
      onPutAttempt: ({ body }) => {
        const manifest = JSON.parse(body);
        if (
          failureCase.rejectCompletion
          && manifest.checkoutState === 'completed'
          && !rejectedCompletion
        ) {
          rejectedCompletion = true;
          return false;
        }
        return true;
      },
    });
    runtimeEnv = sandboxEnv(storage.bucket);
    global.fetch = failureCase.providerFetch;

    const response = await POST(await request(checkoutInput));
    const stored = JSON.parse(storage.objects.get(manifestKey()).body);
    const storedIntent = JSON.parse(storage.objects.get(`order-intents/${INTENT_ID}.json`).body);

    assert.equal(response.status, 500, failureCase.name);
    assert.equal(stored.checkoutState, 'pending', failureCase.name);
    assert.equal(stored.checkoutAttemptId, ATTEMPT_ID, failureCase.name);
    assert.equal(storedIntent.checkoutState, 'pending', failureCase.name);
    assert.equal(storedIntent.checkoutAttemptId, ATTEMPT_ID, failureCase.name);
    assert.deepEqual(storage.deletes, [], failureCase.name);
    assert.equal(storage.deletes.includes(PHOTO_KEY), false, failureCase.name);
    assert.equal(
      storage.objects.has(assets.createAttachedReferenceKey(ATTEMPT_ID, PHOTO_KEY)),
      true,
      failureCase.name,
    );
  }
});

test('an identical retry reconstructs a full pending record from a minimal tombstone while conflicts stay blocked', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const context = providerContext();
  const tombstone = checkout.failOrderManifest(await makeSeedManifest({ context }));
  const storage = makeBucket();
  storage.seed(manifestKey(), tombstone);
  runtimeEnv = sandboxEnv(storage.bucket);
  const squareBodies = [];
  global.fetch = async (_url, options) => {
    squareBodies.push(JSON.parse(options.body));
    return paymentLinkResponse('https://square.example/pay/reconstructed');
  };

  const conflict = await POST(await request(input({ notes: 'Different customer request.' })));
  const retry = await POST(await request());
  const retryPayload = await retry.json();
  const reconstructed = storage.puts
    .map(({ body, options }) => ({ manifest: JSON.parse(body), options }))
    .find(({ manifest, options }) => (
      manifest.checkoutState === 'pending'
      && options.onlyIf?.etagMatches === 'seed-etag'
    ));

  assert.equal(conflict.status, 409);
  assert.equal(retry.status, 200);
  assert.equal(retryPayload.checkoutUrl, 'https://square.example/pay/reconstructed');
  assert.ok(reconstructed);
  assert.deepEqual(reconstructed.manifest.contact, {
    customerName: 'Connie Customer',
    email: 'connie@example.com',
    phone: '555-0100',
  });
  assert.deepEqual(reconstructed.manifest.customization, walletCustomization());
  assert.equal(reconstructed.manifest.notes, 'Please call first.');
  assert.deepEqual(reconstructed.manifest.referenceImages, []);
  assert.deepEqual(squareBodies.map(({ idempotency_key }) => idempotency_key), [ATTEMPT_ID]);
});

test('an identical completed retry reuses the stored result without another provider call', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  const squareBodies = [];
  global.fetch = async (_url, options) => {
    squareBodies.push(JSON.parse(options.body));
    return paymentLinkResponse();
  };

  const first = await POST(await request());
  const second = await POST(await request());
  const firstPayload = await first.json();
  const secondPayload = await second.json();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(secondPayload, firstPayload);
  assert.deepEqual(storage.puts.map(({ key }) => key), [
    manifestKey(),
    manifestKey(),
    manifestKey(),
  ]);
  assert.deepEqual(squareBodies.map(({ idempotency_key }) => idempotency_key), [ATTEMPT_ID]);
  assert.deepEqual(storage.deletes, []);
});

test('provider ambiguity permanently retains the original attempt binding and blocks distinct work', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  const distinctAttemptId = '123e4567-e89b-42d3-a456-426614174999';
  const providerAttemptIds = [];
  global.fetch = async (_url, options) => {
    providerAttemptIds.push(JSON.parse(options.body).idempotency_key);
    if (providerAttemptIds.length === 1) throw new Error('response lost after provider invocation');
    return paymentLinkResponse('https://square.example/pay/forbidden-distinct-attempt');
  };

  const ambiguous = await POST(await request());
  const distinct = await POST(await request(input({ checkoutAttemptId: distinctAttemptId })));
  const storedIntent = JSON.parse(storage.objects.get(`order-intents/${INTENT_ID}.json`).body);
  const storedManifest = JSON.parse(storage.objects.get(manifestKey()).body);

  assert.equal(ambiguous.status, 500);
  assert.equal(distinct.status, 409);
  assert.deepEqual(providerAttemptIds, [ATTEMPT_ID]);
  assert.equal(storedIntent.checkoutState, 'pending');
  assert.equal(storedIntent.checkoutAttemptId, ATTEMPT_ID);
  assert.match(storedIntent.checkoutFingerprint, /^[0-9a-f]{64}$/);
  assert.equal(storedManifest.checkoutState, 'pending');
  assert.equal(storage.objects.has(`order-manifests/sandbox/${distinctAttemptId}.json`), false);
});

test('genuinely concurrent distinct attempts on one intent cannot both reach the provider', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  const distinctAttemptId = '123e4567-e89b-42d3-a456-426614174999';
  const providerAttemptIds = [];
  let releaseProvider;
  const providerGate = new Promise((resolve) => { releaseProvider = resolve; });
  global.fetch = async (_url, options) => {
    providerAttemptIds.push(JSON.parse(options.body).idempotency_key);
    return providerGate;
  };

  const originalPromise = POST(await request());
  await waitUntil(() => providerAttemptIds.length === 1);
  const distinctPromise = POST(await request(input({ checkoutAttemptId: distinctAttemptId })));
  releaseProvider(paymentLinkResponse('https://square.example/pay/original-only'));
  const [original, distinct] = await Promise.all([originalPromise, distinctPromise]);

  assert.equal(original.status, 200);
  assert.equal(distinct.status, 409);
  assert.deepEqual(providerAttemptIds, [ATTEMPT_ID]);
  assert.equal(storage.objects.has(`order-manifests/sandbox/${distinctAttemptId}.json`), false);
});

test('the same attempt retries an ambiguous provider call after lease expiry with the identical idempotency key', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  t.after(() => {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
  });
  let clock = previousDateNow();
  Date.now = () => clock;
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  const providerAttemptIds = [];
  global.fetch = async (_url, options) => {
    providerAttemptIds.push(JSON.parse(options.body).idempotency_key);
    if (providerAttemptIds.length === 1) throw new Error('provider response lost');
    return paymentLinkResponse('https://square.example/pay/reconciled');
  };

  const ambiguous = await POST(await request());
  clock += 60_000;
  const retry = await POST(await request());
  const payload = await retry.json();

  assert.equal(ambiguous.status, 500);
  assert.equal(retry.status, 200);
  assert.equal(payload.checkoutUrl, 'https://square.example/pay/reconciled');
  assert.deepEqual(providerAttemptIds, [ATTEMPT_ID, ATTEMPT_ID]);
  assert.equal(JSON.parse(storage.objects.get(manifestKey()).body).checkoutState, 'completed');
});

test('an exact completed manifest replays after signed intent expiry without live intent, temp objects, or provider work', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  t.after(() => {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
  });
  const storage = makeBucket();
  const completed = await makeSeedManifest({
    checkoutState: 'completed',
    checkoutUrl: 'https://square.example/pay/completed-before-expiry',
  });
  storage.seed(manifestKey(), completed);
  storage.objects.delete(`order-intents/${INTENT_ID}.json`);
  runtimeEnv = sandboxEnv(storage.bucket);
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse('https://square.example/pay/forbidden-new-work');
  };
  Date.now = () => intentClaims.expiresAt + 1;

  const replay = await POST(await request());
  const payload = await replay.json();

  assert.equal(replay.status, 200);
  assert.deepEqual(payload, {
    checkoutUrl: 'https://square.example/pay/completed-before-expiry',
    orderReference: expectedOrderReference,
  });
  assert.equal(fetchCount, 0);
  assert.deepEqual(storage.heads, []);
  assert.deepEqual(storage.gets, [manifestKey()]);

  const tampered = await POST(await request(input({ notes: 'new work after expiry' })));
  assert.notEqual(tampered.status, 200);
  assert.equal(fetchCount, 0);
});

test('completed image checkout survives intent-finalization failure and replays after expiry without temporary sources', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  const previousConsoleWarn = console.warn;
  const warnings = [];
  console.warn = (message) => { warnings.push(String(message)); };
  t.after(() => {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
    console.warn = previousConsoleWarn;
  });
  let rejectCompletion = true;
  const storage = makeBucket({
    photo: trustedTemporaryPhoto('durable sketch.jpg'),
    onIntentPutAttempt: ({ body }) => {
      const next = JSON.parse(body);
      if (rejectCompletion && next.checkoutState === 'completed') return false;
      return true;
    },
  });
  runtimeEnv = sandboxEnv(storage.bucket);
  const photoToken = await assets.createAssetToken(PHOTO_KEY, 'route-secret');
  const imageInput = input({
    referenceImages: [{ name: 'client-name.jpg', url: `/api/order-assets/${photoToken}`, contentType: 'image/jpeg' }],
  });
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse('https://square.example/pay/durable-image-order');
  };
  Date.now = () => intentClaims.issuedAt + 1_000;

  const first = await POST(await request(imageInput));
  assert.equal(first.status, 200);
  assert.equal(fetchCount, 1);
  assert.equal(storage.deletes.includes(PHOTO_KEY), false);
  assert.ok(warnings.some((entry) => entry.includes('order_intent_completion_cas_miss')));
  assert.equal(JSON.parse(storage.objects.get(manifestKey()).body).checkoutState, 'completed');
  assert.equal(JSON.parse(storage.objects.get(`order-intents/${INTENT_ID}.json`).body).checkoutState, 'pending');

  rejectCompletion = false;
  storage.objects.delete(`order-intents/${INTENT_ID}.json`);
  storage.heads.length = 0;
  storage.gets.length = 0;
  Date.now = () => intentClaims.expiresAt + 1;
  const replay = await POST(await request(imageInput));
  const payload = await replay.json();

  assert.equal(replay.status, 200);
  assert.equal(payload.checkoutUrl, 'https://square.example/pay/durable-image-order');
  assert.equal(fetchCount, 1);
  assert.deepEqual(storage.heads, []);
  assert.deepEqual(storage.gets, [manifestKey()]);
  assert.equal(storage.deletes.includes(PHOTO_KEY), false);
});

test('provider success remains successful when the intent expires during Square work', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  t.after(() => { global.fetch = previousFetch; Date.now = previousDateNow; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  let clock = intentClaims.issuedAt + 1_000;
  Date.now = () => clock;
  global.fetch = async () => {
    clock = intentClaims.expiresAt + 1;
    return paymentLinkResponse('https://square.example/pay/after-expiry');
  };

  const response = await POST(await request());
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.checkoutUrl, 'https://square.example/pay/after-expiry');
  assert.equal(JSON.parse(storage.objects.get(manifestKey()).body).checkoutState, 'completed');
});

test('a conflicting payload for an existing attempt is rejected before Square', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse();
  };

  const first = await POST(await request());
  const conflict = await POST(await request(input({ notes: 'A different order under the same attempt.' })));
  const conflictPayload = await conflict.json();
  const stored = JSON.parse(storage.objects.get(manifestKey()).body);

  assert.equal(first.status, 200);
  assert.equal(conflict.status, 409);
  assert.match(conflictPayload.error, /different order|checkout attempt/i);
  assert.equal(fetchCount, 1);
  assert.equal(stored.notes, 'Please call first.');
  assert.equal(stored.checkoutState, 'completed');
  assert.deepEqual(storage.deletes, []);
});

test('an identical request is rejected while the original lease is active', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  let fetchCount = 0;
  let releaseProvider;
  const providerGate = new Promise((resolve) => { releaseProvider = resolve; });
  global.fetch = async () => {
    fetchCount += 1;
    return providerGate;
  };

  const firstPromise = POST(await request());
  await waitUntil(() => fetchCount === 1);
  let secondSettled = false;
  const secondPromise = POST(await request()).then((response) => {
    secondSettled = true;
    return response;
  });
  await waitUntil(() => secondSettled, 5_000);
  const settledWhileActive = secondSettled;
  const fetchCountWhilePending = fetchCount;
  releaseProvider(paymentLinkResponse());
  const [first, second] = await Promise.all([firstPromise, secondPromise]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
  assert.equal(settledWhileActive, true);
  assert.equal(fetchCountWhilePending, 1);
  assert.equal(fetchCount, 1);
  assert.deepEqual(storage.puts.map(({ options }) => options.onlyIf), [
    { etagDoesNotMatch: '*' },
    { etagMatches: 'etag-1' },
    { etagMatches: 'etag-2' },
  ]);
  assert.deepEqual(storage.deletes, []);
});

test('a failed replay cannot call Square again or delete a completed manifest', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    if (fetchCount > 1) throw new Error('replay must not reach Square');
    return paymentLinkResponse();
  };

  const first = await POST(await request());
  const replay = await POST(await request());
  const stored = JSON.parse(storage.objects.get(manifestKey()).body);

  assert.equal(first.status, 200);
  assert.equal(replay.status, 200);
  assert.equal(fetchCount, 1);
  assert.equal(stored.checkoutState, 'completed');
  assert.equal(stored.checkoutUrl, 'https://square.example/pay/custom-order');
  assert.deepEqual(storage.deletes, []);
});

test('an expired abandoned pending lease is recovered with an ETag-guarded takeover', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  const abandoned = await makeSeedManifest({ leaseExpiresAt: Date.now() - 1 });
  storage.seed(manifestKey(), abandoned);
  runtimeEnv = sandboxEnv(storage.bucket);
  const squareBodies = [];
  global.fetch = async (_url, options) => {
    squareBodies.push(JSON.parse(options.body));
    return paymentLinkResponse('https://square.example/pay/recovered');
  };

  const response = await POST(await request());
  const payload = await response.json();
  const stored = JSON.parse(storage.objects.get(manifestKey()).body);
  const takeoverAttempt = storage.putAttempts.find(({ options }) => options?.onlyIf?.etagMatches === 'seed-etag');

  assert.equal(response.status, 200);
  assert.equal(payload.checkoutUrl, 'https://square.example/pay/recovered');
  assert.ok(takeoverAttempt);
  assert.equal(JSON.parse(takeoverAttempt.body).checkoutState, 'pending');
  assert.equal(stored.checkoutState, 'completed');
  assert.notEqual(stored.ownerId, abandoned.ownerId);
  assert.deepEqual(squareBodies.map(({ idempotency_key }) => idempotency_key), [ATTEMPT_ID]);
  assert.deepEqual(storage.deletes, []);
});

test('a late original owner cannot overwrite a completed takeover and both calls keep one Square idempotency key', async (t) => {
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;
  t.after(() => {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
  });
  let clock = previousDateNow();
  Date.now = () => clock;
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  const squareBodies = [];
  let releaseOriginal;
  const originalGate = new Promise((resolve) => { releaseOriginal = resolve; });
  global.fetch = async (_url, options) => {
    squareBodies.push(JSON.parse(options.body));
    if (squareBodies.length === 1) return originalGate;
    return paymentLinkResponse('https://square.example/pay/takeover');
  };

  const originalPromise = POST(await request());
  await waitUntil(() => squareBodies.length === 1);
  clock += 60_000;
  Date.now = () => {
    const value = clock;
    clock += 20_000;
    return value;
  };
  const takeover = await POST(await request());
  const takeoverPayload = await takeover.json();
  releaseOriginal(paymentLinkResponse('https://square.example/pay/late-original'));
  const original = await originalPromise;
  const originalPayload = await original.json();
  const stored = JSON.parse(storage.objects.get(manifestKey()).body);
  const pendingOwners = storage.puts
    .map(({ body }) => JSON.parse(body))
    .filter(({ checkoutState }) => checkoutState === 'pending')
    .map(({ ownerId }) => ownerId);

  assert.equal(takeover.status, 200);
  assert.equal(original.status, 200);
  assert.equal(takeoverPayload.checkoutUrl, 'https://square.example/pay/takeover');
  assert.equal(originalPayload.checkoutUrl, takeoverPayload.checkoutUrl);
  assert.equal(stored.checkoutUrl, takeoverPayload.checkoutUrl);
  assert.equal(stored.checkoutState, 'completed');
  assert.equal(new Set(pendingOwners).size, 2);
  assert.deepEqual(squareBodies.map(({ idempotency_key }) => idempotency_key), [ATTEMPT_ID, ATTEMPT_ID]);
  assert.deepEqual(storage.deletes, []);
});

test('provider failures from competing same-attempt owners retain the latest pending owner and idempotency key', async (t) => {
  const previousFetch = global.fetch;
  const previousConsoleError = console.error;
  const previousDateNow = Date.now;
  console.error = () => {};
  t.after(() => {
    global.fetch = previousFetch;
    console.error = previousConsoleError;
    Date.now = previousDateNow;
  });
  let clock = previousDateNow();
  Date.now = () => clock;
  const storage = makeBucket();
  runtimeEnv = sandboxEnv(storage.bucket);
  const squareBodies = [];
  let rejectOriginal;
  const originalGate = new Promise((_resolve, reject) => { rejectOriginal = reject; });
  global.fetch = async (_url, options) => {
    squareBodies.push(JSON.parse(options.body));
    if (squareBodies.length === 1) return originalGate;
    return Response.json({ errors: [{ code: 'TAKEOVER_FAILED' }] }, { status: 400 });
  };

  const originalPromise = POST(await request());
  await waitUntil(() => squareBodies.length === 1);
  clock += 60_000;
  Date.now = () => {
    const value = clock;
    clock += 20_000;
    return value;
  };
  const takeover = await POST(await request());
  rejectOriginal(new Error('original transport interrupted'));
  const original = await originalPromise;
  const finalObject = storage.objects.get(manifestKey());
  assert.ok(finalObject);
  const stored = JSON.parse(finalObject.body);
  const failedTransition = storage.putAttempts.find(({ body, options }) => (
    JSON.parse(body).checkoutState === 'failed'
    && typeof options?.onlyIf?.etagMatches === 'string'
  ));

  assert.equal(takeover.status, 500);
  assert.equal(original.status, 500);
  assert.equal(stored.checkoutState, 'pending');
  assert.equal(failedTransition, undefined);
  assert.deepEqual(squareBodies.map(({ idempotency_key }) => idempotency_key), [ATTEMPT_ID, ATTEMPT_ID]);
  assert.deepEqual(storage.deletes, []);
});

test('one intent cannot create a second checkout in another Square environment', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return paymentLinkResponse(url.includes('squareupsandbox')
      ? 'https://square.example/pay/sandbox-order'
      : 'https://square.example/pay/production-order');
  };

  runtimeEnv = sandboxEnv(storage.bucket);
  const sandbox = await POST(await request());
  runtimeEnv = productionEnv(storage.bucket);
  const production = await POST(await request());
  const sandboxPayload = await sandbox.json();

  assert.equal(sandbox.status, 200);
  assert.equal(production.status, 409);
  assert.equal(sandboxPayload.checkoutUrl, 'https://square.example/pay/sandbox-order');
  assert.equal(storage.objects.has(manifestKey('sandbox')), true);
  assert.equal(storage.objects.has(manifestKey('production')), false);
  assert.deepEqual(calls.map(({ body }) => body.idempotency_key), [ATTEMPT_ID]);
});

test('location and request-origin changes cannot reuse a completed manifest', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const storage = makeBucket();
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse('https://square.example/pay/original-context');
  };

  runtimeEnv = sandboxEnv(storage.bucket);
  const first = await POST(await request());
  runtimeEnv = sandboxEnv(storage.bucket, { SQUARE_SANDBOX_LOCATION_ID: 'new-sandbox-location' });
  const changedLocation = await POST(await request());
  runtimeEnv = sandboxEnv(storage.bucket);
  const changedOrigin = await POST(await request(input(), 'https://staging.twistedcustomleather.com/api/checkout'));

  assert.equal(first.status, 200);
  assert.equal(changedLocation.status, 409);
  assert.equal(changedOrigin.status, 409);
  assert.equal(fetchCount, 1);
  assert.equal(JSON.parse(storage.objects.get(manifestKey()).body).checkoutUrl, 'https://square.example/pay/original-context');
  assert.deepEqual(storage.deletes, []);
});

test('checkout rejects unverified, missing, wrongly namespaced, and untrusted photo references before Square', async (t) => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  let fetchCount = 0;
  global.fetch = async () => {
    fetchCount += 1;
    return paymentLinkResponse();
  };
  const wrongNamespaceToken = await assets.createAssetToken(
    manifestKey(),
    'route-secret',
  );
  const validToken = await assets.createAssetToken(PHOTO_KEY, 'route-secret');
  const cases = [
    { token: `${validToken}x`, photo: { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: { originalName: 'photo.jpg' } } },
    { token: wrongNamespaceToken, photo: null },
    { token: validToken, photo: null },
    { token: validToken, photo: { httpMetadata: { contentType: 'text/html' }, customMetadata: { originalName: 'photo.jpg' } } },
    { token: validToken, photo: { httpMetadata: { contentType: 'image/jpeg' }, customMetadata: {} } },
  ];

  for (const fixture of cases) {
    const storage = makeBucket({ photo: fixture.photo });
    runtimeEnv = sandboxEnv(storage.bucket);
    const response = await POST(await request(input({
      referenceImages: [{ name: 'photo.jpg', url: `/api/order-assets/${fixture.token}`, contentType: 'image/jpeg' }],
    })));
    assert.equal(response.status, 400);
    assert.equal(storage.puts.length, 0);
  }
  assert.equal(fetchCount, 0);
});

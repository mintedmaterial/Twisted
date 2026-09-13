const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const root = path.resolve(__dirname, '..');
const security = loadTypeScriptModule('src/lib/order-security.ts');
const intentState = loadTypeScriptModule('src/lib/order-intent-state.ts');
const jpegBytes = fs.readFileSync(path.join(root, 'public', 'featured-work', 'custom-leather-wallet-set.jpg'));
const pngBytes = fs.readFileSync(path.join(root, 'public', 'belt-icon.png'));

function loadRouteModule(relativeFile, mocks, moduleCache = new Map()) {
  const absoluteFile = path.resolve(root, relativeFile);
  const module = { exports: {} };
  moduleCache.set(absoluteFile, module);
  const javascript = ts.transpileModule(fs.readFileSync(absoluteFile, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: absoluteFile,
  }).outputText;
  const localRequire = (request) => {
    if (Object.hasOwn(mocks, request)) return mocks[request];
    if (request.startsWith('.')) {
      const base = path.resolve(path.dirname(absoluteFile), request);
      const candidate = [base, `${base}.ts`, path.join(base, 'index.ts')].find(fs.existsSync);
      if (!candidate) throw new Error(`Unable to resolve ${request}`);
      if (moduleCache.has(candidate)) return moduleCache.get(candidate).exports;
      return loadRouteModule(path.relative(root, candidate), mocks, moduleCache);
    }
    return require(request);
  };
  new vm.Script(`(function(exports,module,require){\n${javascript}\n})`, { filename: absoluteFile })
    .runInThisContext()(module.exports, module, localRequire);
  return module.exports;
}

function memoryBucket(initialState, events = []) {
  const objects = new Map();
  let sequence = 1;
  const intentKey = intentState.createOrderIntentKey(initialState.intentId);
  objects.set(intentKey, { body: JSON.stringify(initialState), etag: `e${sequence}` });
  return {
    objects,
    async get(key) {
      events.push(`get:${key}`);
      const entry = objects.get(key);
      if (!entry) return null;
      return {
        etag: entry.etag,
        json: async () => JSON.parse(entry.body),
        body: entry.body,
        httpMetadata: entry.options?.httpMetadata,
        customMetadata: entry.options?.customMetadata,
      };
    },
    async put(key, body, options = {}) {
      events.push(`put:${key}`);
      const current = objects.get(key);
      if (options.onlyIf?.etagMatches && current?.etag !== options.onlyIf.etagMatches) return null;
      if (options.onlyIf?.etagDoesNotMatch === '*' && current) return null;
      sequence += 1;
      objects.set(key, { body, etag: `e${sequence}`, options });
      return { etag: `e${sequence}` };
    },
    async delete(key) { events.push(`delete:${key}`); objects.delete(key); },
  };
}

function imagesBinding(events, infos) {
  let index = 0;
  return {
    async info() { events.push(`info:${index}`); return infos[index]; },
    input() {
      const current = index++;
      events.push(`input:${current}`);
      return {
        transform(options) {
          events.push(`transform:${current}:${JSON.stringify(options)}`);
          return this;
        },
        async output(options) {
          events.push(`output:${current}:${JSON.stringify(options)}`);
          const bytes = new TextEncoder().encode(`canonical-${current}`);
          return {
            response: () => new Response(bytes, {
              headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.length) },
            }),
          };
        },
      };
    },
  };
}

async function multipartRequest(files, token, extraEntries = []) {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  for (const [key, value] of extraEntries) form.append(key, value);
  const provisional = new Request('https://twistedcustomleather.com/api/order-assets', { method: 'POST', body: form });
  const bytes = await provisional.arrayBuffer();
  return new Request(provisional.url, {
    method: 'POST',
    headers: {
      'Content-Type': provisional.headers.get('Content-Type'),
      'Content-Length': String(bytes.byteLength),
      'CF-Connecting-IP': '203.0.113.20',
      Authorization: `Bearer ${token}`,
    },
    body: bytes,
  });
}

async function setup(files = [new File([jpegBytes], 'first.jpg', { type: 'image/jpeg' })], infos) {
  const now = Date.now();
  const state = {
    version: 2,
    intentId: '123e4567-e89b-42d3-a456-426614174111',
    issuedAt: now,
    expiresAt: now + 300_000,
    uploadKeys: [],
    checkoutState: 'available',
    checkoutAttemptId: null,
    checkoutFingerprint: null,
    checkoutOwnerId: null,
    checkoutLeaseExpiresAt: null,
  };
  const token = await security.createOrderIntentToken({
    intentId: state.intentId, issuedAt: state.issuedAt, expiresAt: state.expiresAt,
  }, 'intent-secret');
  const events = [];
  const bucket = memoryBucket(state, events);
  const env = {
    ORDER_ASSETS: bucket,
    ORDER_ASSET_TOKEN_SECRET: 'asset-secret',
    ORDER_INTENT_TOKEN_SECRET: 'intent-secret',
    ORDER_UPLOAD_RATE_LIMITER: { limit: async ({ key }) => { events.push(`limit:${key}`); return { success: true }; } },
    IMAGES: imagesBinding(events, infos ?? files.map((file) => ({
      format: file.type, fileSize: file.size, width: 1200, height: 900,
    }))),
  };
  return { state, token, events, bucket, env, request: await multipartRequest(files, token) };
}

test('upload requires a live signed intent and rate limits visitor plus intent before multipart parsing', async () => {
  const prepared = await setup();
  prepared.env.ORDER_UPLOAD_RATE_LIMITER = {
    limit: async ({ key }) => { prepared.events.push(`limit:${key}`); return { success: false }; },
  };
  const route = loadRouteModule('src/app/api/order-assets/route.ts', {
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) },
  });
  const invalidMultipart = new Request(prepared.request.url, {
    method: 'POST', headers: prepared.request.headers, body: new TextEncoder().encode('not multipart'),
  });
  const response = await route.POST(invalidMultipart);

  assert.equal(response.status, 429);
  assert.equal(prepared.events[0], `get:order-intents/${prepared.state.intentId}.json`);
  assert.equal(prepared.events[1], `limit:order-upload:203.0.113.20:${prepared.state.intentId}`);
  assert.equal(prepared.events.some((event) => event.startsWith('info:')), false);
});

test('upload rejects framing and extra form fields before Images or object writes', async () => {
  const prepared = await setup();
  const route = loadRouteModule('src/app/api/order-assets/route.ts', {
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) },
  });
  const withExtra = await multipartRequest(
    [new File([jpegBytes], 'first.jpg', { type: 'image/jpeg' })], prepared.token, [['caption', 'secret']],
  );
  const missingLength = new Request(prepared.request);
  missingLength.headers.delete('Content-Length');

  assert.equal((await route.POST(missingLength)).status, 411);
  assert.equal((await route.POST(withExtra)).status, 400);
  assert.equal(prepared.events.some((event) => event.startsWith('info:')), false);
  assert.equal([...prepared.bucket.objects.keys()].some((key) => key.startsWith('order-uploads/')), false);
});

test('upload processes files sequentially through Images and stores canonical temporary JPEG streams', async () => {
  const files = [
    new File([jpegBytes], 'first.jpg', { type: 'image/jpeg' }),
    new File([pngBytes], 'second.png', { type: 'image/png' }),
  ];
  const prepared = await setup(files);
  const route = loadRouteModule('src/app/api/order-assets/route.ts', {
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) },
  });
  const response = await route.POST(prepared.request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload.files.map(({ name, contentType }) => ({ name, contentType })), [
    { name: 'first.jpg', contentType: 'image/jpeg' },
    { name: 'second.jpg', contentType: 'image/jpeg' },
  ]);
  const relevant = prepared.events.filter((event) => /^(info|input|transform|output|put:order-uploads)/.test(event));
  assert.match(relevant.join('\n'), /^info:0\ninput:0\ntransform:0:.*\noutput:0:.*\nput:order-uploads\/.*\ninfo:1\ninput:1\ntransform:1:.*\noutput:1:.*\nput:order-uploads\//s);
  assert.equal(relevant.filter((event) => event.includes('"format":"image/jpeg"')).length, 2);
  assert.equal(relevant.filter((event) => event.includes('"anim":false')).length, 2);
  const storedState = JSON.parse(prepared.bucket.objects.get(intentState.createOrderIntentKey(prepared.state.intentId)).body);
  assert.equal(storedState.uploadKeys.length, 2);
  assert.ok(storedState.uploadKeys.every((key) => key.startsWith(`order-uploads/${prepared.state.intentId}/`)));
});

test('upload rejects Images metadata limits and releases reserved quota without leaving temporary objects', async () => {
  const prepared = await setup(undefined, [{ format: 'image/jpeg', fileSize: jpegBytes.length, width: 20_000, height: 20_000 }]);
  const route = loadRouteModule('src/app/api/order-assets/route.ts', {
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) },
  });
  const response = await route.POST(prepared.request);
  const storedState = JSON.parse(prepared.bucket.objects.get(intentState.createOrderIntentKey(prepared.state.intentId)).body);

  assert.equal(response.status, 400);
  assert.deepEqual(storedState.uploadKeys, []);
  assert.equal([...prepared.bucket.objects.keys()].some((key) => key.startsWith('order-uploads/')), false);
	const releaseIndex = prepared.events.findLastIndex((event) => event.startsWith('put:order-intents/'));
	const deleteIndex = prepared.events.findIndex((event) => event.startsWith('delete:order-uploads/'));
	assert.ok(releaseIndex >= 0 && deleteIndex > releaseIndex);
});

test('removing an uploaded reference deletes the owned temporary object and releases intent quota', async () => {
  const prepared = await setup();
  const route = loadRouteModule('src/app/api/order-assets/route.ts', {
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) },
  });
  const uploadResponse = await route.POST(prepared.request);
  const uploaded = (await uploadResponse.json()).files[0];
  const body = JSON.stringify({ url: uploaded.url });
  const response = await route.DELETE(new Request('https://twistedcustomleather.com/api/order-assets', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
      'CF-Connecting-IP': '203.0.113.20',
      Authorization: `Bearer ${prepared.token}`,
    },
    body,
  }));
  const storedState = JSON.parse(prepared.bucket.objects.get(intentState.createOrderIntentKey(prepared.state.intentId)).body);

  assert.equal(response.status, 204);
  assert.deepEqual(storedState.uploadKeys, []);
  assert.equal([...prepared.bucket.objects.keys()].some((key) => key.startsWith('order-uploads/')), false);
});

test('removal keeps the object when quota release exhausts CAS and reports the failure', async () => {
  const prepared = await setup();
  const route = loadRouteModule('src/app/api/order-assets/route.ts', { '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) } });
  const uploaded = (await (await route.POST(prepared.request)).json()).files[0];
  const originalPut = prepared.bucket.put.bind(prepared.bucket);
  prepared.bucket.put = async (key, body, options) => key.startsWith('order-intents/') && JSON.parse(String(body)).uploadKeys.length === 0 ? null : originalPut(key, body, options);
  const body = JSON.stringify({ url: uploaded.url });
  const response = await route.DELETE(new Request('https://twistedcustomleather.com/api/order-assets', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)), 'CF-Connecting-IP': '203.0.113.20', Authorization: `Bearer ${prepared.token}` }, body }));
  assert.equal(response.status, 409);
  assert.equal([...prepared.bucket.objects.keys()].some((key) => key.startsWith('order-uploads/')), true);
});

test('signed temporary references remain privately viewable until checkout promotion', async () => {
  const prepared = await setup();
  const mocks = { '@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: prepared.env }) } };
  const uploadRoute = loadRouteModule('src/app/api/order-assets/route.ts', mocks);
  const uploaded = (await (await uploadRoute.POST(prepared.request)).json()).files[0];
  const token = uploaded.url.split('/').pop();
  const getRoute = loadRouteModule('src/app/api/order-assets/[token]/route.ts', mocks);
  const response = await getRoute.GET(new Request(`https://twistedcustomleather.com${uploaded.url}`), {
    params: Promise.resolve({ token }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/jpeg');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});

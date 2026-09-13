const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
let runtimeEnv;
let reconcile;

function loadRoute() {
  const filename = path.join(root, 'src', 'app', 'api', 'order-maintenance', 'route.ts');
  const javascript = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === '@opennextjs/cloudflare') return { getCloudflareContext: () => ({ env: runtimeEnv }) };
    if (request === '@/lib/order-reconciliation') return { reconcileOrderRecords: (...args) => reconcile(...args) };
    return require(request);
  };
  new vm.Script(`(function(exports,module,require){${javascript}\n})`, { filename })
    .runInThisContext()(module.exports, module, localRequire);
  return module.exports;
}

test('maintenance route rejects unauthorized calls and forwards both continuation cursors', async () => {
  const { POST } = loadRoute();
  const calls = [];
  const secret = 'maintenance-secret-at-least-thirty-two-characters';
  runtimeEnv = { ORDER_MAINTENANCE_SECRET: secret, ORDER_ASSETS: { name: 'bucket' } };
  reconcile = async (...args) => {
    calls.push(args);
    return {
      manifestsTombstoned: 0,
      intentsRedacted: 0,
      assetsDeleted: 0,
      failures: 0,
      manifestCursor: 'manifest-next',
      intentCursor: 'intent-next',
    };
  };

  const unauthorized = await POST(new Request('https://example.com/api/order-maintenance', {
    method: 'POST',
    headers: { Authorization: 'Bearer wrong-secret-that-is-long-enough-000' },
  }));
  assert.equal(unauthorized.status, 401);
  assert.equal(calls.length, 0);

  const authorized = await POST(new Request(
    'https://example.com/api/order-maintenance?manifestCursor=manifest-page-2&intentCursor=intent-page-3',
    { method: 'POST', headers: { Authorization: `Bearer ${secret}` } },
  ));
  assert.equal(authorized.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], runtimeEnv.ORDER_ASSETS);
  assert.deepEqual(calls[0][2], {
    manifestCursor: 'manifest-page-2',
    intentCursor: 'intent-page-3',
  });
  assert.deepEqual(await authorized.json(), {
    manifestsTombstoned: 0,
    intentsRedacted: 0,
    assetsDeleted: 0,
    failures: 0,
    manifestCursor: 'manifest-next',
    intentCursor: 'intent-next',
  });
});

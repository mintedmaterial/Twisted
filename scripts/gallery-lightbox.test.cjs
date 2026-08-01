const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function loadTypeScriptModule(file) {
  const source = read(file);
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const sandbox = { exports: {}, module: { exports: {} } };
  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(javascript, sandbox, { filename: file });
  return sandbox.exports;
}

test('lightbox model opens valid images and rejects missing images', () => {
  const model = loadTypeScriptModule('src/components/galleryLightboxModel.ts');
  assert.equal(model.openLightbox(3, 0), 0);
  assert.equal(model.openLightbox(3, 2), 2);
  assert.equal(model.openLightbox(0, 0), null);
  assert.equal(model.openLightbox(3, -1), null);
  assert.equal(model.openLightbox(3, 3), null);
  assert.equal(model.openLightbox(3, 1.5), null);
  assert.equal(model.closeLightbox(), null);
});

test('lightbox model navigates and wraps in both directions', () => {
  const model = loadTypeScriptModule('src/components/galleryLightboxModel.ts');
  assert.equal(model.nextLightboxIndex(0, 3), 1);
  assert.equal(model.nextLightboxIndex(2, 3), 0);
  assert.equal(model.previousLightboxIndex(2, 3), 1);
  assert.equal(model.previousLightboxIndex(0, 3), 2);
  assert.equal(model.nextLightboxIndex(0, 0), null);
  assert.equal(model.previousLightboxIndex(0, 0), null);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function loadTypeScriptModule(file) {
  const javascript = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const sandbox = { exports: {}, module: { exports: {} } };
  sandbox.module.exports = sandbox.exports;
  vm.runInNewContext(javascript, sandbox, { filename: file });
  return sandbox.exports;
}

test('opens only valid featured photos', () => {
  const model = loadTypeScriptModule('src/components/featuredWorkLightboxModel.ts');
  assert.equal(model.openFeaturedPhoto(7, 0), 0);
  assert.equal(model.openFeaturedPhoto(7, 6), 6);
  assert.equal(model.openFeaturedPhoto(7, -1), null);
  assert.equal(model.openFeaturedPhoto(7, 7), null);
  assert.equal(model.openFeaturedPhoto(0, 0), null);
});

test('featured photo navigation wraps in both directions', () => {
  const model = loadTypeScriptModule('src/components/featuredWorkLightboxModel.ts');
  assert.equal(model.nextFeaturedPhoto(6, 7), 0);
  assert.equal(model.previousFeaturedPhoto(0, 7), 6);
  assert.equal(model.nextFeaturedPhoto(2, 7), 3);
  assert.equal(model.previousFeaturedPhoto(2, 7), 1);
});

test('featured popup focus cycles and recovers outside focus', () => {
  const model = loadTypeScriptModule('src/components/featuredWorkLightboxModel.ts');
  assert.equal(model.nextFeaturedFocusIndex(2, 3, false), 0);
  assert.equal(model.nextFeaturedFocusIndex(0, 3, true), 2);
  assert.equal(model.nextFeaturedFocusIndex(-1, 3, false), 0);
  assert.equal(model.nextFeaturedFocusIndex(-1, 3, true), 2);
  assert.equal(model.nextFeaturedFocusIndex(0, 0, false), null);
});

test('featured work popup exposes accessible controls and the optional album action', () => {
  const component = read('src/components/FeaturedWorkLightbox.tsx');
  assert.match(component, /'use client'/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /aria-label="Close larger image"/);
  assert.match(component, /aria-label="Previous image"/);
  assert.match(component, /aria-label="Next image"/);
  assert.match(component, /View Full Album/);
  assert.match(component, /selectedItem\.href/);
  assert.match(component, /event\.key === 'Escape'/);
  assert.match(component, /event\.key === 'ArrowLeft'/);
  assert.match(component, /event\.key === 'ArrowRight'/);
  assert.match(component, /object-contain/);
  assert.match(component, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(component, /sibling\.setAttribute\('inert', ''\)/);
  assert.match(component, /window\.scrollTo/);
  assert.match(component, /opener\?\.focus\(\)/);
});

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

test('lightbox controller preserves the original opener throughout navigation', () => {
  const model = loadTypeScriptModule('src/components/galleryLightboxModel.ts');
  const originalOpener = { id: 'first-photo' };
  const navigatedPhoto = { id: 'third-photo' };

  assert.equal(model.preserveLightboxOpener(null, originalOpener), originalOpener);
  assert.equal(model.preserveLightboxOpener(originalOpener, navigatedPhoto), originalOpener);
});

test('lightbox controller closes an index invalidated by an image-list change', () => {
  const model = loadTypeScriptModule('src/components/galleryLightboxModel.ts');
  const openedImages = [{ src: 'one' }, { src: 'two' }];

  assert.equal(model.reconcileLightboxIndex(null, 3), null);
  assert.equal(model.reconcileLightboxIndex(1, 3), 1);
  assert.equal(model.reconcileLightboxIndex(2, 2), null);
  assert.equal(model.reconcileLightboxIndex(0, 0), null);
  assert.equal(model.shouldCloseLightboxForImagesChange(openedImages, openedImages, 1), false);
  assert.equal(model.shouldCloseLightboxForImagesChange(openedImages, [...openedImages], 1), true);
  assert.equal(model.shouldCloseLightboxForImagesChange(openedImages, openedImages.slice(0, 1), 1), true);
});

test('lightbox controller cycles focus in both directions and recovers outside focus', () => {
  const model = loadTypeScriptModule('src/components/galleryLightboxModel.ts');

  assert.equal(model.nextLightboxFocusIndex(0, 3, false), 1);
  assert.equal(model.nextLightboxFocusIndex(2, 3, false), 0);
  assert.equal(model.nextLightboxFocusIndex(2, 3, true), 1);
  assert.equal(model.nextLightboxFocusIndex(0, 3, true), 2);
  assert.equal(model.nextLightboxFocusIndex(-1, 3, false), 0);
  assert.equal(model.nextLightboxFocusIndex(-1, 3, true), 2);
  assert.equal(model.nextLightboxFocusIndex(0, 0, false), null);
});

test('shared lightbox exposes the required accessible controls and complete image', () => {
  const component = read('src/components/GalleryLightbox.tsx');
  assert.match(component, /'use client'/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /aria-label="Close larger image"/);
  assert.match(component, /aria-label="Previous image"/);
  assert.match(component, /aria-label="Next image"/);
  assert.match(component, /aria-label=\{`View larger: \$\{image\.alt\}`\}/);
  assert.match(component, /event\.key === 'Escape'/);
  assert.match(component, /event\.key === 'ArrowLeft'/);
  assert.match(component, /event\.key === 'ArrowRight'/);
  assert.match(component, /object-contain/);
  assert.match(component, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(component, /opener\?\.focus\(\)/);
});

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

test('featured popup lifecycle runs only when the popup opens or closes', () => {
  const component = read('src/components/FeaturedWorkLightbox.tsx');
  assert.match(component, /const isOpen = selectedItem !== null;/);
  assert.match(component, /useEffect\(\(\) => \{\s+if \(!isOpen\) return;[\s\S]*?\}, \[isOpen\]\);/);
});

test('featured card buttons do not nest articles', () => {
  const component = read('src/components/FeaturedWorkLightbox.tsx');
  assert.doesNotMatch(component, /className="group text-left[\s\S]*?<article\b/);
  assert.match(component, /className=\{`relative overflow-hidden rounded-lg border border-copper\/30 bg-wood-dark\/60 min-h-\[18rem\] \$\{item\.span \?\? ''\}`\}/);
});

test('all seven featured cards use the popup and existing album links remain unchanged', () => {
  const featured = read('src/components/FeaturedWork.tsx');
  const component = read('src/components/FeaturedWorkLightbox.tsx');
  const hrefs = [...featured.matchAll(/href: '([^']+)'/g)].map((match) => match[1]);
  const { galleryOrderReferences } = loadTypeScriptModule('src/data/gallery-order-references.ts');
  assert.match(featured, /import FeaturedWorkLightbox/);
  assert.match(featured, /<FeaturedWorkLightbox items=\{featuredWork\} \/>/);
  assert.equal(galleryOrderReferences.length, 7);
  assert.equal(galleryOrderReferences.every(({ title }) => title.trim().length > 0), true);
  assert.deepEqual(hrefs, [
    'https://photos.app.goo.gl/GpcrR32WbqrkSV4L7',
    'https://photos.google.com/share/AF1QipOsNxODm1-e7A7G3G6ZEPn-cshXXMuZRXZXyykPdt4nqefNbiUnD5bRCaW32J-fsg?key=RFJLS0hBckVXTmpubFdBU0xGbzNjSWFiXzR2VnVn',
    'https://photos.google.com/share/AF1QipPzOOqKXTMznO6pcbD_tzOVFen160_3j2S1ndp848nNXufyX3sKbKXxPNT_lbFSwA/photo/AF1QipMAfvfW-Iggd2w43t0R_LjXdGapeanTWw0qlyfS?key=QWpuY19GY1BIWWg0bndnZnFRdmY1bmZNME40RDl3',
    'https://photos.app.goo.gl/LTtAmZFpcWxB893j2',
  ]);
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
});

test('featured work maps gallery pieces to preselected custom-order references', () => {
  const featured = read('src/components/FeaturedWork.tsx');
  const component = read('src/components/FeaturedWorkLightbox.tsx');

  assert.match(featured, /import \{ galleryOrderReferences \}/);
  assert.equal((featured.match(/\.\.\.galleryOrderReferences\[\d\]/g) || []).length, 7);
  assert.match(component, /productId\?: string/);
  assert.match(component, /referenceId\?: string/);
  assert.match(component, /Make One Like This/);
  assert.match(component, /\/?\?product=\$\{encodeURIComponent\(selectedItem\.productId\)\}&reference=\$\{encodeURIComponent\(selectedItem\.referenceId\)\}#custom-order/);
});

# Album Photo Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every photo inside all six gallery albums open its matching full-size image in an accessible popup with close and circular Previous/Next navigation.

**Architecture:** Add a small pure navigation model and a shared client-side `GalleryLightbox` component that owns selection, focus, keyboard handling, scroll locking, the existing photo-card grid, and the modal overlay. The standard gallery page passes its full album array; `WalletGallery` passes its filtered `visibleImages`, preserving the active wallet category and its photo order.

**Tech Stack:** Next.js 15.5.9, React 19, TypeScript, Tailwind CSS 4, `next/image`, Node's built-in test runner.

## Global Constraints

- Apply the popup only to the Custom Wallets, Belts, Welding Gear, Purses & Leather Work, Bible Covers, and Portfolios album photo grids.
- Keep homepage feature cards, product pages, logos, decorative images, routes, records, and image files unchanged.
- Show the complete enlarged image with `object-contain`; never crop or stretch it.
- Previous and Next wrap around the current image list.
- Wallet navigation uses only the photos visible under the active category filter.
- Close with the X button, backdrop click, or Escape; navigate with buttons or Left/Right Arrow keys.
- Restore focus, background scrolling, the active wallet filter, and the album's scroll position when the popup closes.

---

## File Structure

- Create `src/components/galleryLightboxModel.ts`: pure, framework-free open/close/wrap navigation functions.
- Create `src/components/GalleryLightbox.tsx`: reusable gallery-card grid and accessible modal image viewer.
- Create `scripts/gallery-lightbox.test.cjs`: executable model tests plus source-level integration and accessibility checks.
- Modify `scripts/custom-wallets-gallery.test.cjs`: move existing card-layout assertions to the shared component while preserving wallet-filter regression coverage.
- Modify `src/components/WalletGallery.tsx`: keep filters and CTAs, replacing its photo grid with the shared lightbox.
- Modify `src/app/gallery/[slug]/page.tsx`: render the shared lightbox for non-wallet albums.

### Task 1: Lightbox Navigation Model

**Files:**
- Create: `src/components/galleryLightboxModel.ts`
- Create: `scripts/gallery-lightbox.test.cjs`

**Interfaces:**
- Produces: `LightboxIndex = number | null`
- Produces: `openLightbox(imageCount: number, requestedIndex: number): LightboxIndex`
- Produces: `closeLightbox(): null`
- Produces: `previousLightboxIndex(currentIndex: number, imageCount: number): LightboxIndex`
- Produces: `nextLightboxIndex(currentIndex: number, imageCount: number): LightboxIndex`

- [ ] **Step 1: Write the failing model tests**

Create `scripts/gallery-lightbox.test.cjs` with:

```js
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
```

- [ ] **Step 2: Run the model tests and verify RED**

Run:

```powershell
node --test scripts/gallery-lightbox.test.cjs
```

Expected: FAIL because `src/components/galleryLightboxModel.ts` does not exist.

- [ ] **Step 3: Implement the minimal navigation model**

Create `src/components/galleryLightboxModel.ts` with:

```ts
export type LightboxIndex = number | null;

export function openLightbox(imageCount: number, requestedIndex: number): LightboxIndex {
  return Number.isInteger(requestedIndex)
    && requestedIndex >= 0
    && requestedIndex < imageCount
    ? requestedIndex
    : null;
}

export function closeLightbox(): null {
  return null;
}

export function previousLightboxIndex(currentIndex: number, imageCount: number): LightboxIndex {
  return imageCount > 0 ? (currentIndex - 1 + imageCount) % imageCount : null;
}

export function nextLightboxIndex(currentIndex: number, imageCount: number): LightboxIndex {
  return imageCount > 0 ? (currentIndex + 1) % imageCount : null;
}
```

- [ ] **Step 4: Run the model tests and verify GREEN**

Run:

```powershell
node --test scripts/gallery-lightbox.test.cjs
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the model**

```powershell
git add scripts/gallery-lightbox.test.cjs src/components/galleryLightboxModel.ts
git commit -m "test: define album lightbox navigation"
```

### Task 2: Shared Accessible Gallery Lightbox

**Files:**
- Modify: `scripts/gallery-lightbox.test.cjs`
- Create: `src/components/GalleryLightbox.tsx`

**Interfaces:**
- Consumes: `GalleryImage[]` from `src/data/galleries.ts`
- Consumes: all four navigation functions from `galleryLightboxModel.ts`
- Produces: `GalleryLightbox({ images, imageFit }: { images: GalleryImage[]; imageFit?: 'cover' | 'contain' }): JSX.Element | null`

- [ ] **Step 1: Add failing component-contract tests**

Append to `scripts/gallery-lightbox.test.cjs`:

```js
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
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
node --test scripts/gallery-lightbox.test.cjs
```

Expected: the two model tests pass and the component-contract test fails because `GalleryLightbox.tsx` does not exist.

- [ ] **Step 3: Implement the shared component**

Create `src/components/GalleryLightbox.tsx` with:

```tsx
'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import type { GalleryImage } from '@/data/galleries';
import {
  closeLightbox,
  nextLightboxIndex,
  openLightbox,
  previousLightboxIndex,
  type LightboxIndex,
} from '@/components/galleryLightboxModel';

type GalleryLightboxProps = {
  images: GalleryImage[];
  imageFit?: 'cover' | 'contain';
};

export default function GalleryLightbox({ images, imageFit = 'cover' }: GalleryLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<LightboxIndex>(null);
  const photoButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const captionId = useId();
  const selectedImage = selectedIndex === null ? null : images[selectedIndex];

  const handleClose = () => {
    const opener = selectedIndex === null ? null : photoButtons.current[selectedIndex];
    setSelectedIndex(closeLightbox());
    requestAnimationFrame(() => opener?.focus());
  };

  const showPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(previousLightboxIndex(selectedIndex, images.length));
    }
  };

  const showNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(nextLightboxIndex(selectedIndex, images.length));
    }
  };

  useEffect(() => {
    if (selectedIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {images.map((image, index) => (
          <article key={image.src} className="group overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/70 card-glow">
            <button
              ref={(element) => { photoButtons.current[index] = element; }}
              type="button"
              aria-label={`View larger: ${image.alt}`}
              onClick={() => setSelectedIndex(openLightbox(images.length, index))}
              className="relative block aspect-[4/3] w-full cursor-zoom-in bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className={`absolute inset-0 h-full w-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover transition-transform duration-500 group-hover:scale-105'}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </button>
            <div className="p-5">
              <h2 className="heading-western text-2xl text-cream">{image.title}</h2>
            </div>
          </article>
        ))}
      </div>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={captionId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
        >
          <button ref={closeButton} type="button" aria-label="Close larger image" onClick={handleClose} className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-copper bg-charcoal/90 text-3xl text-cream hover:bg-copper hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">×</button>
          <button type="button" aria-label="Previous image" onClick={showPrevious} className="absolute left-2 top-1/2 z-10 flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-copper bg-charcoal/90 text-4xl text-cream hover:bg-copper hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:left-5">‹</button>
          <figure className="flex max-h-full max-w-6xl flex-col items-center gap-3 px-10 sm:px-16">
            <Image src={selectedImage.src} alt={selectedImage.alt} width={selectedImage.width} height={selectedImage.height} className="max-h-[calc(100vh-7rem)] max-w-full h-auto w-auto object-contain" sizes="100vw" priority />
            <figcaption id={captionId} className="heading-western text-center text-lg text-cream sm:text-xl">{selectedImage.title}</figcaption>
          </figure>
          <button type="button" aria-label="Next image" onClick={showNext} className="absolute right-2 top-1/2 z-10 flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-copper bg-charcoal/90 text-4xl text-cream hover:bg-copper hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:right-5">›</button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run component tests and the type-check**

Run:

```powershell
node --test scripts/gallery-lightbox.test.cjs
node node_modules/typescript/bin/tsc --noEmit
```

Expected: 3 tests pass, 0 fail; TypeScript exits successfully without output.

- [ ] **Step 5: Commit the shared component**

```powershell
git add scripts/gallery-lightbox.test.cjs src/components/GalleryLightbox.tsx
git commit -m "feat: add accessible album photo lightbox"
```

### Task 3: Connect Every Album Grid and Publish

**Files:**
- Modify: `scripts/gallery-lightbox.test.cjs`
- Modify: `scripts/custom-wallets-gallery.test.cjs`
- Modify: `src/components/WalletGallery.tsx`
- Modify: `src/app/gallery/[slug]/page.tsx`

**Interfaces:**
- Consumes: `<GalleryLightbox images={gallery.images} />` for standard albums.
- Consumes: `<GalleryLightbox images={visibleImages} imageFit="contain" />` for filtered wallet photos.
- Preserves: existing wallet filters, status message, empty state, and both custom-order links.

- [ ] **Step 1: Add failing album-integration tests**

Append to `scripts/gallery-lightbox.test.cjs`:

```js
test('every standard and filtered wallet album uses the shared lightbox', () => {
  const page = read('src/app/gallery/[slug]/page.tsx');
  const wallets = read('src/components/WalletGallery.tsx');
  assert.match(page, /import GalleryLightbox from '@\/components\/GalleryLightbox'/);
  assert.match(page, /<GalleryLightbox images=\{gallery\.images\} \/>/);
  assert.doesNotMatch(page, /gallery\.images\.map\(\(image\) =>/);
  assert.match(wallets, /import GalleryLightbox from '@\/components\/GalleryLightbox'/);
  assert.match(wallets, /<GalleryLightbox images=\{visibleImages\} imageFit="contain" \/>/);
  assert.doesNotMatch(wallets, /visibleImages\.map\(\(image\) =>/);
  assert.match(wallets, /\{walletFilters\.map\(\(filter\) => \(/);
  assert.match(wallets, /href="\/#custom-order"/);
});
```

- [ ] **Step 2: Run integration tests and verify RED**

Run:

```powershell
node --test scripts/gallery-lightbox.test.cjs
```

Expected: the new integration test fails because both album paths still render their own static grids.

- [ ] **Step 3: Wire standard albums to the shared component**

In `src/app/gallery/[slug]/page.tsx`:

- Remove `import Image from 'next/image';`.
- Add `import GalleryLightbox from '@/components/GalleryLightbox';`.
- Replace the non-wallet `<div className="grid ...">...</div>` branch with:

```tsx
<GalleryLightbox images={gallery.images} />
```

Keep the wallet branch, empty state, header, footer, and custom-order panel unchanged.

- [ ] **Step 4: Wire filtered wallet albums to the shared component**

In `src/components/WalletGallery.tsx`:

- Remove `import Image from 'next/image';`.
- Add `import GalleryLightbox from '@/components/GalleryLightbox';`.
- Replace the `visibleImages.map(...)` card grid with:

```tsx
<GalleryLightbox images={visibleImages} imageFit="contain" />
```

Keep the filters, live status, empty state, and bottom custom-order CTA unchanged.

- [ ] **Step 5: Run the complete regression gate**

Before running the gate, update two existing assertions in `scripts/custom-wallets-gallery.test.cjs` so they follow the grid into its new shared component:

```js
// In "wallet route uses exact filters..."
const nonWalletLightboxIndex = page.indexOf('<GalleryLightbox images={gallery.images} />');
assert.ok(nonWalletLightboxIndex > walletComponentIndex, 'non-wallet lightbox must remain after the wallet branch');
assert.ok(emptyStateIndex > nonWalletLightboxIndex, 'non-wallet empty-state branch must remain after gallery branches');

// Replace "wallet cards preserve complete photos..." with:
test('wallet cards preserve complete photos without stretching or hover cropping', () => {
  const component = read('src/components/WalletGallery.tsx');
  const lightbox = read('src/components/GalleryLightbox.tsx');
  assert.match(component, /<GalleryLightbox images=\{visibleImages\} imageFit="contain" \/>/);
  assert.match(lightbox, /imageFit === 'contain' \? 'object-contain' : 'object-cover transition-transform duration-500 group-hover:scale-105'/);
});
```

Remove the superseded `nonWalletImageMapIndex` declaration and its two assertions. This keeps the original test's ordering guarantee while recognizing the shared grid.

Run:

```powershell
node --test scripts/gallery-lightbox.test.cjs scripts/featured-work.test.cjs scripts/custom-wallets-gallery.test.cjs
node node_modules/typescript/bin/tsc --noEmit
```

Expected: all lightbox and existing site tests pass with 0 failures; TypeScript exits successfully without output.

- [ ] **Step 6: Build the Cloudflare production package**

Create `.codex-tmp/npm.cmd` with the worktree's established Windows shim:

```bat
@echo off
if "%1"=="run" if "%2"=="build" (
  "C:\Users\conni\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\node_modules\next\dist\bin\next" build
  exit /b %ERRORLEVEL%
)
if "%1"=="exec" if "%2"=="wrangler" (
  "C:\Users\conni\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\node_modules\wrangler\bin\wrangler.js" %3 %4 %5 %6 %7 %8 %9
  exit /b %ERRORLEVEL%
)
echo Unsupported temporary npm shim command: %*
exit /b 1
```

Run:

```powershell
$env:PATH = (Resolve-Path '.codex-tmp').Path + ';C:\Users\conni\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
.\node_modules\.bin\opennextjs-cloudflare.CMD build
$node = 'C:\Users\conni\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node '.\node_modules\wrangler\bin\wrangler.js' deploy --dry-run --config wrangler.jsonc
```

Expected: Next.js generates all 26 routes, OpenNext produces `.open-next/worker.js`, and the Cloudflare dry run exits successfully.

- [ ] **Step 7: Commit the integration**

```powershell
git add scripts/gallery-lightbox.test.cjs src/components/WalletGallery.tsx src/app/gallery/[slug]/page.tsx
git commit -m "feat: open album photos in lightbox"
```

- [ ] **Step 8: Publish and verify the live album pages**

Deploy the validated OpenNext package to the existing `twisted` Cloudflare Worker using the already configured Cloudflare account environment:

```powershell
$env:PATH = (Resolve-Path '.codex-tmp').Path + ';C:\Users\conni\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback;C:\Users\conni\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
.\node_modules\.bin\opennextjs-cloudflare.CMD deploy --config wrangler.jsonc
```

Then request the Custom Wallets and Belts album URLs with cache bypass:

```powershell
$wallets = Invoke-WebRequest -Uri 'https://twistedcustomleather.com/gallery/wallets?lightbox-check=1' -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
$belts = Invoke-WebRequest -Uri 'https://twistedcustomleather.com/gallery/belts?lightbox-check=1' -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}
if ($wallets.StatusCode -ne 200 -or $belts.StatusCode -ne 200) { exit 1 }
```

Delete `.codex-tmp/npm.cmd` after deployment and confirm `git status --porcelain` is empty.

Expected: the live site serves the new lightbox on both routes, with all existing album routes and order links still present.

# Featured Work Photo Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Featured Leather Work card open its own larger, uncropped photo while preserving the four existing Google Photos albums through a View Full Album action.

**Architecture:** Keep the current seven-item data array in the server-rendered `FeaturedWork` section and pass it to one focused client component. The client component owns card selection, the accessible modal dialog, keyboard/focus behavior, and the optional album action; a separate pure model owns wraparound index and focus calculations so those rules can be tested without a browser.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Node.js built-in test runner, OpenNext for Cloudflare, Wrangler.

## Global Constraints

- All seven current Featured Work cards must open a larger photo.
- The larger image must use the same source and alternative text as its card and render with `object-contain`.
- Previous and Next navigation must wrap across all seven photos.
- Escape, Left Arrow, Right Arrow, backdrop close, focus trapping, focus restoration, body scroll locking, and body scroll restoration are required.
- Only the four items that already have `href` values may show **View Full Album**.
- All four current Google Photos URLs must remain byte-for-byte unchanged.
- The header menu, custom-order section, and unrelated pages must not change.
- No new runtime dependency may be added.

---

## File Structure

- Create `src/components/featuredWorkLightboxModel.ts`: pure index and focus-navigation functions.
- Create `src/components/FeaturedWorkLightbox.tsx`: client-side cards and accessible popup.
- Modify `src/components/FeaturedWork.tsx`: export a serializable item type, preserve the current data, and delegate rendering to the client component.
- Create `scripts/featured-work-lightbox.test.cjs`: model, component-contract, and integration-contract tests.

### Task 1: Pure Lightbox Navigation Model

**Files:**
- Create: `src/components/featuredWorkLightboxModel.ts`
- Create: `scripts/featured-work-lightbox.test.cjs`

**Interfaces:**
- Produces: `openFeaturedPhoto(count: number, requestedIndex: number): number | null`
- Produces: `previousFeaturedPhoto(currentIndex: number, count: number): number | null`
- Produces: `nextFeaturedPhoto(currentIndex: number, count: number): number | null`
- Produces: `nextFeaturedFocusIndex(currentIndex: number, focusableCount: number, moveBackward: boolean): number | null`

- [ ] **Step 1: Write the failing model tests**

Create the test harness and tests:

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
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node --test scripts/featured-work-lightbox.test.cjs`

Expected: FAIL because `src/components/featuredWorkLightboxModel.ts` does not exist.

- [ ] **Step 3: Implement the pure model**

Create:

```ts
export type FeaturedPhotoIndex = number | null;

export function openFeaturedPhoto(count: number, requestedIndex: number): FeaturedPhotoIndex {
  return Number.isInteger(requestedIndex)
    && requestedIndex >= 0
    && requestedIndex < count
    ? requestedIndex
    : null;
}

export function previousFeaturedPhoto(currentIndex: number, count: number): FeaturedPhotoIndex {
  return count > 0 ? (currentIndex - 1 + count) % count : null;
}

export function nextFeaturedPhoto(currentIndex: number, count: number): FeaturedPhotoIndex {
  return count > 0 ? (currentIndex + 1) % count : null;
}

export function nextFeaturedFocusIndex(
  currentIndex: number,
  focusableCount: number,
  moveBackward: boolean,
): FeaturedPhotoIndex {
  if (focusableCount <= 0) return null;
  if (currentIndex < 0 || currentIndex >= focusableCount) {
    return moveBackward ? focusableCount - 1 : 0;
  }
  return (currentIndex + (moveBackward ? -1 : 1) + focusableCount) % focusableCount;
}
```

- [ ] **Step 4: Run the model tests**

Run: `node --test scripts/featured-work-lightbox.test.cjs`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the model and tests**

```bash
git add scripts/featured-work-lightbox.test.cjs src/components/featuredWorkLightboxModel.ts
git commit -m "test: define featured work lightbox behavior"
```

### Task 2: Accessible Featured Work Popup Component

**Files:**
- Create: `src/components/FeaturedWorkLightbox.tsx`
- Modify: `scripts/featured-work-lightbox.test.cjs`

**Interfaces:**
- Consumes: the four pure functions from Task 1.
- Consumes: `FeaturedWorkItem[]` with `src`, `alt`, `title`, `category`, `width`, `height`, optional `position`, optional `href`, and optional `span`.
- Produces: `FeaturedWorkLightbox({ items }: { items: FeaturedWorkItem[] })`.

- [ ] **Step 1: Append a failing component-contract test**

```js
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
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node --test scripts/featured-work-lightbox.test.cjs`

Expected: the existing 3 tests PASS and the new test FAILS because the component file is missing.

- [ ] **Step 3: Implement the client component**

Implement these exact behaviors in `FeaturedWorkLightbox.tsx`:

```tsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FeaturedWorkItem } from '@/components/FeaturedWork';
import {
  nextFeaturedFocusIndex,
  nextFeaturedPhoto,
  openFeaturedPhoto,
  previousFeaturedPhoto,
} from '@/components/featuredWorkLightboxModel';

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type BackgroundState = {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
};

function makeBackgroundInert(dialog: HTMLElement) {
  const states: BackgroundState[] = [];
  let foreground: HTMLElement = dialog;
  while (foreground.parentElement) {
    const parent = foreground.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === foreground || !(sibling instanceof HTMLElement)) continue;
      states.push({
        element: sibling,
        inert: sibling.hasAttribute('inert'),
        ariaHidden: sibling.getAttribute('aria-hidden'),
      });
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
    }
    if (parent === document.body) break;
    foreground = parent;
  }
  return () => states.forEach(({ element, inert, ariaHidden }) => {
    if (!inert) element.removeAttribute('inert');
    if (ariaHidden === null) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', ariaHidden);
  });
}

export default function FeaturedWorkLightbox({ items }: { items: FeaturedWorkItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const previousOverflow = useRef('');
  const scrollPosition = useRef({ x: 0, y: 0 });
  const captionId = useId();
  const selectedItem = selectedIndex === null ? null : items[selectedIndex] ?? null;

  const close = useCallback(() => {
    const opener = openerRef.current;
    setSelectedIndex(null);
    openerRef.current = null;
    requestAnimationFrame(() => {
      opener?.focus();
      window.scrollTo(scrollPosition.current.x, scrollPosition.current.y);
    });
  }, []);

  const previous = useCallback(() => {
    setSelectedIndex((current) => current === null ? null : previousFeaturedPhoto(current, items.length));
  }, [items.length]);

  const next = useCallback(() => {
    setSelectedIndex((current) => current === null ? null : nextFeaturedPhoto(current, items.length));
  }, [items.length]);

  useEffect(() => {
    if (!selectedItem) return;
    previousOverflow.current = document.body.style.overflow;
    const restoreBackground = dialogRef.current ? makeBackgroundInert(dialogRef.current) : () => {};
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow.current;
      restoreBackground();
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
        const current = focusable.indexOf(document.activeElement as HTMLElement);
        const target = nextFeaturedFocusIndex(current, focusable.length, event.shiftKey);
        if (target !== null) {
          event.preventDefault();
          focusable[target].focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, next, previous, selectedItem]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`View larger: ${item.title}`}
            onClick={(event) => {
              const nextIndex = openFeaturedPhoto(items.length, index);
              if (nextIndex === null) return;
              openerRef.current = event.currentTarget;
              scrollPosition.current = { x: window.scrollX, y: window.scrollY };
              setSelectedIndex(nextIndex);
            }}
            className="group text-left cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
          >
            <article className={`relative overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/60 min-h-[18rem] ${item.span ?? ''}`}>
              {item.src.startsWith('http') ? (
                <img src={item.src} alt={item.alt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: item.position ?? 'center' }} />
              ) : (
                <Image src={item.src} alt={item.alt} width={item.width} height={item.height} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: item.position ?? 'center' }} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-wood-dark/80 via-wood-dark/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-copper-light text-sm font-bold uppercase">{item.category}</p>
                <h3 className="heading-western text-2xl text-cream">{item.title}</h3>
              </div>
            </article>
          </button>
        ))}
      </div>

      {selectedItem && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={captionId} onClick={(event) => { if (event.target === event.currentTarget) close(); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6">
          <button ref={closeRef} type="button" aria-label="Close larger image" onClick={close} className="absolute right-3 top-3 z-10 h-12 w-12 rounded-full border border-copper bg-charcoal/90 text-3xl text-cream">×</button>
          <button type="button" aria-label="Previous image" onClick={previous} className="absolute left-2 top-1/2 z-10 h-14 w-12 -translate-y-1/2 rounded-full border border-copper bg-charcoal/90 text-4xl text-cream sm:left-5">‹</button>
          <figure className="flex max-h-full max-w-6xl flex-col items-center gap-3 px-10 sm:px-16">
            <img src={selectedItem.src} alt={selectedItem.alt} className="max-h-[calc(100vh-10rem)] max-w-full h-auto w-auto object-contain" />
            <figcaption id={captionId} className="text-center">
              <p className="text-copper-light text-sm font-bold uppercase">{selectedItem.category}</p>
              <p className="heading-western text-xl text-cream">{selectedItem.title}</p>
            </figcaption>
            {selectedItem.href && <a href={selectedItem.href} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-copper px-5 py-3 font-bold text-charcoal hover:bg-cream">View Full Album</a>}
          </figure>
          <button type="button" aria-label="Next image" onClick={next} className="absolute right-2 top-1/2 z-10 h-14 w-12 -translate-y-1/2 rounded-full border border-copper bg-charcoal/90 text-4xl text-cream sm:right-5">›</button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run the focused tests and type check**

Run: `node --test scripts/featured-work-lightbox.test.cjs`

Expected: 4 tests PASS.

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 5: Commit the popup component**

```bash
git add scripts/featured-work-lightbox.test.cjs src/components/FeaturedWorkLightbox.tsx
git commit -m "feat: add accessible featured work photo popup"
```

### Task 3: Integrate the Popup Without Changing Album Destinations

**Files:**
- Modify: `src/components/FeaturedWork.tsx`
- Modify: `scripts/featured-work-lightbox.test.cjs`

**Interfaces:**
- Produces: exported `FeaturedWorkItem` type consumed by Task 2.
- Passes: the unchanged `featuredWork` array to `<FeaturedWorkLightbox items={featuredWork} />`.

- [ ] **Step 1: Append a failing integration test**

```js
test('all seven featured cards use the popup and existing album links remain unchanged', () => {
  const featured = read('src/components/FeaturedWork.tsx');
  const component = read('src/components/FeaturedWorkLightbox.tsx');
  const hrefs = [...featured.matchAll(/href: '([^']+)'/g)].map((match) => match[1]);
  assert.match(featured, /import FeaturedWorkLightbox/);
  assert.match(featured, /<FeaturedWorkLightbox items=\{featuredWork\} \/>/);
  assert.equal((featured.match(/title: '/g) || []).length, 7);
  assert.deepEqual(hrefs, [
    'https://photos.app.goo.gl/GpcrR32WbqrkSV4L7',
    'https://photos.google.com/share/AF1QipOsNxODm1-e7A7G3G6ZEPn-cshXXMuZRXZXyykPdt4nqefNbiUnD5bRCaW32J-fsg?key=RFJLS0hBckVXTmpubFdBU0xGbzNjSWFiXzR2VnVn',
    'https://photos.google.com/share/AF1QipPzOOqKXTMznO6pcbD_tzOVFen160_3j2S1ndp848nNXufyX3sKbKXxPNT_lbFSwA/photo/AF1QipMAfvfW-Iggd2w43t0R_LjXdGapeanTWw0qlyfS?key=QWpuY19GY1BIWWg0bndnZnFRdmY1bmZNME40RDl3',
    'https://photos.app.goo.gl/LTtAmZFpcWxB893j2',
  ]);
  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node --test scripts/featured-work-lightbox.test.cjs`

Expected: the integration test FAILS because `FeaturedWork.tsx` does not yet delegate to the popup component.

- [ ] **Step 3: Make the minimal integration change**

At the top of `FeaturedWork.tsx`, remove the now-unused `Image` import and add:

```tsx
import FeaturedWorkLightbox from '@/components/FeaturedWorkLightbox';

export type FeaturedWorkItem = {
  src: string;
  alt: string;
  title: string;
  category: string;
  width: number;
  height: number;
  span?: string;
  position?: string;
  href?: string;
};
```

Change the existing array declaration from `const featuredWork = [` to `const featuredWork: FeaturedWorkItem[] = [`. Leave every one of the seven existing object literals byte-for-byte unchanged.

Replace only the existing card grid and its inline `map` with:

```tsx
<FeaturedWorkLightbox items={featuredWork} />
```

Do not edit any item source, title, category, dimensions, position, or album URL.

- [ ] **Step 4: Run focused and project verification**

Run: `node --test scripts/featured-work-lightbox.test.cjs`

Expected: 5 tests PASS.

Run: `npx tsc --noEmit`

Expected: exit code 0.

Run: `npm run build`

Expected: Next.js production build succeeds and the homepage is generated without errors.

- [ ] **Step 5: Commit the integration**

```bash
git add scripts/featured-work-lightbox.test.cjs src/components/FeaturedWork.tsx
git commit -m "feat: open featured work photos in popup"
```

### Task 4: Production Verification and Publication

**Files:**
- Verify only; no source file is expected to change.

**Interfaces:**
- Consumes: the completed Build 1 branch.
- Produces: a reviewed GitHub change merged to `main`, followed by a successful Cloudflare deployment.

- [ ] **Step 1: Verify the complete local change set**

Run: `git diff --check origin/main...HEAD`

Expected: no whitespace errors.

Run: `node --test scripts/featured-work-lightbox.test.cjs && npx tsc --noEmit && npm run build`

Expected: all tests pass, type check exits 0, and production build succeeds.

- [ ] **Step 2: Build the Cloudflare bundle and run a deployment dry run**

Run: `npx opennextjs-cloudflare build`

Expected: `.open-next/worker.js` and `.open-next/assets` are created.

Run: `npx wrangler deploy --config wrangler.jsonc --dry-run`

Expected: Wrangler validates and packages the `twisted` Worker without publishing.

- [ ] **Step 3: Push the reviewed branch and merge it without replacing newer main content**

```bash
git push -u origin codex/build1-featured-popup
gh pr create --base main --head codex/build1-featured-popup --title "Add featured work photo popup" --body "Adds accessible larger-photo popups to the seven Featured Work cards while preserving the four existing Google Photos album links."
gh pr merge --merge --delete-branch
```

Expected: the pull request reports a clean merge. If GitHub reports a conflict or `main` moved, stop publication, merge the latest `origin/main` into the branch, re-run Steps 1 and 2, and only then merge.

- [ ] **Step 4: Confirm the production deployment**

Run: `gh run list --workflow deploy.yml --branch main --limit 1`

Expected: the newest workflow run completes successfully.

- [ ] **Step 5: Smoke-test the live website**

At `https://twistedcustomleather.com/`, verify:

1. Each of the seven Featured Leather Work cards opens its matching larger image.
2. Previous and Next reach all seven images and wrap at both ends.
3. Escape, close button, and backdrop close the popup.
4. Keyboard focus remains inside the popup and returns to the opening card.
5. Page scroll position does not jump after closing.
6. The four album cards show **View Full Album**, and each button opens the same preexisting Google Photos destination.
7. The other three cards do not show an album button.
8. The header menu, custom-order section, checkout, and mobile layout still work.

Expected: all eight checks pass before reporting publication complete.

# Custom Wallets Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Products menu to album links and turn `/gallery/wallets` into a single filterable Custom Wallets gallery containing the existing collection plus selected Roper and Tri-fold work.

**Architecture:** Keep the existing gallery route and shared data module. Add an optional wallet category to gallery records, render the wallet collection through a focused client component, and leave every non-wallet album on the current server-rendered grid. A repeatable Sharp script prepares selected source photos as padded WebP assets without changing originals.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Node.js, Sharp, Node's built-in test runner.

## Global Constraints

- Keep `/gallery/wallets` as the public wallet URL.
- Remove individual wallet product links from both desktop and mobile Products menus.
- Keep all existing album links and destinations.
- Filters are `All`, `Bifold`, `Tri-fold`, `Roper`, `Biker`, and `Checkbook/Long`.
- Both custom-order actions link to `/#custom-order`.
- Do not alter or delete source files under `D:/TCL Photos`.
- Do not remove existing watermarks from photographs.
- Preserve the existing header, footer, video background, metadata pattern, and non-wallet galleries.
- The worktree already contains overlapping uncommitted gallery work. Do not stage or commit implementation files automatically; review the final diff without disturbing pre-existing changes.

---

## File Map

- Create `scripts/prepare-roper-trifold-wallet-images.cjs`: deterministic HEIC/JPG-to-WebP preparation for the selected wallet photos.
- Create `scripts/custom-wallets-gallery.test.cjs`: dependency-free contract checks for navigation, categories, route wiring, and generated files.
- Create `src/components/WalletGallery.tsx`: wallet filter state, accessible filter controls, filtered cards, empty state, and bottom order action.
- Modify `src/components/Header.tsx`: remove the individual Wallets group from desktop and mobile menus and relabel Photo Albums as Albums.
- Modify `src/data/galleries.ts`: add wallet category types, rename the wallet gallery, categorize existing records, and register new images.
- Modify `src/app/gallery/[slug]/page.tsx`: use `WalletGallery` only for the wallet slug and retain the existing grid for every other gallery.
- Create WebP files under `public/gallery/wallets/`: prepared Roper and Tri-fold assets.

### Task 1: Lock the Navigation Contract and Simplify the Products Menu

**Files:**
- Create: `scripts/custom-wallets-gallery.test.cjs`
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: the existing `photoAlbums` destinations in `Header.tsx`.
- Produces: desktop and mobile Products menus with album links only.

- [ ] **Step 1: Write the failing navigation contract test**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Products menu contains albums and no individual wallet product links', () => {
  const header = read('src/components/Header.tsx');
  assert.doesNotMatch(header, /\/products\/wallets\//);
  assert.doesNotMatch(header, />\s*Wallets\s*</);
  assert.match(header, />\s*Albums\s*</);
  assert.match(header, /href=\{photoAlbums\.wallets\}/);
});
```

- [ ] **Step 2: Run the test and verify the current menu fails**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: FAIL because `Header.tsx` still includes `/products/wallets/` links and the `Wallets` heading.

- [ ] **Step 3: Remove the Wallets groups from both menus**

In the desktop dropdown, delete the first `<div className="px-3 py-2">` containing the Wallets heading and five wallet product links. Change the remaining wrapper from:

```tsx
<div className="border-t border-copper/30 mt-2 pt-2 px-3">
  <p className="text-xs text-sage uppercase tracking-wide font-bold px-3 py-1">
    Photo Albums
  </p>
```

to:

```tsx
<div className="px-3 py-2">
  <p className="text-xs text-sage uppercase tracking-wide font-bold px-3 py-1">
    Albums
  </p>
```

In the mobile submenu, delete the Wallets heading and five wallet product links. Change its Photo Albums label to:

```tsx
<p className="text-xs text-sage uppercase tracking-wide font-bold px-2 py-1">
  Albums
</p>
```

- [ ] **Step 4: Run the navigation contract**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: PASS for the Products menu test.

- [ ] **Step 5: Inspect the focused diff**

Run: `git diff -- src/components/Header.tsx scripts/custom-wallets-gallery.test.cjs`

Expected: only the Wallets group removal, album label changes, and the new contract test appear alongside any clearly identified pre-existing Header changes.

### Task 2: Prepare and Categorize the Wallet Photography

**Files:**
- Create: `scripts/prepare-roper-trifold-wallet-images.cjs`
- Modify: `scripts/custom-wallets-gallery.test.cjs`
- Modify: `src/data/galleries.ts`
- Create: `public/gallery/wallets/roper-*.webp`
- Create: `public/gallery/wallets/trifold-*.webp`

**Interfaces:**
- Produces: `WalletCategory = 'bifold' | 'trifold' | 'roper' | 'biker' | 'checkbook-long'` and `GalleryImage.category?: WalletCategory`.
- Produces: WebP assets referenced by `galleries.ts`.

- [ ] **Step 1: Extend the contract test before changing data**

Append:

```js
test('wallet gallery defines every required filter category', () => {
  const galleries = read('src/data/galleries.ts');
  for (const category of ['bifold', 'trifold', 'roper', 'biker', 'checkbook-long']) {
    assert.match(galleries, new RegExp(`category: '${category}'`));
  }
  assert.match(galleries, /title: 'Custom Wallets'/);
});

test('selected Roper and Tri-fold WebP assets exist', () => {
  const names = [
    'roper-air-force.webp',
    'roper-floral-initials.webp',
    'roper-personal-message-interior.webp',
    'roper-wr-basket-weave.webp',
    'roper-ranch-action.webp',
    'roper-deer-brand.webp',
    'trifold-floral-set.webp',
    'trifold-brown-interior.webp',
    'trifold-floral-initial.webp',
    'trifold-scripture-interior.webp',
    'trifold-pnut-floral.webp',
    'trifold-ranch-floral.webp',
  ];
  for (const name of names) {
    assert.equal(fs.existsSync(path.join(root, 'public/gallery/wallets', name)), true, name);
  }
});
```

- [ ] **Step 2: Run the tests and verify category and asset failures**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: navigation passes; category and asset tests fail.

- [ ] **Step 3: Create the deterministic preparation script**

Create the complete script:

```js
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../node_modules/.pnpm/node_modules/sharp');

const outputDir = path.join(process.cwd(), 'public', 'gallery', 'wallets');
const sourceSets = [
  ['D:/TCL Photos/Roper Wallets', 'IMG_0044.JPG', 'roper-air-force.webp'],
  ['D:/TCL Photos/Roper Wallets', 'IMG_0211.JPG', 'roper-floral-initials.webp'],
  ['D:/TCL Photos/Roper Wallets', 'IMG_0682.HEIC', 'roper-personal-message-interior.webp'],
  ['D:/TCL Photos/Roper Wallets', 'IMG_0442 (W)-2.HEIC', 'roper-wr-basket-weave.webp'],
  ['D:/TCL Photos/Roper Wallets', 'IMG_0641.HEIC', 'roper-ranch-action.webp'],
  ['D:/TCL Photos/Roper Wallets', 'IMG_1258-(W).HEIC', 'roper-deer-brand.webp'],
  ['D:/TCL Photos/tri-folds', 'F30FB1C9-3EDA-4CBF-8F18-F91A8B1E1AFB.JPG', 'trifold-floral-set.webp'],
  ['D:/TCL Photos/tri-folds', 'IMG_0029.JPG', 'trifold-brown-interior.webp'],
  ['D:/TCL Photos/tri-folds', 'IMG_0671.HEIC', 'trifold-floral-initial.webp'],
  ['D:/TCL Photos/tri-folds', 'IMG_0689.HEIC', 'trifold-scripture-interior.webp'],
  ['D:/TCL Photos/tri-folds', 'IMG_1353.HEIC', 'trifold-pnut-floral.webp'],
  ['D:/TCL Photos/tri-folds', 'IMG_1523.JPG', 'trifold-ranch-floral.webp'],
];

async function prepare(sourceDir, inputFile, outputFile) {
  const input = path.join(sourceDir, inputFile);
  const output = path.join(outputDir, outputFile);
  fs.mkdirSync(outputDir, { recursive: true });

  const metadata = await sharp(input, { limitInputPixels: false }).rotate().metadata();
  const landscape = (metadata.width ?? 0) > (metadata.height ?? 0);
  const width = landscape ? 1600 : 1200;
  const height = landscape ? 1200 : 1600;
  const resized = await sharp(input, { limitInputPixels: false })
    .rotate()
    .resize(width - 120, height - 120, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();

  await sharp({ create: { width, height, channels: 3, background: '#000000' } })
    .composite([{ input: resized, gravity: 'center' }])
    .webp({ quality: 86 })
    .toFile(output);

  return { inputFile, output: `/gallery/wallets/${outputFile}`, width, height };
}

async function main() {
  const prepared = [];
  for (const source of sourceSets) prepared.push(await prepare(...source));
  console.log(JSON.stringify(prepared, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 4: Run the preparation script**

Run: `node scripts/prepare-roper-trifold-wallet-images.cjs`

Expected: 12 output paths and dimensions are printed; the source photographs remain unchanged.

- [ ] **Step 5: Add category typing and gallery entries**

At the top of `galleries.ts`, use:

```ts
export type WalletCategory = 'bifold' | 'trifold' | 'roper' | 'biker' | 'checkbook-long';

export type GalleryImage = {
  src: string;
  alt: string;
  title: string;
  width: number;
  height: number;
  category?: WalletCategory;
};
```

Change the wallet record to `title: 'Custom Wallets'` and update its description to `Custom bifolds, tri-folds, ropers, biker wallets, checkbook wallets, and tooled details made to be carried and used.` Assign the existing `bifold-*` records to `bifold`, `biker-*` records to `biker`, `roper-wallet-front.webp` to `roper`, and the remaining existing wallet records to `checkbook-long`. Add these exact records after the existing wallet records:

```ts
{ src: '/gallery/wallets/roper-air-force.webp', alt: 'Custom Air Force basket-weave leather Roper wallet with painted blue insignia', title: 'Air Force Roper wallet', category: 'roper', ...portrait },
{ src: '/gallery/wallets/roper-floral-initials.webp', alt: 'Hand-tooled floral leather Roper wallet with turquoise initials', title: 'Floral initial Roper', category: 'roper', ...portrait },
{ src: '/gallery/wallets/roper-personal-message-interior.webp', alt: 'Open custom Roper wallet with a personal engraved message and floral deer tooling', title: 'Personal message Roper interior', category: 'roper', ...portrait },
{ src: '/gallery/wallets/roper-wr-basket-weave.webp', alt: 'Basket-weave custom leather Roper wallet with black WR initials', title: 'WR basket-weave Roper', category: 'roper', ...portrait },
{ src: '/gallery/wallets/roper-ranch-action.webp', alt: 'Custom leather Roper wallet with painted rodeo action silhouettes and blue initials', title: 'Ranch action Roper', category: 'roper', ...portrait },
{ src: '/gallery/wallets/roper-deer-brand.webp', alt: 'Basket-weave custom leather Roper wallet with a white deer and ranch brand', title: 'Deer and brand Roper', category: 'roper', ...portrait },
{ src: '/gallery/wallets/trifold-floral-set.webp', alt: 'Coordinated hand-tooled floral leather tri-fold wallet and belt set', title: 'Floral wallet and belt set', category: 'trifold', ...landscape },
{ src: '/gallery/wallets/trifold-brown-interior.webp', alt: 'Open brown leather tri-fold wallet showing card slots and center identification window', title: 'Brown tri-fold interior', category: 'trifold', ...portrait },
{ src: '/gallery/wallets/trifold-floral-initial.webp', alt: 'Hand-tooled floral leather tri-fold wallet with painted blue initials', title: 'Floral initial tri-fold', category: 'trifold', ...portrait },
{ src: '/gallery/wallets/trifold-scripture-interior.webp', alt: 'Open custom leather tri-fold wallet with card slots, center window, and engraved scripture', title: 'Scripture tri-fold interior', category: 'trifold', ...portrait },
{ src: '/gallery/wallets/trifold-pnut-floral.webp', alt: 'Hand-tooled floral leather tri-fold wallet personalized with the name Pnut', title: 'Pnut floral tri-fold', category: 'trifold', ...portrait },
{ src: '/gallery/wallets/trifold-ranch-floral.webp', alt: 'Custom floral leather tri-fold wallet with ranch mark and painted turquoise lettering', title: 'Ranch floral tri-fold', category: 'trifold', ...portrait },
```

Every wallet image must have a category; non-wallet gallery images must omit it.

- [ ] **Step 6: Run the contract test**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: all current contract tests pass.

### Task 3: Add Accessible Client-Side Filtering

**Files:**
- Create: `src/components/WalletGallery.tsx`
- Modify: `scripts/custom-wallets-gallery.test.cjs`
- Modify: `src/app/gallery/[slug]/page.tsx`

**Interfaces:**
- Consumes: `GalleryImage[]` and `WalletCategory` from `@/data/galleries`.
- Produces: `<WalletGallery images={gallery.images} />`.

- [ ] **Step 1: Add a failing route/component contract**

Append:

```js
test('wallet route delegates to the accessible filter component', () => {
  const page = read('src/app/gallery/[slug]/page.tsx');
  const component = read('src/components/WalletGallery.tsx');
  assert.match(page, /<WalletGallery images=\{gallery\.images\}/);
  assert.match(component, /aria-pressed=\{activeCategory === filter\.value\}/);
  assert.match(component, /href="\/#custom-order"/);
});
```

- [ ] **Step 2: Run the test and verify the missing component fails**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: FAIL because `WalletGallery.tsx` does not exist.

- [ ] **Step 3: Create `WalletGallery.tsx`**

Create the complete client component:

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { GalleryImage, WalletCategory } from '@/data/galleries';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'bifold', label: 'Bifold' },
  { value: 'trifold', label: 'Tri-fold' },
  { value: 'roper', label: 'Roper' },
  { value: 'biker', label: 'Biker' },
  { value: 'checkbook-long', label: 'Checkbook / Long' },
] as const;

type WalletGalleryProps = { images: GalleryImage[] };
type ActiveCategory = 'all' | WalletCategory;

export default function WalletGallery({ images }: WalletGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const visibleImages = activeCategory === 'all'
    ? images
    : images.filter((image) => image.category === activeCategory);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8" aria-label="Filter custom wallets by style">
        {filters.map((filter) => {
          const selected = activeCategory === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveCategory(filter.value)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper ${selected ? 'border-copper bg-copper text-charcoal' : 'border-copper/40 bg-wood-dark/70 text-cream hover:border-copper hover:text-copper-light'}`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {visibleImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" aria-live="polite">
          {visibleImages.map((image) => (
            <article key={image.src} className="group overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/70 card-glow">
              <div className="relative aspect-[4/3] bg-charcoal">
                <Image src={image.src} alt={image.alt} width={image.width} height={image.height} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:scale-100" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
              </div>
              <div className="p-5"><h2 className="heading-western text-2xl text-cream">{image.title}</h2></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass rounded-lg border border-copper/30 p-8 text-center">
          <p className="text-beige mb-4">No examples are shown in this category yet.</p>
          <Link href="/#custom-order" className="text-copper-light font-bold hover:text-cream">Start a custom order</Link>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/#custom-order" className="inline-flex items-center justify-center rounded-lg bg-copper px-6 py-3 text-charcoal font-bold hover:bg-cream transition-colors">Start Your Custom Order</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Route only the wallet slug through the client component**

Import `WalletGallery` and replace the gallery-body conditional with:

```tsx
{gallery.images.length > 0 ? (
  gallery.slug === 'wallets' ? (
    <WalletGallery images={gallery.images} />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {gallery.images.map((image) => (
        <article
          key={image.src}
          className="group overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/70 card-glow"
        >
          <div className="relative aspect-[4/3] bg-charcoal">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-5">
            <h2 className="heading-western text-2xl text-cream">{image.title}</h2>
          </div>
        </article>
      ))}
    </div>
  )
) : (
  <div className="glass rounded-lg border border-copper/30 p-8 md:p-10 text-center">
    <h2 className="heading-western text-3xl text-cream mb-3">New photos coming soon</h2>
    <p className="text-beige max-w-2xl mx-auto">
      We are refreshing this gallery with newer custom work. For now, start a custom order and tell us what kind of portfolio or cover you have in mind.
    </p>
  </div>
)}
```

- [ ] **Step 5: Run the contract tests and production build**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: all tests pass.

Run: `npm run build`

Expected: Next.js build completes with no TypeScript or route errors.

### Task 4: Verify the Finished Experience Without Disturbing Other Work

**Files:**
- Verify only; change the smallest relevant file if a defect is found.

**Interfaces:**
- Consumes: the built page and menu behavior from Tasks 1–3.
- Produces: a verified desktop and mobile Custom Wallets experience.

- [ ] **Step 1: Run all automated checks together**

Run: `node --test scripts/custom-wallets-gallery.test.cjs`

Expected: all tests pass.

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 2: Inspect the focused source and asset diff**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: new wallet assets/component/test/script and modified Header/gallery files are visible; pre-existing unrelated changes remain untouched.

- [ ] **Step 3: Verify in a local browser**

Open `/gallery/wallets` and confirm: the heading says Custom Wallets; All shows the complete set; every category button shows only matching cards; the buttons wrap on mobile; both order actions reach `/#custom-order`; the Products dropdown contains album links only; non-wallet albums still open.

- [ ] **Step 4: Stop before publishing**

Do not deploy or push. Report the local result and ask for explicit publishing authorization because the user requested a site change but did not request deployment.

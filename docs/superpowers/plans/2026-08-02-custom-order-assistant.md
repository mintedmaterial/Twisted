# Guided Custom Order Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current cart-style custom-order form with a guided, one-piece-at-a-time assistant that helps customers choose the right options, attach reference photos, review the full starting-price payment, and continue to Square confidently.

**Architecture:** Keep Square as the payment provider and the existing `/api/checkout` entry point, but move all product rules and price calculations into shared pure modules that are independently testable. Build the interface as three focused React steps, store only non-sensitive draft choices in the browser, and use a private Cloudflare R2 bucket for short-lived reference photos. The server remains authoritative for the selected product, allowed options, full starting total, payment note, order reference, and Square redirect.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Tailwind CSS 4, Cloudflare Workers/OpenNext, Cloudflare R2, Square Payment Links API, Node built-in `node:test`.

## Global Constraints

- One custom piece per checkout; quantities and multi-item carts are not supported.
- Square collects the full starting price immediately.
- Preserve the existing `#custom-order` anchor and the current product IDs and starting prices.
- Show only product-relevant questions and always include an “I need help deciding” choice where a customer may not know the answer.
- Require the approved starting-price acknowledgement before opening Square.
- Accept at most three JPEG or PNG source images per order, no larger than 8 MB each, and use Cloudflare Images to decode/re-encode them sequentially as canonical non-animated JPEG.
- Store reference images privately in R2, expose only unlisted token URLs, and automatically delete objects after 90 days.
- Use a 500-character Square payment note containing only compact references. Store private measurements, contact data, and attached-image URLs in the signed `order-manifests/` R2 record.
- Store only product and customization draft data in local browser storage; never store name, email, phone, address, or payment data. Drafts expire after seven days.
- Preserve all four existing Google Photos album links exactly as they are.
- Do not add customer accounts, an order portal, an inventory system, multiple-item checkout, or automatic final-price quoting.
- Do not publish or create Cloudflare resources without explicit approval at execution time.

---

## File Responsibility Map

| File | Responsibility |
|---|---|
| `src/data/checkout-products.ts` | Canonical products, starting prices, categories, relevant fields, and allowed paid upgrades. |
| `src/components/custom-order/orderAssistantModel.ts` | Pure draft, validation, pricing, delivery-window, and order-reference helpers. |
| `src/components/custom-order/orderDraftStorage.ts` | Seven-day non-sensitive local draft serialization. |
| `src/components/custom-order/CustomOrderAssistant.tsx` | Three-step controller, query preselection, submission, and error/focus management. |
| `src/components/custom-order/OrderProgress.tsx` | Accessible step indicator. |
| `src/components/custom-order/ProductSelectionStep.tsx` | One-product selection cards. |
| `src/components/custom-order/CustomizationStep.tsx` | Product-specific fields and reference-image controls. |
| `src/components/custom-order/OrderReviewStep.tsx` | Contact fields, price summary, acknowledgement, and Square action. |
| `src/components/custom-order/OrderTrustPanel.tsx` | Trust facts and existing Google/Facebook review links. |
| `src/components/custom-order/CustomOrderFaq.tsx` | Custom-order FAQ copy. |
| `src/lib/custom-order-checkout.ts` | Server request parsing, validation, authoritative total, order reference, and compact payment note. |
| `src/lib/order-assets.ts` | Image limits, key/token creation, metadata, and token verification. |
| `src/app/api/order-assets/route.ts` | Private R2 image upload endpoint. |
| `src/app/api/order-assets/[token]/route.ts` | Token-gated inline image retrieval endpoint. |
| `src/app/api/checkout/route.ts` | Cloudflare/Square orchestration using validated server output. |
| `src/components/FeaturedWork.tsx` | Gallery-to-product and stable reference mappings. |
| `src/components/FeaturedWorkLightbox.tsx` | “Make One Like This” handoff while retaining album links. |
| `src/app/checkout/success/page.tsx` | Order reference and post-payment timeline. |
| `wrangler.jsonc` | Private R2 bucket binding. |
| `cloudflare-env.d.ts` | Generated R2 binding type. |
| `package.json` | Unified test command. |

---

### Task 1: Canonical Product Rules and Pure Assistant Model

**Files:**
- Modify: `src/data/checkout-products.ts`
- Create: `src/components/custom-order/orderAssistantModel.ts`
- Create: `scripts/custom-order-assistant-model.test.cjs`

**Interfaces:**
- Produces: `CheckoutProduct`, `CustomizationFieldKey`, `ProductCategory`, `PaidUpgrade`, `getCheckoutProduct(id)`, `getVisibleFields(id)`, `validateCustomization(productId, values)`, `calculateOrderTotal(productId, upgradeIds)`, `calculateDeliveryWindow(now)`, and `makeOrderReference(randomBytes?)`.
- Consumes: Existing product IDs, names, descriptions, and dollar amounts without changing them.

- [ ] **Step 1: Write the failing model test**

Create a Node test that transpiles both TypeScript modules and asserts the product-specific rules:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

test('wallets, belts, and covers expose only relevant fields', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  assert.deepEqual(model.getVisibleFields('custom-wallet'), ['walletStyle', 'primaryColor', 'secondaryColor', 'leatherMaterial', 'toolingDesign']);
  assert.deepEqual(model.getVisibleFields('custom-belt'), ['pantsSize', 'beltSizing', 'foldHole', 'beltWidth', 'buckle', 'primaryColor', 'toolingDesign']);
  assert.deepEqual(model.getVisibleFields('bible-cover'), ['coverDimensions', 'bookType', 'closure', 'primaryColor', 'toolingDesign']);
});

test('one product and allowed upgrades determine the full starting total', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  assert.equal(model.calculateOrderTotal('custom-wallet', []), 140);
  assert.equal(model.calculateOrderTotal('custom-wallet', ['gator']), 190);
  assert.throws(() => model.calculateOrderTotal('custom-wallet', ['not-real']), /not available/i);
});

test('an order reference uses the TCL prefix and six uppercase characters', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  assert.equal(model.makeOrderReference(Uint8Array.from([0, 1, 2, 3, 4, 5])), 'TCL-ABCDEF');
});
```

If `scripts/test-helpers.cjs` does not yet exist, create it in this step with the same TypeScript `transpileModule` plus `vm` loader pattern already used by `scripts/featured-work-lightbox.test.cjs`, including support for relative imports.

- [ ] **Step 2: Run the model test and verify it fails**

Run: `node --test scripts/custom-order-assistant-model.test.cjs`

Expected: FAIL because `orderAssistantModel.ts` and the expanded product schema do not exist.

- [ ] **Step 3: Expand the product schema and implement the pure helpers**

Define these exact public shapes:

```ts
export type ProductCategory = 'wallet' | 'belt' | 'cover' | 'welding' | 'guitar-strap' | 'purse';
export type CustomizationFieldKey =
  | 'walletStyle' | 'primaryColor' | 'secondaryColor' | 'leatherMaterial' | 'toolingDesign'
  | 'pantsSize' | 'beltSizing' | 'foldHole' | 'beltWidth' | 'buckle'
  | 'coverDimensions' | 'bookType' | 'closure'
  | 'gearType' | 'fitNotes' | 'specialFinish'
  | 'strapLength' | 'strapWidth' | 'attachment' | 'hardware'
  | 'bagDimensions' | 'carryStyle' | 'pockets';

export interface PaidUpgrade {
  id: 'stingray' | 'gator' | 'ostrich' | 'lace-stitching';
  label: string;
  amount: number;
}

export interface CheckoutProduct {
  id: string;
  name: string;
  description: string;
  amount: number;
  category: ProductCategory;
  fieldKeys: CustomizationFieldKey[];
  requiredFieldKeys: CustomizationFieldKey[];
  upgrades: PaidUpgrade[];
}

export type CustomizationValues = Partial<Record<CustomizationFieldKey, string>>;
```

Use immutable product arrays, reuse a shared `HELP_ME = 'I need help deciding'` option in field metadata, and make `calculateOrderTotal` reject duplicate or unavailable upgrades rather than trusting the client. Generate references from the alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` to avoid ambiguous characters.

Use this exact product mapping (field order is display order):

| Product IDs | Category | Visible fields | Required fields | Allowed upgrades |
|---|---|---|---|---|
| `custom-wallet`, `tooled-wallet` | `wallet` | `walletStyle`, `primaryColor`, `secondaryColor`, `leatherMaterial`, `toolingDesign` | `walletStyle`, `primaryColor`, `leatherMaterial`, `toolingDesign` | `stingray`, `gator`, `ostrich`, `lace-stitching` |
| `custom-belt`, `floral-tooled-belt` | `belt` | `pantsSize`, `beltSizing`, `foldHole`, `beltWidth`, `buckle`, `primaryColor`, `toolingDesign` | `pantsSize`, `beltSizing`, `foldHole`, `beltWidth`, `buckle` | `stingray`, `gator`, `ostrich`, `lace-stitching` |
| `bible-cover` | `cover` | `coverDimensions`, `bookType`, `closure`, `primaryColor`, `toolingDesign` | `coverDimensions`, `bookType`, `closure` | `stingray`, `gator`, `ostrich`, `lace-stitching` |
| `welding-armguard`, `welding-hood`, `welding-knee-pads` | `welding` | `gearType`, `fitNotes`, `specialFinish`, `primaryColor`, `toolingDesign` | `gearType`, `fitNotes` | `lace-stitching` |
| `guitar-strap` | `guitar-strap` | `strapLength`, `strapWidth`, `attachment`, `hardware`, `primaryColor`, `toolingDesign` | `strapLength`, `strapWidth`, `attachment` | `lace-stitching` |
| `custom-purse` | `purse` | `bagDimensions`, `carryStyle`, `pockets`, `strapLength`, `hardware`, `primaryColor`, `secondaryColor`, `leatherMaterial`, `toolingDesign` | `bagDimensions`, `carryStyle`, `pockets` | `stingray`, `gator`, `ostrich`, `lace-stitching` |

Define field labels and controls centrally: `walletStyle` (“Wallet style or layout,” select with `Roper`, `Bifold`, `Trifold`, `Clutch`, `Biker`, `Slim`, and help option); colors/material/tooling/fit/dimensions/pockets use text inputs or textareas with the help option accepted as typed value; `beltSizing` (“How will you measure?”, select with `Existing belt`, `Body measurement`, and help option); `foldHole` (“Fold to most-used hole,” text); `beltWidth` (select `1 inch`, `1.25 inches`, `1.5 inches`, `1.75 inches`, help option); `buckle` (select `Use my buckle`, `Include a buckle`, help option); `bookType` (select `Bible`, `Book`, `Planner`, `Legal pad`, help option); `closure` (select `None`, `Snap`, `Zipper`, help option); `gearType` is fixed to the selected welding product name; `carryStyle` (select `Handheld`, `Shoulder`, `Crossbody`, help option); and `attachment` (select `Standard guitar strap buttons`, `Acoustic headstock tie`, help option). Every select includes the help option, and every text field displays “Enter ‘I need help deciding’ if you would like Randy’s guidance.”

- [ ] **Step 4: Run the model test and the existing gallery model test**

Run: `node --test scripts/custom-order-assistant-model.test.cjs scripts/featured-work-lightbox.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the model**

```bash
git add src/data/checkout-products.ts src/components/custom-order/orderAssistantModel.ts scripts/test-helpers.cjs scripts/custom-order-assistant-model.test.cjs
git commit -m "feat: define custom order product rules"
```

---

### Task 2: Three-Step Custom Order Interface

**Files:**
- Create: `src/components/custom-order/CustomOrderAssistant.tsx`
- Create: `src/components/custom-order/OrderProgress.tsx`
- Create: `src/components/custom-order/ProductSelectionStep.tsx`
- Create: `src/components/custom-order/CustomizationStep.tsx`
- Create: `src/components/custom-order/OrderReviewStep.tsx`
- Modify: `src/components/CustomOrderCheckout.tsx`
- Create: `scripts/custom-order-assistant-component.test.cjs`

**Interfaces:**
- Consumes: Product and model exports from Task 1.
- Produces: `CustomOrderDraft`, three-step keyboard-accessible navigation, one selected product, visible-field-only customization, contact details held only in React state, acknowledgement state, and `/api/checkout` submission.

- [ ] **Step 1: Write the failing component contract test**

The test should read/transpile the new files and assert the fixed step labels, visible labels, acknowledgement copy, one-item request shape, and absence of quantity controls:

```js
test('assistant presents the three approved steps and one-piece request', () => {
  const source = read('src/components/custom-order/CustomOrderAssistant.tsx');
  const progress = read('src/components/custom-order/OrderProgress.tsx');
  const review = read('src/components/custom-order/OrderReviewStep.tsx');
  assert.match(progress, /Choose Your Piece/);
  assert.match(progress, /Customize It/);
  assert.match(progress, /Review & Pay/);
  assert.match(review, /I understand that I am paying the full starting price/);
  assert.match(source, /productId/);
  assert.doesNotMatch(source, /quantity|cartItems|updateQuantity/);
});
```

- [ ] **Step 2: Run the component test and verify it fails**

Run: `node --test scripts/custom-order-assistant-component.test.cjs`

Expected: FAIL because the step components do not exist.

- [ ] **Step 3: Implement the step components and controller**

Use this state contract:

```ts
export interface CustomOrderDraft {
  productId: string;
  customization: CustomizationValues;
  upgradeIds: PaidUpgrade['id'][];
  referenceId?: string;
  referenceImages: UploadedReference[];
}

type Step = 1 | 2 | 3;
```

`ProductSelectionStep` renders the ten existing products as radio-style buttons; selecting a different product clears fields and upgrades that are not legal for the new product. `CustomizationStep` renders only `getVisibleFields(productId)` with real `<label htmlFor>` elements and helper text. `OrderReviewStep` renders the selected piece, entered choices, full starting total, estimated 42–56 day window, customer name/email/phone fields, extra notes, the exact acknowledgement from the design spec, and “Continue To Secure Square Checkout.”

The acknowledgement must appear verbatim:

> I understand that I am paying the full starting price for this custom piece. Twisted Custom Leather will confirm the design and measurements before work begins. Upgrades or changes I approve may require an additional payment.

On invalid Next/Pay, place a linked error summary above the relevant fields and focus it with `requestAnimationFrame`. After step changes, focus the new `<h3 tabIndex={-1}>`. At 390 px, all buttons and cards must remain single-column with at least 44 px touch targets.

Replace `CustomOrderCheckout.tsx` with a thin compatibility wrapper:

```tsx
import CustomOrderAssistant from '@/components/custom-order/CustomOrderAssistant';

export default function CustomOrderCheckout() {
  return <CustomOrderAssistant />;
}
```

Keep the outer `<section id="custom-order">` inside `CustomOrderAssistant`.

- [ ] **Step 4: Run model and component tests**

Run: `node --test scripts/custom-order-assistant-model.test.cjs scripts/custom-order-assistant-component.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Run the TypeScript checker**

Run: `npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 6: Commit the assistant UI**

```bash
git add src/components/CustomOrderCheckout.tsx src/components/custom-order scripts/custom-order-assistant-component.test.cjs
git commit -m "feat: add guided custom order assistant"
```

---

### Task 3: Safe Draft Persistence and Gallery Preselection

**Files:**
- Create: `src/components/custom-order/orderDraftStorage.ts`
- Create: `scripts/custom-order-draft.test.cjs`
- Modify: `src/components/custom-order/CustomOrderAssistant.tsx`
- Modify: `src/components/FeaturedWork.tsx`
- Modify: `src/components/FeaturedWorkLightbox.tsx`
- Modify: `scripts/featured-work-lightbox.test.cjs`

**Interfaces:**
- Consumes: `CustomOrderDraft` minus `referenceImages`, plus the existing `FeaturedWorkItem` and popup behavior.
- Produces: `saveOrderDraft`, `loadOrderDraft`, `clearOrderDraft`, `productId`/`referenceId` query preselection, and a stable gallery handoff URL.

- [ ] **Step 1: Write failing draft privacy and expiry tests**

```js
test('saved drafts omit personal and uploaded-image data', () => {
  const stored = model.serializeOrderDraft({
    productId: 'custom-wallet', customization: { primaryColor: 'brown' }, upgradeIds: [],
    referenceImages: [{ name: 'secret.jpg', url: '/api/order-assets/token' }],
    customerName: 'Connie', email: 'person@example.com', phone: '555-1111'
  }, new Date('2026-08-02T12:00:00Z'));
  assert.doesNotMatch(stored, /Connie|person@example|555-1111|secret\.jpg|order-assets/);
});

test('drafts expire after seven days', () => {
  const stored = model.serializeOrderDraft({ productId: 'custom-wallet', customization: {}, upgradeIds: [] }, new Date('2026-08-02T12:00:00Z'));
  assert.equal(model.parseOrderDraft(stored, new Date('2026-08-10T12:00:01Z')), null);
});
```

- [ ] **Step 2: Run the draft and gallery tests and verify failure**

Run: `node --test scripts/custom-order-draft.test.cjs scripts/featured-work-lightbox.test.cjs`

Expected: FAIL for missing persistence functions and missing gallery handoff.

- [ ] **Step 3: Implement seven-day draft storage**

Use key `twisted-custom-order-draft-v1` and this stored shape only:

```ts
interface StoredOrderDraft {
  expiresAt: string;
  productId: string;
  customization: CustomizationValues;
  upgradeIds: PaidUpgrade['id'][];
  referenceId?: string;
}
```

`parseOrderDraft` must reject malformed JSON, expired data, unknown products, unknown field keys, and upgrades not available for the saved product. `CustomOrderAssistant` loads once after hydration, saves after product/customization changes, and clears the draft after receiving a Square checkout URL.

- [ ] **Step 4: Add gallery product/reference mappings and CTA**

Extend the item type:

```ts
productId?: string;
referenceId?: string;
```

Map each featured item to one of the existing product IDs (`custom-wallet`, `custom-purse`, `custom-belt`, `welding-armguard`, or `bible-cover`) and a stable kebab-case reference such as `wallet-set`. In the popup, render:

```tsx
{selectedItem.productId && selectedItem.referenceId && (
  <a href={`/?product=${encodeURIComponent(selectedItem.productId)}&reference=${encodeURIComponent(selectedItem.referenceId)}#custom-order`}>
    Make One Like This
  </a>
)}
```

Keep every existing `href` unchanged and continue rendering “View Full Album” for exactly those four items.

- [ ] **Step 5: Run tests and type checking**

Run: `node --test scripts/custom-order-draft.test.cjs scripts/featured-work-lightbox.test.cjs scripts/custom-order-assistant-component.test.cjs && npx tsc --noEmit`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit draft and gallery handoff**

```bash
git add src/components/custom-order/orderDraftStorage.ts src/components/custom-order/CustomOrderAssistant.tsx src/components/FeaturedWork.tsx src/components/FeaturedWorkLightbox.tsx scripts/custom-order-draft.test.cjs scripts/featured-work-lightbox.test.cjs
git commit -m "feat: connect gallery references to custom orders"
```

---

### Task 4: Authoritative One-Piece Square Checkout

**Files:**
- Create: `src/lib/custom-order-checkout.ts`
- Create: `scripts/custom-order-checkout.test.cjs`
- Modify: `src/app/api/checkout/route.ts`

**Interfaces:**
- Consumes: `productId`, `customization`, `upgradeIds`, `referenceImages`, contact fields, notes, `acknowledgedStartingPrice: true`, and shared product rules.
- Produces: `ValidatedCustomOrder`, `validateCheckoutRequest(input)`, `makePaymentNote(order)`, and a Square Payment Link redirect containing `?ref=TCL-XXXXXX`.

- [ ] **Step 1: Write failing validation and note-priority tests**

```js
test('rejects missing acknowledgement and illegal upgrades', () => {
  assert.throws(() => checkout.validateCheckoutRequest(base({ acknowledgedStartingPrice: false })), /starting price/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ upgradeIds: ['not-real'] })), /upgrade/i);
});

test('superseded example: server derives price and retains priority data in a compact note', () => {
  const order = checkout.validateCheckoutRequest(base({ productId: 'custom-belt', notes: 'x'.repeat(1500) }));
  assert.equal(order.total, 180);
  const note = checkout.makePaymentNote(order);
  assert.ok(note.length <= 500);
  assert.match(note, /TCL-/);
  assert.match(note, /Pants size:/);
  assert.match(note, /Order total: \$180/);
});

test('rejects legacy carts and quantities', () => {
  assert.throws(() => checkout.validateCheckoutRequest({ items: [{ id: 'custom-wallet', quantity: 2 }] }), /one custom piece/i);
});
```

- [ ] **Step 2: Run the checkout tests and verify failure**

Run: `node --test scripts/custom-order-checkout.test.cjs`

Expected: FAIL because the pure checkout module does not exist.

- [ ] **Step 3: Implement request validation and compact-note construction**

Define:

```ts
export interface CheckoutRequestInput {
  productId?: unknown;
  customization?: unknown;
  upgradeIds?: unknown;
  referenceImages?: unknown;
  customerName?: unknown;
  email?: unknown;
  phone?: unknown;
  notes?: unknown;
  deliveryWindow?: unknown;
  acknowledgedStartingPrice?: unknown;
}

export interface ValidatedCustomOrder {
  orderReference: string;
  product: CheckoutProduct;
  customization: CustomizationValues;
  upgrades: PaidUpgrade[];
  referenceImageUrls: string[];
  customerName: string;
  email: string;
  phone: string;
  notes: string;
  deliveryWindow: string;
  total: number;
}
```

Validate string lengths (`name` 1–100, `email` 3–254, `phone` 0–40, each customization 0–2,000, notes 0–300), require a basic email shape, accept only same-origin reference paths matching `/api/order-assets/<token>`, and reject keys not visible for the selected product. Store private contact, customization, notes, and image metadata only in the signed `order-manifests/` record. Square receives a compact note of at most 500 characters containing the order reference, optional gallery inspiration, private-manifest URL, and compact item/total summary.

- [ ] **Step 4: Refactor the route around the pure validator**

The route should:

```ts
const order = validateCheckoutRequest(await request.json());
const origin = new URL(request.url).origin;
const redirectUrl = `${origin}/checkout/success?ref=${encodeURIComponent(order.orderReference)}`;
```

Pass `order.total * 100` as Square’s integer USD amount, keep Square API version `2026-05-20`, keep credentials server-only, and return only `{ checkoutUrl, orderReference }`. Convert `CheckoutValidationError` to status 400 and retain the current safe 500 response for configuration or Square failures.

- [ ] **Step 5: Run checkout tests and type checking**

Run: `node --test scripts/custom-order-checkout.test.cjs && npx tsc --noEmit`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the Square boundary**

```bash
git add src/lib/custom-order-checkout.ts src/app/api/checkout/route.ts scripts/custom-order-checkout.test.cjs
git commit -m "feat: validate one-piece Square checkout"
```

---

### Task 5: Private R2 Reference Image API

**Files:**
- Create: `src/lib/order-assets.ts`
- Create: `src/app/api/order-assets/route.ts`
- Create: `src/app/api/order-assets/[token]/route.ts`
- Create: `scripts/order-assets.test.cjs`
- Modify: `wrangler.jsonc`
- Regenerate: `cloudflare-env.d.ts`

**Interfaces:**
- Consumes: multipart field `files`, Cloudflare `ORDER_ASSETS: R2Bucket`, and secret `ORDER_ASSET_TOKEN_SECRET`.
- Produces: `UploadedReference { name: string; url: string; contentType: string }`, at most three private objects, and token-gated GET responses.

- [ ] **Step 1: Write failing asset validation and token tests**

```js
test('accepts only JPEG and PNG sources up to 8 MB', () => {
  assert.equal(assets.validateReferenceFile({ name: 'idea.png', type: 'image/png', size: 8 * 1024 * 1024 }).ok, true);
  assert.equal(assets.validateReferenceFile({ name: 'idea.pdf', type: 'application/pdf', size: 20 }).ok, false);
  assert.equal(assets.validateReferenceFile({ name: 'large.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }).ok, false);
});

test('signed tokens round-trip and reject changes', async () => {
  const token = await assets.createAssetToken('order-uploads/abc/photo.jpg', 'secret');
  assert.equal(await assets.verifyAssetToken(token, 'secret'), 'order-uploads/abc/photo.jpg');
  assert.equal(await assets.verifyAssetToken(`${token}x`, 'secret'), null);
});
```

- [ ] **Step 2: Run the asset test and verify failure**

Run: `node --test scripts/order-assets.test.cjs`

Expected: FAIL because `order-assets.ts` does not exist.

- [ ] **Step 3: Implement file validation, random keys, and signed tokens**

Use exact limits:

```ts
export const MAX_REFERENCE_FILES = 3;
export const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_REFERENCE_TYPES = new Set(['image/jpeg', 'image/png']);
```

Cloudflare Images must decode each source and re-encode it as canonical non-animated JPEG before storage. Temporary keys must be `order-uploads/<intent-id>/<upload-uuid>.jpg`; successful checkout promotes them to `order-assets/<checkout-attempt-id>/<upload-uuid>.jpg`. Tokens must use a constant-time verified HMAC and must remain bound to the signed order intent. Never accept a key directly from the browser.

- [ ] **Step 4: Implement upload and retrieval routes**

The POST route reads `request.formData()`, enforces 1–3 files, validates every file before writing any object, and stores `httpMetadata.contentType` plus `customMetadata.originalName`. Return `{ files: [{ name, contentType, url: '/api/order-assets/<token>' }] }`.

The GET route verifies the token, reads `env.ORDER_ASSETS.get(key)`, and returns the body with:

```ts
{
  'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
  'Content-Disposition': `inline; filename="${safeFilename}"`,
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive'
}
```

Return 404 for invalid tokens and missing objects so the endpoint does not reveal which keys exist.

- [ ] **Step 5: Add the R2 binding and generate types**

Add:

```jsonc
"r2_buckets": [
  { "binding": "ORDER_ASSETS", "bucket_name": "twisted-order-assets" }
],
```

Run: `npm run cf-typegen`

Expected: `cloudflare-env.d.ts` contains `ORDER_ASSETS: R2Bucket`.

The executor must obtain approval before creating the production bucket or secret. After approval, run:

```bash
npx wrangler r2 bucket create twisted-order-assets
npx wrangler secret put ORDER_ASSET_TOKEN_SECRET
```

Then configure and verify lifecycle rules for expired `order-uploads/`, retained `order-assets/`, `order-intents/`, and `order-manifests/` records before deployment.

- [ ] **Step 6: Run asset tests and type checking**

Run: `node --test scripts/order-assets.test.cjs && npx tsc --noEmit`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit the private asset service**

```bash
git add src/lib/order-assets.ts src/app/api/order-assets src/app/api/order-assets/[token]/route.ts scripts/order-assets.test.cjs wrangler.jsonc cloudflare-env.d.ts
git commit -m "feat: add private custom order image uploads"
```

---

### Task 6: Reference Image Controls in the Assistant

**Files:**
- Create: `src/components/custom-order/ReferenceImageUpload.tsx`
- Create: `scripts/reference-image-upload.test.cjs`
- Modify: `src/components/custom-order/CustomizationStep.tsx`
- Modify: `src/components/custom-order/CustomOrderAssistant.tsx`
- Modify: `src/components/custom-order/OrderReviewStep.tsx`

**Interfaces:**
- Consumes: `POST /api/order-assets`, `UploadedReference`, and the exact limits from Task 5.
- Produces: optional image picker with upload/retry/remove status and validated reference URLs in the checkout request.

- [ ] **Step 1: Write a failing upload-control contract test**

```js
test('reference control communicates limits, status, retry, and removal', () => {
  const source = read('src/components/custom-order/ReferenceImageUpload.tsx');
  assert.match(source, /up to 3/i);
  assert.match(source, /8 MB/i);
  assert.match(source, /JPEG.*PNG/is);
  assert.match(source, /Retry/);
  assert.match(source, /Remove/);
  assert.match(source, /aria-live/);
});
```

- [ ] **Step 2: Run the upload-control test and verify failure**

Run: `node --test scripts/reference-image-upload.test.cjs`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement upload, retry, preview, and remove behavior**

Submit one `FormData` request for the newly selected files. Validate type/count/size in the browser only to give faster feedback; the server remains authoritative. Keep all existing product choices and contact state when an upload fails. Display each accepted filename with a thumbnail loaded from its token URL, a Remove button, and status announced through `role="status" aria-live="polite"`. Failed files show a Retry button and do not enter the checkout request until successfully uploaded.

Do not save uploaded URLs or filenames in local storage. Disable “Continue To Review” while uploads are in progress, but do not require any images.

- [ ] **Step 4: Add uploaded references to review and checkout submission**

Show thumbnails and filenames in the review step. Submit only:

```ts
referenceImages: draft.referenceImages.map(({ name, url, contentType }) => ({ name, url, contentType }))
```

Do not send Blob objects or data URLs to `/api/checkout`.

- [ ] **Step 5: Run all assistant/upload tests and type checking**

Run: `node --test scripts/custom-order-assistant-model.test.cjs scripts/custom-order-assistant-component.test.cjs scripts/custom-order-draft.test.cjs scripts/reference-image-upload.test.cjs && npx tsc --noEmit`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the image controls**

```bash
git add src/components/custom-order/ReferenceImageUpload.tsx src/components/custom-order/CustomizationStep.tsx src/components/custom-order/CustomOrderAssistant.tsx src/components/custom-order/OrderReviewStep.tsx scripts/reference-image-upload.test.cjs
git commit -m "feat: add custom order reference images"
```

---

### Task 7: Trust, FAQ, and Post-Payment Timeline

**Files:**
- Create: `src/components/custom-order/OrderTrustPanel.tsx`
- Create: `src/components/custom-order/CustomOrderFaq.tsx`
- Create: `scripts/custom-order-trust-success.test.cjs`
- Modify: `src/components/custom-order/CustomOrderAssistant.tsx`
- Modify: `src/app/checkout/success/page.tsx`

**Interfaces:**
- Consumes: Existing Google review URL, Facebook review URL, `?ref=` success query parameter, and approved custom-order policy.
- Produces: reassurance beside the order flow, six FAQ entries, and a four-stage next-steps timeline.

- [ ] **Step 1: Write the failing trust/success copy test**

```js
test('trust panel uses verified facts and existing review destinations', () => {
  const source = read('src/components/custom-order/OrderTrustPanel.tsx');
  assert.match(source, /30\+ years/i);
  assert.match(source, /Valliant, Oklahoma/i);
  assert.match(source, /Secure Square checkout/i);
  assert.match(source, /google\.com\/search\?q=twisted\+custom\+leather\+valliant/);
  assert.match(source, /facebook\.com\/twistedcustomleather\/reviews/);
});

test('success page shows the order reference and four next steps', () => {
  const source = read('src/app/checkout/success/page.tsx');
  for (const phrase of ['Payment received', 'Review and confirm', 'Crafted by hand', 'Shipping update']) assert.match(source, new RegExp(phrase, 'i'));
  assert.match(source, /searchParams/);
});
```

- [ ] **Step 2: Run the trust/success test and verify failure**

Run: `node --test scripts/custom-order-trust-success.test.cjs`

Expected: FAIL because the new components and success timeline do not exist.

- [ ] **Step 3: Implement trustworthy reassurance without invented testimonials**

Render four concise facts: “30+ years of leathercraft,” “Handmade in Valliant, Oklahoma,” “Secure checkout through Square,” and “Design details confirmed before work begins.” Link to the same Google and Facebook review destinations already used by `src/components/about/ReviewsWidget.tsx`. Do not quote, summarize, or assign star ratings to customers unless the owner later provides approved text.

Add FAQ answers for: what the starting price covers; when design/measurements are confirmed; possible upgrade payments; current 42–56 day estimate; reference-image privacy/90-day deletion; and why one piece is ordered at a time. Use native `<details><summary>` so it works without JavaScript.

- [ ] **Step 4: Upgrade the success page**

Use the Next 15 server signature:

```tsx
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const orderReference = /^TCL-[A-Z2-9]{6}$/.test(ref ?? '') ? ref : null;
```

Show the validated reference, advise the customer to save it, and show the ordered timeline: Payment received → Review and confirm → Crafted by hand → Shipping update. Keep the Back Home and Facebook message actions.

- [ ] **Step 5: Run trust/success tests and type checking**

Run: `node --test scripts/custom-order-trust-success.test.cjs && npx tsc --noEmit`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit trust and success improvements**

```bash
git add src/components/custom-order/OrderTrustPanel.tsx src/components/custom-order/CustomOrderFaq.tsx src/components/custom-order/CustomOrderAssistant.tsx src/app/checkout/success/page.tsx scripts/custom-order-trust-success.test.cjs
git commit -m "feat: clarify custom order trust and next steps"
```

---

### Task 8: Integrated Verification and Publish-Ready Handoff

**Files:**
- Modify: `package.json`
- Modify only if verification finds a defect: files introduced or modified in Tasks 1–7

**Interfaces:**
- Consumes: All prior tasks.
- Produces: One repeatable test command, production build evidence, accessibility/mobile review, Square sandbox evidence, and a publish-ready branch. This task does not deploy without approval.

- [ ] **Step 1: Add one deterministic test command**

Add:

```json
"test": "node --test scripts/*.test.cjs"
```

Do not replace the existing `build`, `deploy`, `upload`, `preview`, or `cf-typegen` scripts.

- [ ] **Step 2: Run the full automated suite**

Run: `npm test`

Expected: every `scripts/*.test.cjs` test passes with zero failures.

- [ ] **Step 3: Run compile and production build checks**

Run:

```bash
npx tsc --noEmit
npm run build
npx opennextjs-cloudflare build
```

Expected: all three commands exit 0; Next lists `/api/checkout`, `/api/order-assets`, `/api/order-assets/[token]`, and `/checkout/success`; OpenNext creates `.open-next/worker.js`.

- [ ] **Step 4: Run desktop and mobile browser acceptance checks**

Start the approved local preview and verify at 1440 px and 390 px:

1. `#custom-order` lands on step 1 and all ten products are selectable.
2. Only relevant questions appear for a wallet, belt, cover, welding item, guitar strap, and purse.
3. Back/Next preserves selections and focuses the new step heading.
4. Reload restores non-sensitive choices but not name, email, phone, address, or image uploads.
5. A gallery popup opens the same large image, keeps its existing album link where applicable, and “Make One Like This” preselects the correct product/reference.
6. Three valid images upload; a fourth, an oversize image, and a PDF show useful errors without clearing the form.
7. Keyboard-only navigation reaches every control; the error summary and upload status are announced.
8. Review shows exactly one piece, the full starting total, and the required acknowledgement.

Expected: every check passes with no horizontal scrolling at 390 px.

- [ ] **Step 5: Run Square sandbox acceptance checks**

With sandbox credentials in the preview environment, verify:

1. The server rejects tampered product IDs, totals, upgrade IDs, and missing acknowledgement with status 400.
2. Square displays the server-calculated full starting total.
3. The payment note contains compact references and is no longer than 500 characters; private measurements and reference URLs remain in the signed R2 manifest.
4. Successful payment returns to `/checkout/success?ref=TCL-XXXXXX` and the same reference is displayed.

Expected: all four checks pass. Do not perform a production payment.

- [ ] **Step 6: Inspect the final diff and commit verification wiring**

Run:

```bash
git diff --check origin/main...HEAD
git status --short
git log --oneline origin/main..HEAD
```

Expected: no whitespace errors; only intended files are changed; commits correspond to Tasks 1–8.

Commit:

```bash
git add package.json
git commit -m "test: verify guided custom order flow"
```

- [ ] **Step 7: Prepare the publish decision**

Report the exact test/build results, R2 bucket/lifecycle status, Square sandbox result, changed-file summary, and branch name. Ask for explicit approval before pushing, opening/merging a pull request, or deploying Cloudflare production. After approval, follow the repository’s existing GitHub-to-Cloudflare Build 1 workflow and verify the live homepage, image endpoints, Square redirect, and Cloudflare error rate.

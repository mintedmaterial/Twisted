const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

test('assistant presents the three approved steps and one-piece request', () => {
  const source = read('src/components/custom-order/CustomOrderAssistant.tsx');
  const progress = read('src/components/custom-order/OrderProgress.tsx');
  const review = read('src/components/custom-order/OrderReviewStep.tsx');
  const selection = read('src/components/custom-order/ProductSelectionStep.tsx');

  assert.match(progress, /Choose Your Piece/);
  assert.match(progress, /Customize It/);
  assert.match(progress, /Review & Pay/);
  assert.match(review, /I understand that I am paying the full starting price/);
  assert.match(source, /productId/);
  assert.doesNotMatch(source, /quantity|cartItems|updateQuantity/);
  assert.match(source, /if \(step === 1\) \{[\s\S]*?setStep\(2\);/);
  assert.match(selection, /type="radio"/);
  assert.match(selection, /focus-within:ring-2/);
  assert.match(source, /function changeCustomerName\(value: string\)[\s\S]*?setReviewErrors/);
  assert.match(source, /requestAnimationFrame\(\(\) => stepHeadingRef\.current\?\.focus\(\)\)/);
  assert.match(source, /requestAnimationFrame\(\(\) => errorSummaryRef\.current\?\.focus\(\)\)/);
});

test('controller cleans errors, filters blank entries, and builds a one-piece payload', () => {
  const controller = loadTypeScriptModule('src/components/custom-order/orderAssistantControllerModel.ts');
  const remainingErrors = controller.clearErrors({ primaryColor: 'Choose a color.', toolingDesign: undefined, _form: ' ' }, ['primaryColor']);

  assert.deepEqual(remainingErrors, { toolingDesign: undefined, _form: ' ' });
  assert.deepEqual(
    controller.getActiveErrorEntries(remainingErrors, (key) => `field-${key}`, ' Checkout failed. '),
    [{ id: 'review-form', message: ' Checkout failed. ' }],
  );

  const payload = controller.buildCheckoutPayload({
    checkoutAttemptId: '123e4567-e89b-42d3-a456-426614174000',
    productId: 'custom-wallet',
    customization: { walletStyle: 'Bifold', primaryColor: 'Brown' },
    upgradeIds: ['gator'],
    referenceId: 'wallet-set',
    referenceImages: [{ name: 'wallet.png', url: '/api/order-assets/token', contentType: 'image/png' }],
    customerName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '555-0100',
    notes: 'Floral tooling',
    acknowledgedStartingPrice: true,
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    'acknowledgedStartingPrice', 'checkoutAttemptId', 'customerName', 'customization', 'email', 'notes', 'phone', 'productId', 'referenceId', 'referenceImages', 'upgradeIds',
  ]);
  assert.deepEqual(payload.productId, 'custom-wallet');
  assert.deepEqual(payload.customization, { walletStyle: 'Bifold', primaryColor: 'Brown' });
  assert.deepEqual(payload.upgradeIds, ['gator']);
  assert.equal(payload.customerName, 'Ada Lovelace');
  assert.equal(payload.acknowledgedStartingPrice, true);
  assert.equal('items' in payload, false);
  assert.equal('quantity' in payload, false);
  assert.equal('cart' in payload, false);
  assert.equal('deliveryWindow' in payload, false);
});

test('review validation returns field-specific phone and notes errors at exact limits', () => {
  const controller = loadTypeScriptModule('src/components/custom-order/orderAssistantControllerModel.ts');
  const valid = controller.validateCustomerReview({
    customerName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '5'.repeat(40),
    notes: 'n'.repeat(300),
    acknowledgedStartingPrice: true,
  });
  assert.deepEqual(valid, {});

  const invalid = controller.validateCustomerReview({
    customerName: ' ',
    email: 'not-an-email',
    phone: '5'.repeat(41),
    notes: 'n'.repeat(301),
    acknowledgedStartingPrice: false,
  });
  assert.deepEqual(Object.keys(invalid).sort(), [
    'acknowledgedStartingPrice', 'customerName', 'email', 'notes', 'phone',
  ]);
  assert.match(invalid.phone, /40/);
  assert.match(invalid.notes, /300/);
});

test('assistant exposes a removable canonical inspiration card in the flow and review', () => {
  const assistant = read('src/components/custom-order/CustomOrderAssistant.tsx');
  const review = read('src/components/custom-order/OrderReviewStep.tsx');

  assert.match(assistant, /getGalleryOrderReference/);
  assert.match(assistant, /OrderInspirationCard/);
  assert.match(assistant, /removeInspiration/);
  assert.match(assistant, /referenceId: draft\.referenceId/);
  assert.match(review, /OrderInspirationCard/);
  assert.match(review, /onInspirationRemove/);
});

test('invalid controls expose stable error IDs and accessible descriptions', () => {
  const customization = read('src/components/custom-order/CustomizationStep.tsx');
  const review = read('src/components/custom-order/OrderReviewStep.tsx');

  assert.match(customization, /id="customization-form"/);
  assert.match(customization, /aria-invalid=\{Boolean\(error\)\}/);
  assert.match(customization, /aria-describedby=\{describedBy\}/);
  assert.match(customization, /`customization-\$\{key\}-error`/);
  assert.match(review, /id="customer-name-error"/);
  assert.match(review, /id="customer-email-error"/);
  assert.match(review, /id="customer-phone-error"/);
  assert.match(review, /id="order-notes-error"/);
  assert.match(review, /id="starting-price-acknowledgement-error"/);
  assert.match(review, /aria-invalid=\{Boolean\(errors\.customerName\)\}/);
  assert.match(review, /aria-describedby=\{errors\.customerName \? 'customer-name-error' : undefined\}/);
  assert.match(review, /aria-invalid=\{Boolean\(errors\.phone\)\}/);
  assert.match(review, /aria-invalid=\{Boolean\(errors\.notes\)\}/);
});

test('checkout submission locks every mutation and guards stale responses by revision and attempt', () => {
  const assistant = read('src/components/custom-order/CustomOrderAssistant.tsx');
  const progress = read('src/components/custom-order/OrderProgress.tsx');
  const review = read('src/components/custom-order/OrderReviewStep.tsx');
  const upload = read('src/components/custom-order/ReferenceImageUpload.tsx');

  assert.match(assistant, /<fieldset disabled=\{isSubmitting\}/);
  assert.match(assistant, /<OrderProgress[^>]*disabled=\{isSubmitting\}/);
  assert.match(assistant, /submissionRevisionRef/);
  assert.match(assistant, /checkoutAttemptIdRef\.current !== checkoutAttemptId/);
  assert.doesNotMatch(assistant, /clearOrderDraft\(\);[\s\S]*?window\.location\.assign/);
  assert.match(progress, /disabled\?: boolean/);
  assert.match(review, /disabled=\{isSubmitting\}/);
  assert.match(upload, /disabled\?: boolean/);
});

test('assistant renders explicit Turnstile intent flow and resets consumed challenges', () => {
  const assistant = read('src/components/custom-order/CustomOrderAssistant.tsx');
  const widget = read('src/components/custom-order/TurnstileWidget.tsx');

  assert.match(widget, /turnstile-spin-v1/);
  assert.match(widget, /turnstile\.render/);
  assert.match(widget, /turnstile\.reset/);
  assert.match(assistant, /\/api\/order-intent/);
  assert.match(assistant, /Authorization: `Bearer \$\{orderIntent\.token\}`/);
  assert.match(assistant, /resetTurnstile/);
});

test('customer controls expose exact limits, counters, required state, and native validation bypass', () => {
  const assistant = read('src/components/custom-order/CustomOrderAssistant.tsx');
  const review = read('src/components/custom-order/OrderReviewStep.tsx');
  const customization = read('src/components/custom-order/CustomizationStep.tsx');

  assert.match(assistant, /noValidate/);
  assert.match(review, /maxLength=\{100\}/);
  assert.match(review, /maxLength=\{254\}/);
  assert.match(review, /maxLength=\{40\}/);
  assert.match(review, /maxLength=\{300\}/);
  assert.match(review, /aria-required="true"/);
  assert.match(review, /\{notes\.length\}\/300/);
  assert.match(review, /\{phone\.length\}\/40/);
  assert.match(customization, /maxLength=\{2000\}/);
  assert.match(customization, /\/2000/);
  assert.match(customization, /aria-required=\{required\}/);
});

test('product choices are grouped and both header menus link to the Bible Cover assistant entry', () => {
  const selection = read('src/components/custom-order/ProductSelectionStep.tsx');
  const header = read('src/components/Header.tsx');

  for (const group of ['Wallets', 'Belts', 'Covers', 'Welding Gear', 'Straps', 'Bags']) {
    assert.match(selection, new RegExp(group));
  }
  assert.match(selection, /Not sure\?/i);
  assert.equal((header.match(/href="\/\?product=bible-cover#custom-order"/g) ?? []).length, 2);
});

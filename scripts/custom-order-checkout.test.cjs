const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const ATTEMPT_ID = '123e4567-e89b-42d3-a456-426614174000';

function checkoutModule() {
  return loadTypeScriptModule('src/lib/custom-order-checkout.ts');
}

function walletCustomization(overrides = {}) {
  return {
    walletStyle: 'Bifold',
    primaryColor: 'Saddle tan',
    leatherMaterial: 'Cowhide',
    toolingDesign: 'Oak leaves',
    ...overrides,
  };
}

function beltCustomization(overrides = {}) {
  return {
    pantsSize: '34',
    beltSizing: 'Existing belt',
    foldHole: '36 inches',
    beltWidth: '1.5 inches',
    buckle: 'Use my buckle',
    primaryColor: 'Dark brown',
    toolingDesign: 'Basket weave',
    ...overrides,
  };
}

function base(overrides = {}) {
  return {
    checkoutAttemptId: ATTEMPT_ID,
    productId: 'custom-wallet',
    customization: walletCustomization(),
    upgradeIds: [],
    referenceImages: [],
    customerName: 'Connie Customer',
    email: 'connie@example.com',
    phone: '555-0100',
    notes: '',
    acknowledgedStartingPrice: true,
    ...overrides,
  };
}

function referenceImage(index) {
  return {
    name: `reference-${index}.jpg`,
    url: `/api/order-assets/reference-token-${index}`,
    contentType: 'image/jpeg',
  };
}

test('rejects missing acknowledgement, malformed attempt IDs, and illegal upgrades', () => {
  const checkout = checkoutModule();

  assert.throws(() => checkout.validateCheckoutRequest(base({ acknowledgedStartingPrice: false })), /starting price/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ checkoutAttemptId: 'not-a-uuid' })), /checkout attempt/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ upgradeIds: ['not-real'] })), /upgrade/i);
});

test('server derives price, checkout attempt identity, and the 42-56 day delivery window', () => {
  const checkout = checkoutModule();
  const order = checkout.validateCheckoutRequest(base({
    productId: 'custom-belt',
    customization: beltCustomization(),
    notes: 'x'.repeat(300),
  }), new Date('2026-08-02T18:30:00.000Z'));

  assert.equal(order.total, 180);
  assert.equal(order.checkoutAttemptId, ATTEMPT_ID);
  assert.equal(order.deliveryWindow, 'Sep 13, 2026 – Sep 27, 2026');
  assert.throws(() => checkout.validateCheckoutRequest(base({ deliveryWindow: 'Tomorrow' })), /one custom piece/i);
});

test('rejects legacy carts and quantities', () => {
  const checkout = checkoutModule();

  assert.throws(() => checkout.validateCheckoutRequest({ items: [{ id: 'custom-wallet', quantity: 2 }] }), /one custom piece/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ quantity: 2 })), /one custom piece/i);
});

test('accepts the assistant contract, normalizes strings, and retains only safe reference paths', () => {
  const checkout = checkoutModule();
  const order = checkout.validateCheckoutRequest(base({
    upgradeIds: ['gator'],
    referenceId: 'wallet-set',
    referenceImages: [{ name: 'wallet.png', url: '/api/order-assets/Abc_123-token', contentType: 'image/png' }],
    customerName: '  Connie Customer  ',
    email: '  connie@example.com  ',
    notes: '  Please call first.  ',
  }));

  assert.equal(order.product.id, 'custom-wallet');
  assert.deepEqual(order.upgrades.map((upgrade) => upgrade.id), ['gator']);
  assert.deepEqual(order.referenceImageUrls, ['/api/order-assets/Abc_123-token']);
  assert.equal(order.galleryReferenceId, 'wallet-set');
  assert.equal(order.customerName, 'Connie Customer');
  assert.equal(order.email, 'connie@example.com');
  assert.equal(order.notes, 'Please call first.');
  assert.equal(order.total, 190);
});

test('rejects unknown, duplicate, mismatched, and product-inapplicable selections', () => {
  const checkout = checkoutModule();

  assert.throws(() => checkout.validateCheckoutRequest(base({ productId: 'not-real' })), /one custom piece/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ upgradeIds: ['gator', 'gator'] })), /duplicate/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ customization: walletCustomization({ buckle: 'Include a buckle' }) })), /does not apply/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ customization: walletCustomization({ toolingDesign: '' }) })), /tooling design/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ customization: walletCustomization({ walletStyle: 'Surprise me' }) })), /wallet style/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ productId: 'custom-purse', customization: {
    bagDimensions: '12 x 10', carryStyle: 'Crossbody', pockets: 'Two',
  }, referenceId: 'wallet-set' })), /inspiration/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ total: 1 })), /one custom piece/i);
});

test('canonical select options include the documented help choice', () => {
  const checkout = checkoutModule();
  const order = checkout.validateCheckoutRequest(base({ customization: walletCustomization({ walletStyle: 'I need help deciding' }) }));

  assert.equal(order.customization.walletStyle, 'I need help deciding');
});

test('enforces contact and free-text length boundaries', () => {
  const checkout = checkoutModule();

  assert.throws(() => checkout.validateCheckoutRequest(base({ customerName: '' })), /name/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ customerName: 'n'.repeat(101) })), /name/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ email: 'not-an-email' })), /email/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ email: `${'a'.repeat(245)}@example.com` })), /email/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ phone: '1'.repeat(41) })), /phone/i);
  assert.doesNotThrow(() => checkout.validateCheckoutRequest(base({
    notes: 'n'.repeat(300),
    customization: walletCustomization({ toolingDesign: 'd'.repeat(2000) }),
  })));
  assert.throws(() => checkout.validateCheckoutRequest(base({ notes: 'n'.repeat(301) })), /notes/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ customization: walletCustomization({ toolingDesign: 'd'.repeat(2001) }) })), /tooling design/i);
});

test('rejects malformed, duplicate, and non-local reference image paths', () => {
  const checkout = checkoutModule();
  const referenceImages = (url) => [{ name: 'reference.jpg', url, contentType: 'image/jpeg' }];

  assert.throws(() => checkout.validateCheckoutRequest(base({ referenceImages: referenceImages('https://evil.example/file.jpg') })), /reference image/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ referenceImages: referenceImages('/api/order-assets/token/more') })), /reference image/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ referenceImages: referenceImages('/api/order-assets/token?download=1') })), /reference image/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ referenceImages: [{ url: '/api/order-assets/token' }] })), /reference image/i);
  assert.throws(() => checkout.validateCheckoutRequest(base({ referenceImages: [referenceImage(1), referenceImage(1)] })), /duplicate/i);
});

test('accepts exactly three reference images and rejects a fourth', () => {
  const checkout = checkoutModule();
  const threeReferences = [1, 2, 3].map(referenceImage);

  const order = checkout.validateCheckoutRequest(base({ referenceImages: threeReferences }));

  assert.deepEqual(order.referenceImageUrls, threeReferences.map((image) => image.url));
  assert.throws(
    () => checkout.validateCheckoutRequest(base({ referenceImages: [...threeReferences, referenceImage(4)] })),
    /up to 3 reference images/i,
  );
});

test('payment notes contain only compact references and never exceed Square’s 500-character boundary', () => {
  const checkout = checkoutModule();
  const order = checkout.validateCheckoutRequest(base({
    referenceId: 'wallet-set',
    referenceImages: [1, 2, 3].map(referenceImage),
    notes: 'PRIVATE CUSTOMER NOTE '.repeat(13),
    customization: walletCustomization({ toolingDesign: 'PRIVATE CUSTOMIZATION '.repeat(10) }),
  }));
  order.orderReference = 'TCL-ABCDEFGH-JKLM';
  const privateRecordUrl = `https://twistedcustomleather.com/api/order-assets/${'a'.repeat(200)}`;

  const note = checkout.makePaymentNote({
    ...order,
    product: { ...order.product, name: `Premium ${'😀'.repeat(400)}` },
  }, privateRecordUrl);

  assert.equal([...note].length, 500);
  assert.match(note, new RegExp(order.orderReference));
  assert.match(note, /wallet-set/);
  assert.match(note, /Private record: https:\/\/twistedcustomleather\.com\/api\/order-assets\//);
  assert.doesNotMatch(note, /PRIVATE CUSTOMER NOTE|PRIVATE CUSTOMIZATION|connie@example|reference-token/);
});

test('checkout replay fingerprint binds the exact Square endpoint, API version, contract version, and body bytes', async () => {
  const checkout = checkoutModule();
  const order = checkout.validateCheckoutRequest(base());
  const context = {
    environment: 'sandbox',
    locationId: 'sandbox-location',
    requestOrigin: 'https://twistedcustomleather.com',
  };
  const contract = {
    contractVersion: 4,
    endpoint: 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links',
    apiVersion: '2026-05-20',
    body: '{"canonical":true}',
  };
  const original = await checkout.createOrderPayloadFingerprint(order, [], context, contract);

  for (const changed of [
    { ...contract, contractVersion: 5 },
    { ...contract, endpoint: 'https://connect.squareup.com/v2/online-checkout/payment-links' },
    { ...contract, apiVersion: '2026-06-18' },
    { ...contract, body: '{"canonical":false}' },
  ]) {
    assert.notEqual(await checkout.createOrderPayloadFingerprint(order, [], context, changed), original);
  }
});

test('payment-note sanitization removes dangerous controls and truncates by Unicode code point', () => {
  const checkout = checkoutModule();
  const dangerous = 'Normal Ω 😀\u0000C0\u0085C1\u007fDEL\u2028line\u2029paragraph\u202ebidi | end';

  const sanitized = checkout.sanitizePaymentNoteValue(dangerous);

  assert.equal(sanitized, 'Normal Ω 😀 C0 C1 DEL line paragraph bidi / end');
  assert.doesNotMatch(sanitized, /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/u);
  assert.equal(checkout.truncateByCodePoint('😀😀😀', 2), '😀😀');
  assert.doesNotMatch(checkout.truncateByCodePoint('A😀B', 2), /[\ud800-\udbff]$/u);
});

test('payment-note sanitization removes every Bidi_Control while retaining normal Unicode', () => {
  const checkout = checkoutModule();
  const bidiControls = [
    0x061c,
    0x200e,
    0x200f,
    0x202a,
    0x202b,
    0x202c,
    0x202d,
    0x202e,
    0x2066,
    0x2067,
    0x2068,
    0x2069,
  ];

  for (const codePoint of bidiControls) {
    assert.equal(
      checkout.sanitizePaymentNoteValue(`before${String.fromCodePoint(codePoint)}after`),
      'before after',
      `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')} must be removed`,
    );
  }

  const ordinaryUnicode = 'العربية עברית Español Ελληνικά Ω 😀';
  assert.equal(checkout.sanitizePaymentNoteValue(ordinaryUnicode), ordinaryUnicode);
});

test('Square configuration uses only fixed origins and environment-specific credentials', () => {
  const checkout = checkoutModule();

  assert.deepEqual(checkout.getSquareConfiguration({
    SQUARE_ENVIRONMENT: 'sandbox',
    SQUARE_SANDBOX_ACCESS_TOKEN: 'sandbox-token',
    SQUARE_SANDBOX_LOCATION_ID: 'sandbox-location',
  }), {
    environment: 'sandbox',
    apiOrigin: 'https://connect.squareupsandbox.com',
    accessToken: 'sandbox-token',
    locationId: 'sandbox-location',
  });
  assert.deepEqual(checkout.getSquareConfiguration({
    SQUARE_ENVIRONMENT: 'production',
    SQUARE_PRODUCTION_ACCESS_TOKEN: 'production-token',
    SQUARE_PRODUCTION_LOCATION_ID: 'production-location',
  }), {
    environment: 'production',
    apiOrigin: 'https://connect.squareup.com',
    accessToken: 'production-token',
    locationId: 'production-location',
  });
  for (const env of [
    {},
    { SQUARE_ENVIRONMENT: 'staging', SQUARE_ACCESS_TOKEN: 'legacy', SQUARE_LOCATION_ID: 'legacy' },
    { SQUARE_ENVIRONMENT: 'sandbox', SQUARE_PRODUCTION_ACCESS_TOKEN: 'wrong', SQUARE_PRODUCTION_LOCATION_ID: 'wrong' },
  ]) {
    assert.throws(() => checkout.getSquareConfiguration(env), /Square checkout is not configured/i);
  }
});

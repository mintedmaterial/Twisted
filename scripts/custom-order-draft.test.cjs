const assert = require('node:assert/strict');
const test = require('node:test');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const model = loadTypeScriptModule('src/components/custom-order/orderDraftStorage.ts');
const getGalleryReferences = () => loadTypeScriptModule('src/data/gallery-order-references.ts');

test('saved drafts omit personal and uploaded-image data', () => {
  const stored = model.serializeOrderDraft({
    productId: 'custom-wallet',
    customization: { primaryColor: 'brown' },
    upgradeIds: [],
    referenceImages: [{ name: 'secret.jpg', url: '/api/order-assets/token' }],
    customerName: 'Connie',
    email: 'person@example.com',
    phone: '555-1111',
  }, new Date('2026-08-02T12:00:00Z'));

  assert.doesNotMatch(stored, /Connie|person@example|555-1111|secret\.jpg|order-assets/);
});

test('drafts expire after seven days', () => {
  const stored = model.serializeOrderDraft({ productId: 'custom-wallet', customization: {}, upgradeIds: [] }, new Date('2026-08-02T12:00:00Z'));

  assert.equal(model.parseOrderDraft(stored, new Date('2026-08-10T12:00:01Z')), null);
});

test('draft parsing accepts only known product configuration', () => {
  const now = new Date('2026-08-02T12:00:00Z');
  const valid = model.serializeOrderDraft({
    productId: 'custom-wallet',
    customization: { walletStyle: 'Bifold' },
    upgradeIds: ['gator'],
    referenceId: 'wallet-set',
  }, now);

  assert.deepEqual(model.parseOrderDraft(valid, now), {
    productId: 'custom-wallet',
    customization: { walletStyle: 'Bifold' },
    upgradeIds: ['gator'],
    referenceId: 'wallet-set',
  });
  assert.equal(model.parseOrderDraft('{', now), null);
  assert.equal(model.parseOrderDraft(JSON.stringify({ expiresAt: '2026-08-09T12:00:00.000Z', productId: 'not-real', customization: {}, upgradeIds: [] }), now), null);
  assert.equal(model.parseOrderDraft(JSON.stringify({ expiresAt: '2026-08-09T12:00:00.000Z', productId: 'custom-wallet', customization: { surprise: 'no' }, upgradeIds: [] }), now), null);
  assert.equal(model.parseOrderDraft(JSON.stringify({ expiresAt: '2026-08-09T12:00:00.000Z', productId: 'custom-wallet', customization: {}, upgradeIds: ['not-an-upgrade'] }), now), null);
});

test('gallery reference allowlist includes exactly the seven featured-work pairs', () => {
  const galleryReferences = getGalleryReferences();
  assert.deepEqual(galleryReferences.galleryOrderReferences, [
    { productId: 'bible-cover', referenceId: 'tooled-portfolio', title: 'Portfolios', thumbnail: '/featured-work/custom-leather-portfolio-black-bg.jpg' },
    { productId: 'custom-wallet', referenceId: 'wallet-set', title: 'Wallet Set', thumbnail: '/featured-work/custom-leather-wallet-set.jpg' },
    { productId: 'custom-purse', referenceId: 'floral-purse-set', title: 'Floral Purse Set', thumbnail: '/featured-work/tooled-leather-cross-purse-set.jpg' },
    { productId: 'welding-armguard', referenceId: 'pipeline-armguard', title: 'Custom Pipeline Arm Guard', thumbnail: '/featured-work/custom-pipeline-leather-armguard.jpg' },
    { productId: 'custom-belt', referenceId: 'turquoise-belt', title: 'Belts Album', thumbnail: '/featured-work/custom-tooled-belt-rs-tail.jpg' },
    { productId: 'custom-purse', referenceId: 'fringe-purse', title: 'Leather Fringe Purse', thumbnail: '/purse.jpeg' },
    { productId: 'custom-purse', referenceId: 'laptop-bag', title: 'Laptop Bag', thumbnail: '/featured-work/custom-leather-floral-purse-lgv.jpg' },
  ]);
  for (const { productId, referenceId } of galleryReferences.galleryOrderReferences) {
    assert.equal(galleryReferences.isValidGalleryOrderReference(productId, referenceId), true);
    assert.deepEqual(
      galleryReferences.getGalleryOrderReference(productId, referenceId),
      galleryReferences.galleryOrderReferences.find((candidate) => candidate.referenceId === referenceId),
    );
  }
});

test('gallery reference allowlist rejects personal data and mismatched products', () => {
  const galleryReferences = getGalleryReferences();
  for (const referenceId of [
    'person@example.com',
    'secret.jpg',
    'https://example.com/reference.jpg',
    '/api/order-assets/token',
  ]) {
    assert.equal(galleryReferences.isValidGalleryOrderReference('custom-wallet', referenceId), false);
  }
  assert.equal(galleryReferences.isValidGalleryOrderReference('custom-purse', 'wallet-set'), false);
});

test('draft parsing rejects references outside the gallery allowlist', () => {
	const now = new Date('2026-08-02T12:00:00Z');
	for (const referenceId of ['person@example.com', 'secret.jpg', 'https://example.com/reference.jpg', '/api/order-assets/token', 'wallet-set']) {
    const productId = referenceId === 'wallet-set' ? 'custom-purse' : 'custom-wallet';
    const stored = JSON.stringify({
      expiresAt: '2026-08-09T12:00:00.000Z',
      productId,
      customization: {},
      upgradeIds: [],
      referenceId,
    });

		assert.equal(model.parseOrderDraft(stored, now), null);
	}
});

test('draft parsing rejects over-limit text, invalid selects, and multiple exotic hides', () => {
	const base = {
		expiresAt: '2026-08-05T00:00:00.000Z',
		productId: 'custom-wallet',
		customization: { walletStyle: 'Bifold', primaryColor: 'Brown' },
		upgradeIds: [],
	};
	const now = new Date('2026-08-04T00:00:00.000Z');
	assert.equal(model.parseOrderDraft(JSON.stringify({ ...base, customization: { ...base.customization, primaryColor: 'x'.repeat(2001) } }), now), null);
	assert.equal(model.parseOrderDraft(JSON.stringify({ ...base, customization: { ...base.customization, walletStyle: 'Invented' } }), now), null);
	assert.equal(model.parseOrderDraft(JSON.stringify({ ...base, upgradeIds: ['gator', 'stingray'] }), now), null);
});

test('loading an unsafe draft removes it from browser storage', () => {
	const stored = JSON.stringify({
		expiresAt: '2026-08-09T12:00:00.000Z',
		productId: 'custom-wallet',
		customization: {},
		upgradeIds: [],
		referenceId: 'person@example.com',
	});
	const removedKeys = [];
	const priorWindow = Object.getOwnPropertyDescriptor(global, 'window');
	Object.defineProperty(global, 'window', {
		configurable: true,
		writable: true,
		value: {
			localStorage: {
				getItem: () => stored,
				removeItem: (key) => removedKeys.push(key),
			},
		},
	});

	try {
		assert.equal(model.loadOrderDraft(), null);
		assert.deepEqual(removedKeys, [model.ORDER_DRAFT_STORAGE_KEY]);
	} finally {
		if (priorWindow) Object.defineProperty(global, 'window', priorWindow);
		else delete global.window;
	}
});

test('draft persistence waits for a user edit after hydration', () => {
  assert.equal(model.shouldPersistOrderDraft(false, false), false);
  assert.equal(model.shouldPersistOrderDraft(true, false), false);
  assert.equal(model.shouldPersistOrderDraft(false, true), false);
  assert.equal(model.shouldPersistOrderDraft(true, true), true);
});

test('a valid gallery query is consumed into a persistable draft and removed from the URL', () => {
  const savedDraft = {
    productId: 'custom-belt',
    customization: { pantsSize: '34' },
    upgradeIds: [],
  };

  const firstLoad = model.resolveInitialOrderDraft(savedDraft, 'custom-wallet', 'wallet-set');

  assert.equal(firstLoad.consumedPreselection, true);
  assert.deepEqual(firstLoad.draft, {
    productId: 'custom-wallet',
    customization: {},
    upgradeIds: [],
    referenceId: 'wallet-set',
  });
  const persisted = model.parseOrderDraft(
    model.serializeOrderDraft(firstLoad.draft, new Date('2026-08-02T12:00:00Z')),
    new Date('2026-08-02T12:00:00Z'),
  );
  assert.deepEqual(persisted, firstLoad.draft);
  assert.equal(
    model.stripOrderPreselectionFromUrl('https://example.com/?product=custom-wallet&reference=wallet-set&campaign=summer#custom-order'),
    '/?campaign=summer#custom-order',
  );

  const reload = model.resolveInitialOrderDraft(persisted, null, null);
  assert.equal(reload.consumedPreselection, false);
  assert.deepEqual(reload.draft, firstLoad.draft);
});

test('invalid or incomplete gallery queries never override a safe saved draft', () => {
  const savedDraft = { productId: 'custom-belt', customization: {}, upgradeIds: [] };

  assert.deepEqual(model.resolveInitialOrderDraft(savedDraft, 'custom-purse', 'wallet-set'), {
    draft: savedDraft,
    consumedPreselection: false,
  });
  assert.deepEqual(model.resolveInitialOrderDraft(savedDraft, 'custom-wallet', null), {
    draft: savedDraft,
    consumedPreselection: false,
  });
});

test('the product-only Bible Cover entry overrides a saved draft while other incomplete gallery queries do not', () => {
  const savedDraft = { productId: 'custom-belt', customization: { primaryColor: 'Brown' }, upgradeIds: [] };

  assert.deepEqual(model.resolveInitialOrderDraft(savedDraft, 'bible-cover', null), {
    draft: { productId: 'bible-cover', customization: {}, upgradeIds: [] },
    consumedPreselection: true,
  });
  assert.deepEqual(model.resolveInitialOrderDraft(savedDraft, 'custom-wallet', null), {
    draft: savedDraft,
    consumedPreselection: false,
  });
});

test('same-page Bible Cover navigation replaces the current draft and consumes only its order parameters', () => {
  const currentDraft = { productId: 'custom-wallet', customization: { walletStyle: 'Bifold' }, upgradeIds: ['gator'] };

  assert.deepEqual(
    model.resolveReactiveOrderNavigation(
      currentDraft,
      'https://example.com/?campaign=header&product=bible-cover#custom-order',
    ),
    {
      draft: { productId: 'bible-cover', customization: {}, upgradeIds: [] },
      consumedPreselection: true,
      replacementUrl: '/?campaign=header#custom-order',
    },
  );
  assert.equal(
    model.resolveReactiveOrderNavigation(currentDraft, 'https://example.com/?campaign=header#custom-order'),
    null,
  );
});

test('success clears a draft only when the canonical returned reference matches pending session state', () => {
  assert.equal(model.shouldClearDraftForReturnedReference('TCL-ABCDEFGH-JKLM', 'TCL-ABCDEFGH-JKLM'), true);
  assert.equal(model.shouldClearDraftForReturnedReference('TCL-ABCDEFGH-JKLM', 'TCL-ZYXWVUTS-9876'), false);
  assert.equal(model.shouldClearDraftForReturnedReference('fabricated', 'fabricated'), false);
  assert.equal(model.shouldClearDraftForReturnedReference(null, 'TCL-ABCDEFGH-JKLM'), false);
});

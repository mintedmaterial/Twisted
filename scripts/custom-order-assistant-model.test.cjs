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

test('visible fields are defensive and unknown products have none', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const fields = model.getVisibleFields('custom-wallet');
  fields.pop();

  assert.deepEqual(model.getVisibleFields('custom-wallet'), ['walletStyle', 'primaryColor', 'secondaryColor', 'leatherMaterial', 'toolingDesign']);
  assert.deepEqual(model.getVisibleFields('not-real'), []);
  assert.equal(model.getCheckoutProduct('not-real'), undefined);
});

test('validation accepts help requests but requires applicable required fields', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const completeWallet = {
    walletStyle: 'I need help deciding',
    primaryColor: 'Brown',
    leatherMaterial: 'I need help deciding',
    toolingDesign: 'Floral',
  };

  assert.deepEqual(model.validateCustomization('custom-wallet', completeWallet), {});
  assert.deepEqual(model.validateCustomization('custom-wallet', { ...completeWallet, toolingDesign: '  ' }), {
    toolingDesign: 'Please complete this field or choose “I need help deciding”.',
  });
  assert.deepEqual(model.validateCustomization('custom-wallet', { ...completeWallet, buckle: 'Include a buckle' }), {
    _form: 'Remove options that do not apply to this piece.',
  });
  assert.deepEqual(model.validateCustomization('not-real', completeWallet), {
    _form: 'Choose a valid custom piece.',
  });
});

test('validation rejects values outside each canonical select allowlist', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const valid = {
    walletStyle: 'Bifold',
    primaryColor: 'Brown',
    leatherMaterial: 'Cowhide',
    toolingDesign: 'Floral',
  };

  assert.deepEqual(model.validateCustomization('custom-wallet', valid), {});
  assert.deepEqual(model.validateCustomization('custom-wallet', { ...valid, walletStyle: model.HELP_ME }), {});
  assert.deepEqual(model.validateCustomization('custom-wallet', { ...valid, walletStyle: 'Anything at all' }), {
    walletStyle: 'Choose one of the available options.',
  });
});

test('totals reject duplicate upgrades and unknown products', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');

  assert.throws(() => model.calculateOrderTotal('custom-wallet', ['gator', 'gator']), /duplicate/i);
  assert.throws(() => model.calculateOrderTotal('welding-hood', ['gator']), /not available/i);
  assert.throws(() => model.calculateOrderTotal('not-real', []), /Unknown custom order product: not-real/);
});

test('delivery windows use UTC calendar dates without mutating the supplied date', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const now = new Date('2026-08-02T18:30:00.000Z');

  assert.equal(model.calculateDeliveryWindow(now), 'Sep 13, 2026 – Sep 27, 2026');
  assert.equal(now.toISOString(), '2026-08-02T18:30:00.000Z');
});

test('welding defaults use the selected product name and return fresh objects', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');

  assert.deepEqual(model.getDefaultCustomization('welding-armguard'), { gearType: 'Armguard' });
  assert.deepEqual(model.getDefaultCustomization('welding-hood'), { gearType: 'Welding Hood' });
  assert.deepEqual(model.getDefaultCustomization('welding-knee-pads'), { gearType: 'Knee Pads' });
  assert.deepEqual(model.getDefaultCustomization('custom-wallet'), {});
  assert.deepEqual(model.getDefaultCustomization('not-real'), {});

  const firstDefault = model.getDefaultCustomization('welding-hood');
  firstDefault.gearType = 'Changed locally';
  assert.deepEqual(model.getDefaultCustomization('welding-hood'), { gearType: 'Welding Hood' });
  assert.notEqual(model.getDefaultCustomization('custom-wallet'), model.getDefaultCustomization('custom-wallet'));
});

test('welding gear type is automatic and rejects tampering', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const defaults = model.getDefaultCustomization('welding-armguard');

  assert.deepEqual(model.validateCustomization('welding-armguard', { ...defaults, fitNotes: 'Standard fit' }), {});
  assert.deepEqual(model.validateCustomization('welding-armguard', { gearType: 'Welding Hood', fitNotes: 'Standard fit' }), {
    gearType: 'This field is set automatically for the selected piece.',
  });
  assert.match(model.customizationFieldDefinitions.gearType.label, /automatically/i);
  assert.match(model.customizationFieldDefinitions.gearType.helperText, /automatically/i);
});

test('frozen upgrade entries cannot change later totals', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const gator = model.getCheckoutProduct('custom-wallet').upgrades.find((upgrade) => upgrade.id === 'gator');

  gator.amount = 999;
  gator.label = 'Changed';

  assert.equal(model.calculateOrderTotal('custom-wallet', ['gator']), 190);
});

test('exotic hides are mutually exclusive while lace stitching remains independent', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');

  assert.deepEqual(model.applyUpgradeSelection(['stingray', 'lace-stitching'], 'gator', true), ['lace-stitching', 'gator']);
  assert.deepEqual(model.applyUpgradeSelection(['gator', 'lace-stitching'], 'gator', false), ['lace-stitching']);
  assert.throws(() => model.calculateOrderTotal('custom-wallet', ['stingray', 'gator']), /one exotic hide/i);
});

test('product switching preserves only still-legal answers and upgrades, then overlays automatic defaults', () => {
  const model = loadTypeScriptModule('src/components/custom-order/orderAssistantModel.ts');
  const switched = model.switchProductDraft({
    productId: 'custom-wallet',
    customization: {
      walletStyle: 'Bifold', primaryColor: 'Brown', toolingDesign: 'Floral', gearType: 'tampered',
    },
    upgradeIds: ['lace-stitching', 'gator'],
    referenceId: 'wallet-set',
  }, 'welding-hood');

  assert.deepEqual(switched, {
    productId: 'welding-hood',
    customization: { primaryColor: 'Brown', toolingDesign: 'Floral', gearType: 'Welding Hood' },
    upgradeIds: ['lace-stitching'],
  });
});

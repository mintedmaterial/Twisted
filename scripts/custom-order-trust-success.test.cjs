const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

test('trust panel uses verified facts and existing review destinations', () => {
	const source = read('src/components/custom-order/OrderTrustPanel.tsx');
	assert.match(source, /30\+ years/i);
	assert.match(source, /Valliant, Oklahoma/i);
	assert.match(source, /Secure Square checkout/i);
	assert.match(source, /google\.com\/search\?q=twisted\+custom\+leather\+valliant/);
	assert.match(source, /facebook\.com\/twistedcustomleather\/reviews/);
});

test('custom-order FAQ has six native disclosure entries', () => {
	const source = read('src/components/custom-order/CustomOrderFaq.tsx');
	assert.equal((source.match(/question:/g) ?? []).length, 6);
	assert.match(source, /<details/);
	assert.match(source, /<summary/);
	assert.match(source, /42[–-]56 days/i);
	assert.match(source, /full published starting price/i);
	assert.match(source, /Selected allowed upgrades are included in that checkout total/i);
	assert.match(source, /stored privately for the order process/i);
	assert.match(source, /not published as gallery work without permission/i);
	assert.doesNotMatch(source, /deleted after 90 days/i);
});

test('assistant renders the trust panel and FAQ beside the order flow', () => {
	const source = read('src/components/custom-order/CustomOrderAssistant.tsx');
	assert.match(source, /import OrderTrustPanel from '.\/OrderTrustPanel'/);
	assert.match(source, /import CustomOrderFaq from '.\/CustomOrderFaq'/);
	assert.match(source, /<OrderTrustPanel \/>/);
	assert.match(source, /<CustomOrderFaq \/>/);
});

test('success page treats a query reference as an unverified Square return', () => {
	const source = read('src/app/checkout/success/page.tsx');
	for (const phrase of ['Payment through Square', 'Review and confirm', 'Crafted by hand', 'Shipping update']) assert.match(source, new RegExp(phrase, 'i'));
	assert.match(source, /searchParams/);
	assert.match(source, /parseOrderReference/);
	assert.match(source, /orderReference \? \([\s\S]*?returned from Square/i);
	assert.match(source, /: \([\s\S]*?Need help with checkout\?/i);
	assert.match(source, /If your payment completed, Randy will review and confirm/i);
	assert.doesNotMatch(source, /payment (?:was )?received/i);
	assert.doesNotMatch(source, /Your Order Was Received/i);
});

test('success return uses the shared reference parser, matching pending-session cleanup, estimate, and both contacts', () => {
  const page = read('src/app/checkout/success/page.tsx');
  const client = read('src/components/custom-order/CheckoutSuccessReturn.tsx');

  assert.match(page, /parseOrderReference/);
  assert.match(client, /shouldClearDraftForReturnedReference/);
  assert.match(client, /sessionStorage/);
  assert.match(page, /42[â€“-]56 days/i);
  assert.match(page, /randy@twistedcustomleather\.com/);
  assert.match(page, /facebook\.com\/twistedcustomleather/);
});

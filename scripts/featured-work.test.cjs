const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('homepage Portfolios card uses the new gallery cover photo', () => {
	const source = fs.readFileSync(
		path.join(root, 'src/components/FeaturedWork.tsx'),
		'utf8',
	);

	assert.doesNotMatch(source, /custom-leather-wallet-set\.jpg/);
	assert.match(source, /gallery\/portfolios\/oilfield-portfolio-cover\.webp/);
	assert.match(source, /title:\s*'Portfolios'/);
	assert.match(source, /title:\s*'Wallet Set'/);
});

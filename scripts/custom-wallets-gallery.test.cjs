const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
let sharp;
try {
	sharp = require('sharp');
} catch {
	sharp = require('../node_modules/.pnpm/node_modules/sharp');
}
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const countMatches = (text, pattern) => (text.match(pattern) ?? []).length;
const preparedAssetNames = [
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
const expectedNonWalletGalleryHash = 'ddc2c1fc3ff51fa36183e2bb81b5156fd2b82b6003d318779fcb52d73a06b901';
const sourcePhotoHashes = [
	['D:\\TCL Photos\\Roper Wallets\\IMG_0044.JPG', '0965740CA59376970683F0935099C426B420CDC6D86F4CBB5284C8192E86A969'],
	['D:\\TCL Photos\\Roper Wallets\\IMG_0211.JPG', '1C1E61A98F6D47C1E624736DF7F6770EC40396B78E575EDCA0138DA84C9638EB'],
	['D:\\TCL Photos\\Roper Wallets\\IMG_0682.HEIC', '00061F93EC424FF4BB52F46687C0BD7A8DF2A22FD94E175063F888FD96B2141C'],
	['D:\\TCL Photos\\Roper Wallets\\IMG_0442 (W)-2.HEIC', '5C831C79C7068DACD5C501467FF66D66EA95C23DBE3E67CB3F5BF713F4C7B61C'],
	['D:\\TCL Photos\\Roper Wallets\\IMG_0641.HEIC', 'F4678115E135BA79ED9DC8CE6F88105A51B2E70752847265675A77439C1A1FD2'],
	['D:\\TCL Photos\\Roper Wallets\\IMG_1258-(W).HEIC', 'C5CA8833FCD04504AB5539D5B0A67F0FD304A27CB9D74ABEDE4C18841BD5947E'],
	['D:\\TCL Photos\\tri-folds\\F30FB1C9-3EDA-4CBF-8F18-F91A8B1E1AFB.JPG', 'E1465A83987332E9623A05B03365B37D22E433FE4D10339093088B49AA925225'],
	['D:\\TCL Photos\\tri-folds\\IMG_0029.JPG', 'B354D13C6AF3C89FE223A3825B20FDACAB69AD392C51D73E68CD06337508B400'],
	['D:\\TCL Photos\\tri-folds\\IMG_0671.HEIC', '863C69B73F112C044C6D46EE021D2BDE3C6CC5878257F1A7AE7A0864AEB734F2'],
	['D:\\TCL Photos\\tri-folds\\IMG_0689.HEIC', '9AC63C798A84C7496BE5C66A73C80806575DE4824A77D2BB8C6ECC2583DFB048'],
	['D:\\TCL Photos\\tri-folds\\IMG_1353.HEIC', 'FAE61D243743662FA9EC0EF88607F5200F2095EA703221A2F1B5F5F65921EEF5'],
	['D:\\TCL Photos\\tri-folds\\IMG_1523.JPG', '5B2D2C8DE6EE52B43F1FE991601A372E9F8500F1466A02169E1A669D7003FFE4'],
];

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

const galleries = JSON.parse(JSON.stringify(loadTypeScriptModule('src/data/galleries.ts').galleries));
const walletGallery = galleries.find((gallery) => gallery.slug === 'wallets');

test('Products menus contain the exact album routes and no wallet product links', () => {
	const header = read('src/components/Header.tsx');
	const routeEntries = {
		wallets: '/gallery/wallets',
		belts: '/gallery/belts',
		leatherWork: '/gallery/leather-work',
		weldingGear: '/gallery/welding-gear',
		bibleCovers: '/gallery/bible-covers',
		portfolios: '/gallery/portfolios',
	};
	for (const [key, route] of Object.entries(routeEntries)) {
		assert.match(header, new RegExp(`${key}: '${route.replaceAll('/', '\\/')}'`), `${key} route must remain ${route}`);
	}

	const desktopMarker = '{productsDropdownOpen && (';
	const mobileMarker = '{mobileProductsOpen && (';
	const menuEndMarker = 'href="/about"';
	const desktopStart = header.indexOf(desktopMarker);
	const mobileStart = header.indexOf(mobileMarker);
	assert.notEqual(desktopStart, -1, 'desktop Products dropdown marker must exist');
	assert.notEqual(mobileStart, -1, 'mobile Products submenu marker must exist');
	const desktopEnd = header.indexOf(menuEndMarker, desktopStart);
	const mobileEnd = header.indexOf(menuEndMarker, mobileStart);
	assert.notEqual(desktopEnd, -1, 'desktop Products dropdown end marker must exist');
	assert.notEqual(mobileEnd, -1, 'mobile Products submenu end marker must exist');

	const menus = {
		desktop: header.slice(desktopStart, desktopEnd),
		mobile: header.slice(mobileStart, mobileEnd),
	};
	assert.doesNotMatch(header, /\/products\/wallets\//);
	assert.doesNotMatch(header, />\s*Wallets\s*</);
	for (const [menuName, menu] of Object.entries(menus)) {
		assert.equal(countMatches(menu, />\s*Albums\s*</g), 1, `${menuName} menu must have one Albums label`);
		for (const album of Object.keys(routeEntries)) {
			assert.equal(countMatches(menu, new RegExp(`href=\\{photoAlbums\\.${album}\\}`, 'g')), 1, `${menuName} menu must have one ${album} album link`);
		}
	}
});

test('real wallet records have exactly one valid category and the expected counts', () => {
	assert.ok(walletGallery, 'wallet gallery must exist');
	assert.equal(walletGallery.title, 'Custom Wallets');
	const expectedCounts = {
		bifold: 10,
		trifold: 6,
		roper: 7,
		biker: 6,
		'checkbook-long': 5,
	};
	assert.equal(walletGallery.images.length, 34, 'All must contain 34 wallet records');
	for (const image of walletGallery.images) {
		assert.equal(Object.prototype.hasOwnProperty.call(image, 'category'), true, `${image.src} must have a category`);
		assert.equal(typeof image.category, 'string', `${image.src} must have exactly one string category`);
		assert.equal(Object.prototype.hasOwnProperty.call(expectedCounts, image.category), true, `${image.src} has invalid category ${image.category}`);
	}
	const actualCounts = Object.fromEntries(Object.keys(expectedCounts).map((category) => [category, walletGallery.images.filter((image) => image.category === category).length]));
	assert.deepEqual(actualCounts, expectedCounts);
	for (const gallery of galleries.filter((entry) => entry.slug !== 'wallets')) {
		for (const image of gallery.images) {
			assert.equal(Object.prototype.hasOwnProperty.call(image, 'category'), false, `${gallery.slug}:${image.src} must remain category-free`);
		}
	}
	const nonWalletGalleryHash = crypto
		.createHash('sha256')
		.update(JSON.stringify(galleries.filter((gallery) => gallery.slug !== 'wallets')))
		.digest('hex');
	assert.equal(nonWalletGalleryHash, expectedNonWalletGalleryHash, 'non-wallet gallery configuration and records must exactly match the approved snapshot');
});

test('all gallery routes and assets remain present with accurate decodable dimensions', async () => {
	assert.deepEqual(galleries.map((gallery) => gallery.slug), ['wallets', 'belts', 'welding-gear', 'leather-work', 'bible-covers', 'portfolios']);
	for (const gallery of galleries) {
		assert.ok(gallery.images.length > 0, `${gallery.slug} must retain its gallery records`);
		for (const image of gallery.images) {
			const assetPath = path.join(root, 'public', image.src.replace(/^\//, ''));
			assert.equal(fs.existsSync(assetPath), true, `${gallery.slug}:${image.src} must exist`);
			const metadata = await sharp(assetPath).metadata();
			assert.equal(metadata.format, 'webp', `${gallery.slug}:${image.src} must decode as WebP`);
			assert.equal(metadata.width, image.width, `${gallery.slug}:${image.src} declared width must match decoded width`);
			assert.equal(metadata.height, image.height, `${gallery.slug}:${image.src} declared height must match decoded height`);
		}
	}
});

test('all prepared Roper and Tri-fold assets use the complete-photo 1600 by 1200 card geometry', async () => {
	for (const name of preparedAssetNames) {
		const image = walletGallery.images.find((entry) => entry.src === `/gallery/wallets/${name}`);
		assert.ok(image, `${name} must have a wallet record`);
		assert.deepEqual({ width: image.width, height: image.height }, { width: 1600, height: 1200 }, `${name} record must declare 1600x1200`);
		const metadata = await sharp(path.join(root, 'public', 'gallery', 'wallets', name)).metadata();
		assert.deepEqual({ width: metadata.width, height: metadata.height }, { width: 1600, height: 1200 }, `${name} output must decode at 1600x1200`);
	}
});

test('selected source photographs still match their original SHA-256 hashes', (context) => {
	assert.equal(sourcePhotoHashes.length, 12);
	const unavailable = sourcePhotoHashes.filter(([sourcePath]) => !fs.existsSync(sourcePath));
	if (unavailable.length > 0) {
		context.skip('Original source-photo drive is not available in this environment.');
		return;
	}
	for (const [sourcePath, expectedHash] of sourcePhotoHashes) {
		const actual = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex').toUpperCase();
		assert.equal(actual, expectedHash, sourcePath);
	}
});

test('wallet route uses exact filters, accessible state, and the two normal order CTAs', () => {
	const page = read('src/app/gallery/[slug]/page.tsx');
	const component = read('src/components/WalletGallery.tsx');
	assert.match(component, /\{walletFilters\.map\(\(filter\) => \(/, 'component must render the executable model filters');

	const walletGuardIndex = page.indexOf("gallery.slug === 'wallets' ? (");
	const walletComponentIndex = page.indexOf('<WalletGallery images={gallery.images} />');
	const nonWalletLightboxIndex = page.indexOf('<GalleryLightbox images={gallery.images} />');
	const emptyStateIndex = page.indexOf('New photos coming soon');
	assert.notEqual(walletGuardIndex, -1, 'wallet-only route guard must exist');
	assert.ok(walletComponentIndex > walletGuardIndex, 'wallet component must render inside the wallet guard');
	assert.ok(nonWalletLightboxIndex > walletComponentIndex, 'non-wallet lightbox must remain after the wallet branch');
	assert.ok(emptyStateIndex > nonWalletLightboxIndex, 'non-wallet empty-state branch must remain after gallery branches');

	assert.match(component, /aria-pressed=\{activeCategory === filter\.value\}/);
	assert.match(component, /role="group" aria-label="Filter custom wallets by style"/);
	assert.match(component, /<p className="sr-only" role="status">/);
	assert.match(component, /\{status\}/);
	assert.doesNotMatch(component, /aria-live=/);

	assert.equal(countMatches(page, /href="\/#custom-order"/g), 1, 'page must contain exactly the top custom-order CTA');
	assert.match(page, /href="\/#custom-order"[\s\S]{0,300}>\s*Start a custom order\s*<\/Link>/, 'top CTA must target the order section');
	const bottomStart = component.indexOf('<div className="mt-10 text-center">');
	assert.notEqual(bottomStart, -1, 'normal bottom CTA wrapper must exist');
	const bottomSection = component.slice(bottomStart);
	assert.equal(countMatches(bottomSection, /href="\/#custom-order"/g), 1, 'normal bottom CTA must contain one order link');
	assert.match(bottomSection, /href="\/#custom-order"[\s\S]{0,300}>Start Your Custom Order<\/Link>/, 'normal bottom CTA must target the order section');
	assert.equal(countMatches(component.slice(0, bottomStart), /href="\/#custom-order"/g), 1, 'empty-state CTA is checked separately and must not replace the normal bottom CTA');
});

test('executable wallet filter model drives initial All state and every selection transition', () => {
	const modelPath = 'src/components/walletGalleryModel.ts';
	assert.equal(fs.existsSync(path.join(root, modelPath)), true, 'walletGalleryModel.ts must exist');
	const model = loadTypeScriptModule(modelPath);
	const expectedFilters = [
		{ value: 'all', label: 'All' },
		{ value: 'bifold', label: 'Bifold' },
		{ value: 'trifold', label: 'Tri-fold' },
		{ value: 'roper', label: 'Roper' },
		{ value: 'biker', label: 'Biker' },
		{ value: 'checkbook-long', label: 'Checkbook / Long' },
	];
	assert.deepEqual(JSON.parse(JSON.stringify(model.walletFilters)), expectedFilters);
	assert.equal(model.initialWalletCategory, 'all');

	let activeCategory = model.initialWalletCategory;
	let view = model.getWalletView(walletGallery.images, activeCategory);
	assert.deepEqual(view.visibleImages.map((image) => image.src), walletGallery.images.map((image) => image.src));
	assert.equal(view.status, '34 wallets shown for All.');

	const expectedCounts = { bifold: 10, trifold: 6, roper: 7, biker: 6, 'checkbook-long': 5 };
	for (const filter of expectedFilters.slice(1)) {
		activeCategory = model.selectWalletCategory(activeCategory, filter.value);
		assert.equal(activeCategory, filter.value);
		view = model.getWalletView(walletGallery.images, activeCategory);
		const expectedImages = walletGallery.images.filter((image) => image.category === filter.value);
		assert.deepEqual(view.visibleImages.map((image) => image.src), expectedImages.map((image) => image.src));
		assert.equal(view.visibleImages.length, expectedCounts[filter.value]);
		assert.equal(view.status, `${expectedCounts[filter.value]} wallets shown for ${filter.label}.`);
	}
	assert.equal(model.selectWalletCategory(activeCategory, 'not-a-wallet-filter'), activeCategory, 'invalid selections must preserve current state');

	const component = read('src/components/WalletGallery.tsx');
	assert.match(component, /useState<ActiveWalletCategory>\(initialWalletCategory\)/);
	assert.match(component, /getWalletView\(images, activeCategory\)/);
	assert.match(component, /setActiveCategory\(selectWalletCategory\(activeCategory, filter\.value\)\)/);
});

test('WalletGallery requires categorized wallet records while standard records stay category-free', () => {
	const data = read('src/data/galleries.ts');
	const component = read('src/components/WalletGallery.tsx');
	assert.match(data, /export type WalletGalleryImage = GalleryImage & \{\s*category: WalletCategory;\s*\};/s);
	assert.match(component, /import type \{ WalletGalleryImage \} from '@\/data\/galleries';/);
	assert.match(component, /type WalletGalleryProps = \{ images: WalletGalleryImage\[\] \};/);
});

test('wallet cards preserve complete photos without stretching or hover cropping', () => {
	const component = read('src/components/WalletGallery.tsx');
	const lightbox = read('src/components/GalleryLightbox.tsx');
	assert.match(component, /<GalleryLightbox images=\{visibleImages\} imageFit="contain" \/>/);
	assert.match(lightbox, /imageFit === 'contain' \? 'object-contain' : 'object-cover transition-transform duration-500 group-hover:scale-105'/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const blogUrl = 'https://blog.twistedcustomleather.com/blog';
const header = readFileSync(new URL('../src/components/Header.tsx', import.meta.url), 'utf8');
const footer = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8');

function positionsInOrder(source, labels) {
	let previous = -1;
	for (const label of labels) {
		const current = source.indexOf(label, previous + 1);
		assert.ok(current > previous, `${label} must appear after the previous navigation item`);
		previous = current;
	}
}

test('header contains desktop and mobile Blog links in the approved order', () => {
	const matchingUrls = header.match(/https:\/\/blog\.twistedcustomleather\.com\/blog/g) ?? [];
	assert.equal(matchingUrls.length, 2);

	const firstNavStart = header.indexOf('<nav');
	const firstNavEnd = header.indexOf('</nav>', firstNavStart);
	const secondNavStart = header.indexOf('<nav', firstNavEnd);
	const secondNavEnd = header.indexOf('</nav>', secondNavStart);

	positionsInOrder(header.slice(firstNavStart, firstNavEnd), ['About', 'Blog', 'Contact']);
	positionsInOrder(header.slice(secondNavStart, secondNavEnd), ['About', 'Blog', 'Contact']);
});

test('footer contains one Blog link immediately after Website', () => {
	const matchingUrls = footer.match(/https:\/\/blog\.twistedcustomleather\.com\/blog/g) ?? [];
	assert.equal(matchingUrls.length, 1);
	positionsInOrder(footer, ['Website', 'Blog', 'Facebook']);
});

test('Blog links do not open a new tab', () => {
	const sources = [header, footer];
	for (const source of sources) {
		const tags = source.match(new RegExp(`<(?:Link|a)[^>]*href="${blogUrl}"[^>]*>`, 'g')) ?? [];
		assert.ok(tags.length > 0);
		for (const tag of tags) assert.doesNotMatch(tag, /target=/);
	}
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const model = loadTypeScriptModule('src/components/custom-order/referenceImageUploadModel.ts');
const controller = loadTypeScriptModule('src/components/custom-order/orderAssistantControllerModel.ts');

const file = (name = 'reference.jpg') => ({ name, type: 'image/jpeg', size: 1024, blob: 'must-not-escape' });
const uploaded = (name = 'reference.jpg', token = 'valid-token') => ({ name, url: `/api/order-assets/${token}`, contentType: 'image/jpeg' });
const entry = (id, selectedFile = file()) => ({ id, file: selectedFile });
const start = (state, entries) => {
	const result = model.startReferenceImageUpload(state, entries);
	assert.equal(result.started, true);
	return result.state;
};
const retry = (state, id) => {
	const result = model.retryReferenceImageUpload(state, id);
	assert.equal(result.started, true);
	return result;
};

test('reference control keeps its accessible live status and parent-owned state wiring', () => {
	const source = read('src/components/custom-order/ReferenceImageUpload.tsx');
	const assistant = read('src/components/custom-order/CustomOrderAssistant.tsx');
	assert.match(source, /up to 3/i);
	assert.match(source, /8 MB/i);
	assert.match(source, /JPEG.*PNG/is);
	assert.doesNotMatch(source, /WebP|HEIC/i);
	assert.match(source, /Retry/);
	assert.match(source, /Remove/);
	assert.match(source, /aria-live/);
	assert.match(assistant, /referenceImageUploadState/);
	assert.match(assistant, /referenceImageUploadInFlight/);
});

test('start, failure, navigation, retry, and success retain the selected File only in memory', () => {
	const selectedFile = file();
	let state = model.createReferenceImageUploadState();
	state = start(state, [entry('retry-me', selectedFile)]);
	state = model.failReferenceImageUpload(state, ['retry-me'], 'Temporary upload failure.');
	const stateAfterNavigation = state;
	state = retry(stateAfterNavigation, 'retry-me').state;
	state = model.completeReferenceImageUpload(state, ['retry-me'], [uploaded()]);

	assert.equal(state.pending.length, 0);
	assert.equal(state.failed.length, 0);
	assert.deepEqual(state.uploaded, [uploaded()]);
	assert.equal(stateAfterNavigation.failed[0].file, selectedFile);
});

test('removing a failed entry retains other upload state', () => {
	let state = model.createReferenceImageUploadState();
	state = start(state, [entry('one'), entry('two')]);
	state = model.failReferenceImageUpload(state, ['one', 'two'], 'Upload failed.');
	state = model.removeFailedReference(state, 'one');

	assert.deepEqual(state.failed.map((reference) => reference.id), ['two']);
});

test('removing a successful entry does not cancel another pending upload', () => {
	let state = model.createReferenceImageUploadState();
	state = start(state, [entry('complete')]);
	state = model.completeReferenceImageUpload(state, ['complete'], [uploaded('complete.jpg', 'complete-token')]);
	state = start(state, [entry('pending')]);
	state = model.removeUploadedReference(state, '/api/order-assets/complete-token');

	assert.equal(state.uploaded.length, 0);
	assert.deepEqual(state.pending.map((reference) => reference.id), ['pending']);
});

test('pending, failed, and successful entries all consume the three available slots', () => {
	let state = model.createReferenceImageUploadState();
	state = start(state, [entry('pending')]);
	state = model.failReferenceImageUpload(state, ['pending'], 'Upload failed.');
	state = start(state, [entry('successful')]);
	state = model.completeReferenceImageUpload(state, ['successful'], [uploaded('successful.jpg', 'successful-token')]);
	state = start(state, [entry('last')]);

	assert.equal(model.referenceImageSlotCount(state), 3);
	assert.equal(model.canStartReferenceImageUpload(state, 1), false);
});

test('malformed success entries become failures and never enter uploaded state', () => {
	for (const malformed of [
		{ ...uploaded(), name: '   ' },
		{ ...uploaded(), contentType: 'image/gif' },
		{ ...uploaded(), url: 'data:image/jpeg;base64,abc' },
	]) {
		let state = model.createReferenceImageUploadState();
		state = start(state, [entry('bad')]);
		state = model.completeReferenceImageUpload(state, ['bad'], [malformed]);
		assert.equal(state.uploaded.length, 0);
		assert.equal(state.failed.length, 1);
	}
});

test('duplicate URLs within a response or against earlier uploads become failures', () => {
	let state = model.createReferenceImageUploadState();
	state = start(state, [entry('one'), entry('two')]);
	state = model.completeReferenceImageUpload(state, ['one', 'two'], [uploaded('one.jpg', 'duplicate'), uploaded('two.jpg', 'duplicate')]);
	assert.equal(state.uploaded.length, 0);
	assert.equal(state.failed.length, 2);

	state = model.createReferenceImageUploadState();
	state = start(state, [entry('first')]);
	state = model.completeReferenceImageUpload(state, ['first'], [uploaded('first.jpg', 'already-used')]);
	state = start(state, [entry('second')]);
	state = model.completeReferenceImageUpload(state, ['second'], [uploaded('second.jpg', 'already-used')]);
	assert.equal(state.uploaded.length, 1);
	assert.equal(state.failed.length, 1);
});

test('checkout payload contains only canonical successful reference metadata', () => {
	let state = model.createReferenceImageUploadState();
	state = start(state, [entry('success'), entry('failure', file('failure.jpg'))]);
	state = model.completeReferenceImageUpload(state, ['success'], [uploaded('  success.jpg  ', 'success-token')]);
	state = model.failReferenceImageUpload(state, ['failure'], 'Upload failed.');
	state = start(state, [entry('pending', file('pending.jpg'))]);

	const payload = controller.buildCheckoutPayload({
		checkoutAttemptId: '123e4567-e89b-42d3-a456-426614174000', productId: 'custom-wallet', customization: {}, upgradeIds: [], referenceId: undefined, referenceImages: state.uploaded,
		customerName: 'Ada', email: 'ada@example.com', phone: '', notes: '', acknowledgedStartingPrice: true,
	});

	assert.deepEqual(payload.referenceImages, [uploaded('success.jpg', 'success-token')]);
	assert.doesNotMatch(JSON.stringify(payload), /must-not-escape|failure\.jpg|pending\.jpg|data:image|blob:/i);
});

test('new starts refuse over-limit, repeated, and colliding IDs without creating pending entries', () => {
	let state = start(model.createReferenceImageUploadState(), [entry('one'), entry('two'), entry('three')]);
	let result = model.startReferenceImageUpload(state, [entry('four')]);
	assert.equal(result.started, false);
	assert.equal(result.state, state);

	state = model.createReferenceImageUploadState();
	result = model.startReferenceImageUpload(state, [entry('repeat'), entry('repeat')]);
	assert.equal(result.started, false);
	assert.equal(result.state, state);

	state = start(model.createReferenceImageUploadState(), [entry('pending')]);
	result = model.startReferenceImageUpload(state, [entry('pending')]);
	assert.equal(result.started, false);
	assert.equal(result.state, state);
	assert.deepEqual(state.pending.map((reference) => reference.id), ['pending']);

	state = model.failReferenceImageUpload(state, ['pending'], 'Upload failed.');
	result = model.startReferenceImageUpload(state, [entry('pending')]);
	assert.equal(result.started, false);
	assert.equal(result.state, state);
	assert.deepEqual(state.failed.map((reference) => reference.id), ['pending']);
});

test('rapid duplicate starts and retries are rejected while the first batch is pending', () => {
	let state = model.createReferenceImageUploadState();
	const firstStart = model.startReferenceImageUpload(state, [entry('rapid')]);
	const secondStart = model.startReferenceImageUpload(firstStart.state, [entry('rapid')]);
	assert.equal(firstStart.started, true);
	assert.equal(secondStart.started, false);
	assert.deepEqual(secondStart.state.pending.map((reference) => reference.id), ['rapid']);

	state = model.failReferenceImageUpload(firstStart.state, ['rapid'], 'Upload failed.');
	const firstRetry = model.retryReferenceImageUpload(state, 'rapid');
	const secondRetry = model.retryReferenceImageUpload(firstRetry.state, 'rapid');
	assert.equal(firstRetry.started, true);
	assert.equal(secondRetry.started, false);
	assert.deepEqual(secondRetry.state.pending.map((reference) => reference.id), ['rapid']);
});

test('expired verification clears stale uploaded and pending URLs so checkout cannot submit them', () => {
	const state = model.expireReferenceImageSession({
		uploaded: [{ name: 'old.jpg', url: '/api/order-assets/old-token', contentType: 'image/jpeg' }],
		pending: [{ id: 'pending', file: file('pending.jpg') }],
		failed: [{ id: 'failed', file: file('failed.jpg'), error: 'old failure' }],
		status: 'old',
	});
	assert.deepEqual(state.uploaded, []);
	assert.deepEqual(state.pending, []);
	assert.deepEqual(state.failed, []);
	assert.match(state.status, /verification expired|upload again/i);
});

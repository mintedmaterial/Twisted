const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { loadTypeScriptModule } = require('./test-helpers.cjs');

const ugc = loadTypeScriptModule('src/lib/ugc.ts');

let runtimeEnv;
let bucketPuts;
let preparedStatements;

function makeBucket() {
	bucketPuts = [];
	return {
		put: async (key, body, options) => {
			bucketPuts.push({ key, body, options });
			return {};
		},
	};
}

function makeDb() {
	preparedStatements = [];
	return {
		prepare: (sql) => {
			const statement = {
				bind: (...params) => {
					preparedStatements.push({ sql, params });
					return { run: async () => ({}) };
				},
			};
			return statement;
		},
	};
}

const routeMocks = {
	'@opennextjs/cloudflare': { getCloudflareContext: () => ({ env: runtimeEnv }) },
	'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
	'@/lib/ugc': ugc,
};

function loadRouteModule(relativeFile, mocks, moduleCache = new Map()) {
	const fs = require('node:fs');
	const vm = require('node:vm');
	const ts = require('typescript');
	const root = path.resolve(__dirname, '..');
	const absoluteFile = path.resolve(root, relativeFile);
	if (!fs.existsSync(absoluteFile)) throw new Error(`Unable to resolve route module: ${relativeFile}`);
	if (moduleCache.has(absoluteFile)) return moduleCache.get(absoluteFile).exports;

	const module = { exports: {} };
	moduleCache.set(absoluteFile, module);
	const javascript = ts.transpileModule(fs.readFileSync(absoluteFile, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
		fileName: absoluteFile,
	}).outputText;
	const localRequire = (request) => {
		if (Object.hasOwn(mocks, request)) return mocks[request];
		if (request.startsWith('@/')) {
			return loadTypeScriptModule(path.join('src', request.slice(2)));
		}
		return require(request);
	};
	const execute = new vm.Script(
		`(function (exports, module, require) {\n${javascript}\n})`,
		{ filename: absoluteFile },
	).runInThisContext();
	execute(module.exports, module, localRequire);
	return module.exports;
}

const { POST } = loadRouteModule('src/app/api/ugc/submit/route.ts', routeMocks);

function requestWith(contentType, formData) {
	const headers = new Headers();
	if (contentType) headers.set('content-type', contentType);
	return {
		headers,
		formData: async () => {
			if (formData === undefined) {
				throw new TypeError("Failed to construct 'FormData': multipart/form-data required");
			}
			return formData;
		},
	};
}

class FakeFormData {
	constructor(entries) {
		this.entries = new Map(entries);
	}
	get(name) {
		return this.entries.get(name) ?? null;
	}
}

function validFormData() {
	const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'photo.jpg', { type: 'image/jpeg' });
	return new FakeFormData([
		['email', 'contributor@example.com'],
		['firstName', 'Casey'],
		['productCategory', 'wallet'],
		['rightsReleaseAgreed', 'true'],
		['creditContingencyAgreed', 'true'],
		['file', file],
	]);
}

test.beforeEach(() => {
	runtimeEnv = { DB: makeDb(), UGC_ASSETS: makeBucket() };
});

test('rejects JSON bodies with 400 instead of 500', async () => {
	const response = await POST(requestWith('application/json'));
	assert.equal(response.status, 400);
	const body = await response.json();
	assert.equal(body.error, 'Expected multipart/form-data submission.');
});

test('rejects requests without a body or content type with 400', async () => {
	const response = await POST(requestWith(null));
	assert.equal(response.status, 400);
	const body = await response.json();
	assert.equal(body.error, 'Expected multipart/form-data submission.');
});

test('multi-part with boundary is accepted by the guard', async () => {
	const response = await POST(
		requestWith('multipart/form-data; boundary=----testboundary', validFormData()),
	);
	assert.equal(response.status, 201);
	const body = await response.json();
	assert.equal(body.success, true);
});

test('multipart requests still validate required fields', async () => {
	const formData = validFormData();
	formData.entries.set('email', 'not-an-email');
	const response = await POST(
		requestWith('multipart/form-data; boundary=----testboundary', formData),
	);
	assert.equal(response.status, 400);
	const body = await response.json();
	assert.equal(body.error, 'A valid email is required.');
});

test('accepted submissions store the asset and persist the row', async () => {
	const response = await POST(
		requestWith('multipart/form-data; boundary=----testboundary', validFormData()),
	);
	assert.equal(response.status, 201);
	assert.equal(bucketPuts.length, 1);
	assert.equal(preparedStatements.length, 1);
	assert.ok(preparedStatements[0].sql.includes('INSERT INTO ugc_submissions'));
});

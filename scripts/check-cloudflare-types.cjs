const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { normalizeGeneratedTypes, withTemporaryDirectory } = require('./cloudflare-types-model.cjs');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'cloudflare-env.d.ts');
const checkOnly = process.argv.includes('--check');
const wrangler = path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const expectedWrangler = require(path.join(root, 'package.json')).devDependencies.wrangler;
const installedWrangler = require(path.join(root, 'node_modules', 'wrangler', 'package.json')).version;
if (installedWrangler !== expectedWrangler) {
	console.error(`Locked Wrangler ${expectedWrangler} is required; found ${installedWrangler}. Run npm ci.`);
	process.exitCode = 1;
} else {
	process.exitCode = withTemporaryDirectory(os.tmpdir(), (temporaryDirectory) => {
		const generatedTarget = path.join(temporaryDirectory, 'cloudflare-env.d.ts');
		const result = spawnSync(process.execPath, [wrangler, 'types', '--config', path.join(root, 'wrangler.jsonc'), '--env-interface', 'CloudflareEnv', './cloudflare-env.d.ts'], {
			cwd: temporaryDirectory,
			stdio: 'inherit',
			env: { ...process.env, XDG_CONFIG_HOME: path.join(root, '.wrangler', 'xdg-config'), WRANGLER_LOG_PATH: path.join(root, '.wrangler', 'logs', 'typecheck.log') },
		});
		if (result.status !== 0) return result.status ?? 1;
		const normalized = normalizeGeneratedTypes(fs.readFileSync(generatedTarget, 'utf8'));
		if (checkOnly) {
			const committed = fs.readFileSync(target, 'utf8');
			if (normalized !== committed) {
				console.error('cloudflare-env.d.ts is stale. Regenerate it with npm run cf-typegen and commit the result.');
				return 1;
			}
		} else {
			fs.writeFileSync(target, normalized);
		}
		return 0;
	});
}

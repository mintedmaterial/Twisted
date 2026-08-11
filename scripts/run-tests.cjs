const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = __dirname;
const tests = fs.readdirSync(directory)
  .filter((name) => name.endsWith('.test.cjs'))
  .sort()
  .map((name) => path.join(directory, name));
const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;

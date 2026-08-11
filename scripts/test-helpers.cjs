const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function resolveTypeScriptModule(request, parentFile) {
  const basePath = request.startsWith('.')
    ? path.resolve(path.dirname(parentFile), request)
    : path.resolve(root, request);
  const candidates = [basePath, `${basePath}.ts`, path.join(basePath, 'index.ts')];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));

  if (!resolved) {
    throw new Error(`Unable to resolve TypeScript module: ${request}`);
  }

  return resolved;
}

function loadTypeScriptModule(file, moduleCache = new Map()) {
  const absoluteFile = resolveTypeScriptModule(file, path.join(root, 'index.ts'));

  if (moduleCache.has(absoluteFile)) {
    return moduleCache.get(absoluteFile).exports;
  }

  const module = { exports: {} };
  moduleCache.set(absoluteFile, module);
  const source = fs.readFileSync(absoluteFile, 'utf8');
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: absoluteFile,
  }).outputText;
  const localRequire = (request) => {
    if (request.startsWith('.')) {
      return loadTypeScriptModule(resolveTypeScriptModule(request, absoluteFile), moduleCache);
    }

    return require(request);
  };
  const executeModule = new vm.Script(
    `(function (exports, module, require) {\n${javascript}\n})`,
    { filename: absoluteFile },
  ).runInThisContext();

  executeModule(module.exports, module, localRequire);
  return module.exports;
}

module.exports = { loadTypeScriptModule };

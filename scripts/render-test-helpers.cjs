const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const nextMocks = {
  'next/navigation': { useSearchParams: () => new URLSearchParams(window.location.search) },
  'next/script': { __esModule: true, default: () => null },
  'next/image': {
    __esModule: true,
    default: ({ fill: _fill, priority: _priority, ...props }) => React.createElement('img', props),
  },
  'next/link': {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement('a', props, children),
  },
};

function resolveModule(request, parentFile) {
  const base = request.startsWith('@/')
    ? path.resolve(root, 'src', request.slice(2))
    : path.resolve(path.dirname(parentFile), request);
  return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
    .find((candidate) => fs.existsSync(candidate));
}

function loadModule(file, cache) {
  if (cache.has(file)) return cache.get(file).exports;
  const loaded = { exports: {} };
  cache.set(file, loaded);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const localRequire = (request) => {
    if (Object.hasOwn(nextMocks, request)) return nextMocks[request];
    if (request.startsWith('.') || request.startsWith('@/')) {
      const resolved = resolveModule(request, file);
      if (!resolved) throw new Error(`Unable to resolve rendered component dependency ${request}`);
      return loadModule(resolved, cache);
    }
    return require(request);
  };
  new vm.Script(`(function(exports,module,require){${output}\n})`, { filename: file })
    .runInThisContext()(loaded.exports, loaded, localRequire);
  return loaded.exports;
}

async function loadRenderedComponent(relativeFile) {
  return loadModule(path.resolve(root, relativeFile), new Map()).default;
}

module.exports = { loadRenderedComponent };

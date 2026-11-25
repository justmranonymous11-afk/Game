import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outPath = process.argv[2] || path.join(root, 'dist', 'sunthread-standalone.html');

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const moduleOrder = [
  'src/constants.js',
  'src/math.js',
  'src/audio.js',
  'src/entities.js',
  'src/engine.js',
  'src/renderer.js',
  'src/main.js',
];

function stripModuleSyntax(code) {
  return code
    // Remove multi-line or single-line import statements
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    // Strip leading `export ` keyword from declarations
    .replace(/^export\s+(?=(const|let|var|function|class)\b)/gm, '');
}

const bundledJs = [
  '(function () {',
  '  "use strict";',
  ...moduleOrder.map((rel) => {
    const raw = fs.readFileSync(path.join(root, rel), 'utf8');
    return `\n  // ---- ${rel} ----\n${stripModuleSyntax(raw)}`;
  }),
  '})();',
].join('\n');

const standalone = html
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/main.js"></script>', `<script>\n${bundledJs}\n</script>`);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, standalone, 'utf8');
console.log(`Built standalone bundle: ${outPath} (${Math.round(standalone.length / 1024)} KB)`);

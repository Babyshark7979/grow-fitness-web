import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rejected = JSON.parse(fs.readFileSync(path.join(root, 'config', 'rejected-assets.json'), 'utf8'));
const textExtensions = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const violations = [];
const sourceFiles = walk(path.join(root, 'src')).filter((file) => textExtensions.has(path.extname(file)));

for (const asset of rejected) {
  const publicPath = path.join(root, 'public', asset.path.replace(/^[/\\]+/, ''));
  if (fs.existsSync(publicPath)) {
    violations.push(`File bị loại đã xuất hiện lại: ${path.relative(root, publicPath)}`);
  }

  for (const sourceFile of sourceFiles) {
    const content = fs.readFileSync(sourceFile, 'utf8');
    if (content.includes(asset.path) || content.includes(path.basename(asset.path))) {
      violations.push(`Trang web gọi lại ảnh bị loại: ${path.relative(root, sourceFile)} → ${asset.path}`);
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Rejected asset gate: PASS (${rejected.length} ảnh bị loại không còn trong website)`);

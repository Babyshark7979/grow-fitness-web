import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Rào cản vật lý từ cấm — đồng bộ với scripts/layer1-gate/ast_linter.py bên brain-vault.
// Chạy trong `npm run check` + `prebuild` (Vercel fail build nếu vi phạm) + pre-commit hook.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const bannedTerms = {
  'xe ôm': 'Bán sức lao động đứng phòng cả ngày',
  'nhai mì tôm': 'Áp lực chỉ tiêu doanh số phập phồng',
  'chăn bò': 'Chế độ thù lao chưa tương xứng',
  'vắt chanh': 'Thiếu tích lũy dài hạn',
};

const textExtensions = new Set(['.astro', '.md', '.mdx', '.html', '.ts', '.tsx', '.js', '.mjs', '.json']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const violations = [];
const sourceFiles = walk(path.join(root, 'src')).filter((file) => textExtensions.has(path.extname(file)));

for (const sourceFile of sourceFiles) {
  // NFC normalize để bắt cả từ cấm gõ dạng dấu tổ hợp (NFD) — cùng lỗ hổng audit 2026-07-25 bên vault.
  const content = fs.readFileSync(sourceFile, 'utf8').normalize('NFC').toLowerCase();
  const lines = content.split('\n');
  for (const [term, alternative] of Object.entries(bannedTerms)) {
    const normalizedTerm = term.normalize('NFC');
    lines.forEach((line, index) => {
      if (line.includes(normalizedTerm)) {
        violations.push(
          `${path.relative(root, sourceFile)}:${index + 1} chứa từ cấm "${term}" → thay bằng: "${alternative}"`,
        );
      }
    });
  }
}

if (violations.length > 0) {
  console.error('❌ [TỪ CẤM - BẢO TOÀN TRÂN TRỌNG] Nội dung web chứa từ ngữ hạ thấp:');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Banned words gate: PASS (${sourceFiles.length} file sạch ${Object.keys(bannedTerms).length} từ cấm)`);

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsRoot = path.join(root, 'src', 'data', 'post');

const bannedPhrases = [
  'xe ôm',
  'nhai mì tôm',
  'chăn bò',
  'vắt chanh',
  'bán mồ hôi',
  'bán sức lao động',
  'gym cỏ',
  'gãy cánh',
  'cai thầu',
  'gạ gẫm',
  'ăn rác',
  'việc rác',
  'chốt deal',
  'tủ lạnh thiu',
  'đè chết tươi',
];

const textExtensions = new Set(['.astro', '.md', '.mdx', '.html', '.ts', '.tsx', '.js', '.mjs', '.json']);
const requiredMetadata = ['fact_sources', 'reviewer', 'review_status', 'approved_by', 'approved_at', 'approval_ref'];

function normalizeForPolicy(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('vi')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function validatePostMetadata(data, relativePath) {
  const errors = [];
  const missing = requiredMetadata.filter((field) => !Object.prototype.hasOwnProperty.call(data, field));

  if (missing.length > 0) {
    errors.push(`${relativePath}: thiếu metadata ${missing.join(', ')}`);
    return errors;
  }

  if (!Array.isArray(data.fact_sources) || data.fact_sources.length === 0) {
    errors.push(`${relativePath}: fact_sources phải là danh sách có ít nhất một nguồn`);
  } else {
    data.fact_sources.forEach((source, index) => {
      if (!source || typeof source.ref !== 'string' || !source.ref.trim()) {
        errors.push(`${relativePath}: fact_sources[${index}].ref không hợp lệ`);
      }
      if (!source || typeof source.scope !== 'string' || !source.scope.trim()) {
        errors.push(`${relativePath}: fact_sources[${index}].scope không hợp lệ`);
      }
    });
  }

  if (typeof data.reviewer !== 'string' || !data.reviewer.trim()) {
    errors.push(`${relativePath}: reviewer không được để trống`);
  }

  if (!['reviewed_pending_owner', 'approved'].includes(data.review_status)) {
    errors.push(`${relativePath}: review_status không hợp lệ`);
  }

  const approvalValues = [data.approved_by, data.approved_at, data.approval_ref];
  const hasAnyApproval = approvalValues.some((value) => value !== null);
  const hasCompleteApproval = approvalValues.every((value) => value !== null);

  if (data.review_status === 'approved' && !hasCompleteApproval) {
    errors.push(`${relativePath}: trạng thái approved phải có đủ người duyệt, thời gian và bằng chứng`);
  }
  if (data.review_status === 'reviewed_pending_owner' && hasAnyApproval) {
    errors.push(`${relativePath}: đang chờ duyệt thì ba trường phê duyệt phải là null`);
  }

  return errors;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const violations = [];
const publicRoot = path.join(root, 'public');
const sourceFiles = [path.join(root, 'src'), publicRoot]
  .flatMap((directory) => walk(directory))
  .filter((file) => textExtensions.has(path.extname(file)));
const normalizedBannedPhrases = bannedPhrases.map((phrase) => ({
  original: phrase,
  normalized: normalizeForPolicy(phrase),
}));

for (const sourceFile of sourceFiles) {
  const relativePath = path.relative(root, sourceFile);
  const searchableParts = [
    normalizeForPolicy(relativePath),
    ...fs.readFileSync(sourceFile, 'utf8').split(/\r?\n/).map(normalizeForPolicy),
  ];

  for (const phrase of normalizedBannedPhrases) {
    if (searchableParts.some((part) => part.includes(phrase.normalized))) {
      violations.push(`${relativePath}: còn cách nói hạ thấp hoặc biến thể của "${phrase.original}"`);
    }
  }
}

for (const postFile of walk(postsRoot).filter((file) => ['.md', '.mdx'].includes(path.extname(file)))) {
  const relativePath = path.relative(root, postFile);
  const content = fs.readFileSync(postFile, 'utf8');
  const frontmatter = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatter) {
    violations.push(`${relativePath}: không đọc được frontmatter`);
    continue;
  }

  try {
    const data = yaml.load(frontmatter[1]) ?? {};
    violations.push(...validatePostMetadata(data, relativePath));
  } catch (error) {
    violations.push(`${relativePath}: YAML không hợp lệ — ${error.message}`);
  }
}

if (violations.length > 0) {
  console.error('❌ [CHÍNH SÁCH NỘI DUNG] Website chưa đạt chuẩn tôn trọng và truy xuất nguồn:');
  console.error(violations.join('\n'));
  process.exit(1);
}

if (process.argv.includes('--self-test')) {
  const hyphenatedVariant = normalizeForPolicy('tuoi-30-hay-xe-om-cong-nghe');
  if (!hyphenatedVariant.includes(normalizeForPolicy('xe ôm'))) {
    throw new Error('Self-test thất bại: chưa bắt được biến thể không dấu/gạch nối.');
  }

  const invalidApproval = validatePostMetadata(
    {
      fact_sources: [{ ref: 'vault://example.md', scope: 'Ví dụ' }],
      reviewer: 'Codex',
      review_status: 'approved',
      approved_by: null,
      approved_at: null,
      approval_ref: null,
    },
    'fixture.md'
  );
  if (invalidApproval.length === 0) {
    throw new Error('Self-test thất bại: trạng thái approved thiếu bằng chứng vẫn lọt.');
  }
}

console.log(
  `Content policy: PASS (${sourceFiles.length} file nguồn, ${bannedPhrases.length} mẫu giọng điệu, metadata ${walk(postsRoot).length} bài)`
);

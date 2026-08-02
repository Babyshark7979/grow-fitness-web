import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const canonicalPath = 'public/dieu-hanh-grow.html';
const cleanRoutePath = 'public/dieu-hanh-grow/index.html';
const publishedHtml = fs.readFileSync(canonicalPath, 'utf8');
const cleanRouteHtml = fs.readFileSync(cleanRoutePath, 'utf8');

assert.equal(
  crypto.createHash('sha256').update(publishedHtml).digest('hex'),
  crypto.createHash('sha256').update(cleanRouteHtml).digest('hex'),
  'Canonical and clean-route HTML must be byte-identical'
);

assert.match(publishedHtml, /const\s+BLOB\s*=\s*["'][A-Za-z0-9+/=_-]+["']/, 'Encrypted payload is missing');
for (const forbidden of [
  '1A5BQ4WvYu5-izzHvX3V-hz2tZSdt-Qlnrs0Y6o9tXv8',
  'Vân Nguyễn',
  '0962789623',
  '1103380',
  'Cash Ledger',
]) {
  assert.equal(publishedHtml.includes(forbidden), false, `Encrypted wrapper leaks internal text: ${forbidden}`);
}

async function decrypt(source) {
  const password = process.env.INTERNAL_DASHBOARD_PASSWORD;
  if (!password) return null;
  const blobMatch = source.match(/const\s+BLOB\s*=\s*["']([^"']+)["']/);
  assert.ok(blobMatch, 'Encrypted payload not found');
  const raw = Buffer.from(blobMatch[1], 'base64');
  const salt = raw.subarray(0, 16);
  const iv = raw.subarray(16, 28);
  const ciphertext = raw.subarray(28);
  const keyMaterial = await crypto.webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plaintext = await crypto.webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

const decrypted = await decrypt(publishedHtml);
if (!decrypted) {
  console.log('[GROW OPS AUDIT] PASS: encrypted source and route parity; deep audit requires local password.');
  process.exit(0);
}

for (const required of [
  'data-view="week"',
  'data-view="month"',
  'data-view="quarter"',
  'Không tải tên hoặc số điện thoại',
  'Lợi nhuận thật',
  'Không lấy doanh thu trừ riêng Ads',
  'Chị Liên',
  'Anh Giang',
  'Tiểu Linh',
  'select A,D,E,F,G,H,I,J',
]) {
  assert.ok(decrypted.includes(required), `Dashboard is missing required contract: ${required}`);
}

for (const forbidden of ['Tên Khách', 'SĐT/ zalo', '0962789623']) {
  assert.equal(decrypted.includes(forbidden), false, `Dashboard payload contains PII field/value: ${forbidden}`);
}

assert.match(decrypted, /start:\s*['"]2026-07-13['"][\s\S]*spend:\s*1103380[\s\S]*newContacts:\s*13/);
assert.match(decrypted, /Cash Ledger/);
assert.match(decrypted, /Cost Ledger/);

console.log('[GROW OPS AUDIT] PASS: encryption, PII projection, periods, source labels, owners, and financial gates.');

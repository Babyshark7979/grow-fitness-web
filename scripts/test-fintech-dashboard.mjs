import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const canonicalPath = 'public/so-tai-chinh-grow.html';
const cleanRoutePath = 'public/so-tai-chinh-grow/index.html';
const publishedHtml = fs.readFileSync(canonicalPath, 'utf8');
const cleanRouteHtml = fs.readFileSync(cleanRoutePath, 'utf8');

assert.equal(
  crypto.createHash('sha256').update(publishedHtml).digest('hex'),
  crypto.createHash('sha256').update(cleanRouteHtml).digest('hex'),
  'Canonical and clean-route HTML must be byte-identical'
);

async function decryptPublishedDashboard(source) {
  const blobMatch = source.match(/const\s+BLOB\s*=\s*["']([^"']+)["']/);
  if (!blobMatch) return source;

  for (const forbidden of ['priceGroupX', 'pnlCostFixed', '55,00M', 'Hoa hồng Sale', 'Quỹ 110 ca']) {
    assert.equal(source.includes(forbidden), false, `Encrypted wrapper leaks sensitive text: ${forbidden}`);
  }

  const password = process.env.FINTECH_DASHBOARD_PASSWORD;
  if (!password) return null;

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

const html = await decryptPublishedDashboard(publishedHtml);
if (!html) {
  console.log('[FINTECH AUDIT] PASS: encrypted source and route parity; formula audit requires local password.');
  process.exit(0);
}

const inputDefaults = {
  targetProfit: '100',
  priceGroupX: '0.99',
  priceGymMct: '3.00',
  priceGoi12M: '18.00',
  pricePt: '0.50',
  cntSaleStaff: '2',
  cntTrainerStaff: '2',
  cntGroupX: '12',
  cntGymMct: '8',
  cntGoi12M: '2',
  cntPt: '100',
};

const outputIds = [
  'summaryRevenue',
  'summaryCosts',
  'summaryNet',
  'summaryMargin',
  'mobileNetProfit',
  'netCard',
  'scenarioStatus',
  'statusIcon',
  'statusTitle',
  'statusDescription',
  'targetProfitVal',
  'resGymCustomers',
  'resTargetRevenue',
  'resTargetNet',
  'pnlRevGroupX',
  'pnlRevGymMct',
  'pnlRevGoi12M',
  'pnlRevPt',
  'pnlRevGroupXNote',
  'pnlRevGymMctNote',
  'pnlRevGoi12MNote',
  'pnlRevPtNote',
  'pnlCostFixed',
  'pnlCostAds',
  'pnlPayManager',
  'pnlPayGroupTrainer',
  'pnlPayMctTrainer',
  'pnlPaySale',
  'pnlNetProfit',
  'pnlMarginPercent',
  'perCapManager',
  'perCapSale',
  'perCapTrainer',
  'perCapGroupTrainer',
  'perCapTrainerDesc',
  'cntSaleTag',
  'cntTrainerTag',
];

function createElement(id, value = '') {
  const classes = new Set();
  return {
    id,
    value,
    innerText: '',
    style: {},
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    scrollIntoView() {},
  };
}

const elements = Object.fromEntries(Object.entries(inputDefaults).map(([id, value]) => [id, createElement(id, value)]));
for (const id of outputIds) elements[id] = createElement(id);

const document = {
  getElementById(id) {
    assert.ok(elements[id], `Missing DOM stub for #${id}`);
    return elements[id];
  },
  querySelector(selector) {
    if (selector === '.input-panel') return createElement('input-panel');
    throw new Error(`Unexpected querySelector: ${selector}`);
  },
};

const scriptMatches = [...html.matchAll(/<script>\s*([\s\S]*?)\s*<\/script>/g)];
const scriptMatch = scriptMatches.at(-1);
assert.ok(scriptMatch, 'Dashboard calculation script not found');
const context = vm.createContext({ document, console });
vm.runInContext(scriptMatch[1], context, { filename: canonicalPath });

function setInputs(values) {
  for (const [id, value] of Object.entries(values)) elements[id].value = String(value);
  vm.runInContext('updateCalculations()', context);
}

assert.equal(elements.summaryRevenue.innerText, '84,38M');
assert.equal(elements.summaryCosts.innerText, '100,44M');
assert.equal(elements.summaryNet.innerText, '-16,06M');
assert.equal(elements.perCapManager.innerText, '9,69M');
assert.equal(elements.perCapSale.innerText, '2,95M/người');
assert.equal(elements.perCapTrainer.innerText, '9,90M/người');
assert.equal(elements.perCapGroupTrainer.innerText, '3,30M');
assert.equal(elements.pnlCostFixed.innerText, '55,00M');
assert.equal(elements.pnlNetProfit.innerText, '-16,06M');
assert.equal(elements.resGymCustomers.innerText, '55 khách');
assert.equal(elements.resTargetNet.innerText, '100,97M');
assert.equal(elements.netCard.classList.contains('positive'), false);

setInputs({
  priceGroupX: 2,
  priceGymMct: 4,
  priceGoi12M: 20,
  pricePt: 0.6,
  cntSaleStaff: 4,
  cntTrainerStaff: 3,
  cntGroupX: 20,
  cntGymMct: 15,
  cntGoi12M: 3,
  cntPt: 120,
});

assert.equal(elements.summaryRevenue.innerText, '178,00M');
assert.equal(elements.summaryCosts.innerText, '116,36M');
assert.equal(elements.summaryNet.innerText, '+61,64M');
assert.equal(elements.perCapManager.innerText, '11,56M');
assert.equal(elements.perCapSale.innerText, '3,12M/người');
assert.equal(elements.perCapTrainer.innerText, '6,60M/người');
assert.equal(elements.perCapGroupTrainer.innerText, '3,30M');
assert.equal(elements.pnlRevGymMctNote.innerText, '15 khách x 4,00M');
assert.equal(elements.perCapTrainerDesc.innerText, 'Quỹ 110 ca x 180k, chia cho 3 HLV');
assert.equal(elements.netCard.classList.contains('positive'), true);

setInputs({
  priceGroupX: -2,
  priceGymMct: -4,
  priceGoi12M: -20,
  pricePt: -0.6,
  cntSaleStaff: 0,
  cntTrainerStaff: -3,
  cntGroupX: -20,
  cntGymMct: -15,
  cntGoi12M: -3,
  cntPt: -120,
});

assert.equal(elements.summaryRevenue.innerText, '0,00M');
assert.equal(elements.perCapManager.innerText, '8,00M');
assert.equal(elements.perCapSale.innerText, '0,00M/người');
assert.equal(elements.perCapTrainer.innerText, '19,80M/người');
assert.equal(elements.pnlCostFixed.innerText, '55,00M');
assert.equal(elements.pnlNetProfit.innerText, '-86,10M');
assert.equal(elements.resGymCustomers.innerText, 'Chưa có giá');

console.log(
  '[FINTECH AUDIT] PASS: UX outputs, formulas, exact reverse target, boundaries, fixed-cost cap, net profit, and route parity.'
);

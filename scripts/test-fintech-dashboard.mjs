import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const canonicalPath = 'public/so-tai-chinh-grow.html';
const cleanRoutePath = 'public/so-tai-chinh-grow/index.html';
const html = fs.readFileSync(canonicalPath, 'utf8');
const cleanRouteHtml = fs.readFileSync(cleanRoutePath, 'utf8');

assert.equal(
  crypto.createHash('sha256').update(html).digest('hex'),
  crypto.createHash('sha256').update(cleanRouteHtml).digest('hex'),
  'Canonical and clean-route HTML must be byte-identical'
);

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
  'targetProfitVal',
  'resGymCustomers',
  'resTargetRevenue',
  'resTargetSale',
  'resTargetTrainer',
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

const elements = Object.fromEntries(
  Object.entries(inputDefaults).map(([id, value]) => [id, { id, value, innerText: '', style: {} }])
);
for (const id of outputIds) elements[id] = { id, value: '', innerText: '', style: {} };
elements.chartBars = {
  id: 'chartBars',
  innerHTML: '',
  children: [],
  appendChild(node) {
    this.children.push(node);
  },
};

const document = {
  getElementById(id) {
    assert.ok(elements[id], `Missing DOM stub for #${id}`);
    return elements[id];
  },
  createElement() {
    return { className: '', innerHTML: '', style: {} };
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

assert.equal(elements.perCapManager.innerText, '9.69 Tr/tháng');
assert.equal(elements.perCapSale.innerText, '2.95 Tr/người');
assert.equal(elements.perCapTrainer.innerText, '9.90 Tr/người');
assert.equal(elements.perCapGroupTrainer.innerText, '3.30 Tr/tháng');
assert.equal(elements.pnlCostFixed.innerText, '55.00 Tr');
assert.equal(elements.pnlNetProfit.innerText, '-16.06 Tr');

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

assert.equal(elements.perCapManager.innerText, '11.56 Tr/tháng');
assert.equal(elements.perCapSale.innerText, '3.12 Tr/người');
assert.equal(elements.perCapTrainer.innerText, '6.60 Tr/người');
assert.equal(elements.perCapGroupTrainer.innerText, '3.30 Tr/tháng');
assert.equal(elements.pnlCostFixed.innerText, '55.00 Tr');
assert.equal(elements.pnlNetProfit.innerText, '+61.64 Tr');
assert.equal(elements.pnlRevGymMctNote.innerText, '15 khách × 4.00M');
assert.equal(elements.perCapTrainerDesc.innerText, 'Quỹ 110 ca × 180k, chia cho 3 HLV');

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

assert.equal(elements.perCapManager.innerText, '8.00 Tr/tháng');
assert.equal(elements.perCapSale.innerText, '0.00 Tr/người');
assert.equal(elements.perCapTrainer.innerText, '19.80 Tr/người');
assert.equal(elements.pnlCostFixed.innerText, '55.00 Tr');
assert.equal(elements.pnlNetProfit.innerText, '-86.10 Tr');

console.log('[FINTECH AUDIT] PASS: formulas, input boundaries, fixed-cost cap, net profit, and route parity.');

import crypto from 'node:crypto';
import fs from 'node:fs';

const [, , inputPath, outputPath] = process.argv;
const password = process.env.FINTECH_DASHBOARD_PASSWORD;

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/encrypt-fintech-dashboard.mjs <input.html> <output.html>');
}
if (!password) {
  throw new Error('FINTECH_DASHBOARD_PASSWORD is required.');
}

const plaintext = fs.readFileSync(inputPath);
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
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
  ['encrypt']
);
const ciphertext = Buffer.from(await crypto.webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
const blob = Buffer.concat([salt, iv, ciphertext]).toString('base64');

const wrapper = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Sổ Tài Chính Grow Fitness</title>
  <style>
    :root { color-scheme: dark; --bg:#0d080c; --surface:#191117; --line:#513747; --brand:#ff2e88; --text:#fff8fb; --muted:#c7adb9; --red:#ff7188; }
    * { box-sizing:border-box; }
    html,body { margin:0; min-height:100%; background:var(--bg); color:var(--text); font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
    body { background:radial-gradient(circle at 50% 0,rgba(255,46,136,.16),transparent 38%),var(--bg); }
    #gate { min-height:100vh; display:grid; place-items:center; padding:24px; }
    .box { width:min(100%,390px); padding:30px; border:1px solid var(--line); border-radius:24px; background:rgba(25,17,23,.94); box-shadow:0 24px 80px rgba(0,0,0,.4); }
    .mark { width:48px; height:48px; display:grid; place-items:center; margin-bottom:20px; border-radius:15px; background:linear-gradient(145deg,var(--brand),#a40d50); font-weight:900; box-shadow:0 10px 30px rgba(255,46,136,.3); }
    .eyebrow { margin:0 0 7px; color:#ff8abc; font-size:11px; font-weight:850; letter-spacing:.12em; text-transform:uppercase; }
    h1 { margin:0; font-size:25px; line-height:1.15; letter-spacing:-.03em; }
    p { margin:10px 0 20px; color:var(--muted); font-size:13px; line-height:1.55; }
    label { display:block; margin-bottom:7px; color:var(--muted); font-size:12px; font-weight:750; }
    input { width:100%; border:1px solid var(--line); border-radius:13px; outline:0; padding:14px 15px; background:#0c080b; color:var(--text); font-size:18px; letter-spacing:.18em; }
    input:focus { border-color:var(--brand); box-shadow:0 0 0 3px rgba(255,46,136,.15); }
    button { width:100%; min-height:48px; margin-top:12px; border:0; border-radius:13px; background:var(--brand); color:white; cursor:pointer; font-weight:850; font-size:15px; }
    button:disabled { opacity:.58; cursor:wait; }
    .err { min-height:20px; margin-top:10px; color:var(--red); font-size:12px; text-align:center; }
    .security { display:flex; gap:8px; align-items:flex-start; margin-top:18px; color:#8e7581; font-size:10px; line-height:1.45; }
    #frame { display:none; width:100%; height:100vh; border:0; background:var(--bg); }
  </style>
</head>
<body>
  <div id="gate">
    <main class="box">
      <div class="mark">G</div>
      <p class="eyebrow">Tài liệu nội bộ đã mã hóa</p>
      <h1>Mở Sổ Tài Chính Grow</h1>
      <p>Nhập mật khẩu để giải mã. Không có mật khẩu, mã nguồn trang không chứa số liệu tài chính có thể đọc được.</p>
      <label for="pw">Mật khẩu truy cập</label>
      <input id="pw" type="password" placeholder="••••••" inputmode="numeric" autocomplete="current-password" autofocus />
      <button id="btn" type="button">Giải mã và mở sổ</button>
      <div class="err" id="err" role="alert"></div>
      <div class="security"><span>🔐</span><span>AES-256-GCM · Khóa được suy ra ngay trên thiết bị này và không gửi đi đâu.</span></div>
    </main>
  </div>
  <iframe id="frame" title="Sổ Tài Chính Grow Fitness"></iframe>
  <script>
    const BLOB="${blob}";
    async function unlock() {
      const button = document.getElementById('btn');
      const error = document.getElementById('err');
      button.disabled = true;
      button.textContent = 'Đang giải mã...';
      error.textContent = '';
      try {
        const raw = Uint8Array.from(atob(BLOB), character => character.charCodeAt(0));
        const salt = raw.slice(0, 16);
        const iv = raw.slice(16, 28);
        const ciphertext = raw.slice(28);
        const passwordBytes = new TextEncoder().encode(document.getElementById('pw').value);
        const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey(
          { name:'PBKDF2', salt, iterations:600000, hash:'SHA-256' },
          keyMaterial,
          { name:'AES-GCM', length:256 },
          false,
          ['decrypt']
        );
        const plaintext = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ciphertext);
        const frame = document.getElementById('frame');
        frame.srcdoc = new TextDecoder().decode(plaintext);
        frame.style.display = 'block';
        document.getElementById('gate').style.display = 'none';
      } catch {
        error.textContent = 'Mật khẩu chưa đúng. Anh thử lại nhé.';
        button.disabled = false;
        button.textContent = 'Giải mã và mở sổ';
      }
    }
    document.getElementById('btn').addEventListener('click', unlock);
    document.getElementById('pw').addEventListener('keydown', event => {
      if (event.key === 'Enter') unlock();
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, wrapper);
console.log(`[FINTECH ENCRYPT] Wrote encrypted dashboard to ${outputPath}`);

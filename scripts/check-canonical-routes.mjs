import fs from 'fs';
import path from 'path';

const routesPath = path.resolve('routes.json');
const publicDir = path.resolve('public');

if (!fs.existsSync(routesPath)) {
  console.error('[ROUTE CANONICAL GUARD] ❌ Missing routes.json registry!');
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
const allowedFiles = new Set(registry.canonical_routes.map(r => path.basename(r.file)));

if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  const unregistered = [];
  for (const file of files) {
    if (file.endsWith('.html') && !file.startsWith('_')) {
      if (file === 'index.html' || file === '404.html') continue;
      if (!allowedFiles.has(file)) {
        unregistered.push(file);
      }
    }
  }
  if (unregistered.length > 0) {
    console.error(`[ROUTE CANONICAL GUARD] ❌ REJECT BUILD! Found ${unregistered.length} unregistered/legacy route files:`, unregistered);
    console.error('All routes MUST be registered in routes.json or redirected via vercel.json. Unauthorized route files are forbidden!');
    process.exit(1);
  }
}

console.log('[ROUTE CANONICAL GUARD] ✅ All static routes match Canonical Route Registry routes.json.');

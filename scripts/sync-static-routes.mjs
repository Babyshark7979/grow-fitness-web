import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  let count = 0;
  for (const file of files) {
    const fullPath = path.join(publicDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && file.endsWith('.html') && !file.startsWith('_')) {
      const name = path.basename(file, '.html');
      if (name === 'index' || name === '404') continue;

      const htmlContent = fs.readFileSync(fullPath, 'utf-8');
      const targetSubdir = path.join(publicDir, name);
      if (!fs.existsSync(targetSubdir)) {
        fs.mkdirSync(targetSubdir, { recursive: true });
      }
      fs.writeFileSync(path.join(targetSubdir, 'index.html'), htmlContent, 'utf-8');
      count++;
      console.log(`[ROUTE SYNC GUARD] ✅ Synchronized clean route: /${name} -> public/${name}/index.html`);
    }
  }
  console.log(`[ROUTE SYNC GUARD] Total ${count} static HTML routes synchronized.`);
}

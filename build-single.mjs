import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');

const out = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="game.js"></script>', `<script>\n${js}\n</script>`);

if (out.includes('href="styles.css"') || out.includes('src="game.js"')) {
  throw new Error('单文件内联失败：请检查 index.html 中的 styles.css / game.js 引用是否被改动');
}

const dist = path.join(ROOT, 'dist');
fs.mkdirSync(dist, { recursive: true });
const target = path.join(dist, 'curling-gates.html');
fs.writeFileSync(target, out, 'utf8');

console.log(`已生成单文件试玩版: ${target}`);
console.log(`大小: ${(Buffer.byteLength(out) / 1024).toFixed(1)} KB`);

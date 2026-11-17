import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, 'hostinger-deploy');

if (!fs.existsSync(distDir)) {
  console.error('Erro: pasta dist/ não encontrada. Execute "npm run build" primeiro.');
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(distDir, outDir, { recursive: true });

const files = fs.readdirSync(outDir);
console.log(`hostinger-deploy/ gerado com sucesso (${files.length} entradas na raiz):`);
for (const entry of files) {
  console.log(` - ${entry}`);
}

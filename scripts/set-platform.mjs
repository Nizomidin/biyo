import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '../public/config.json');

const platform = process.argv[2] || 'web';

if (!['web', 'desktop'].includes(platform)) {
  console.error('Usage: node set-platform.mjs [web|desktop]');
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
config.platform = platform;
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

console.log(`Platform set to: ${platform}`);

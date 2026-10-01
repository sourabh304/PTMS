#!/usr/bin/env node
/**
 * Creates local environment files from the committed examples.
 * Any value equal to `__GENERATE_SECRET__` is replaced with a cryptographically
 * random secret, so no credentials ever need to live in source control.
 * Existing env files are never overwritten.
 */
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SECRET_TOKEN = '__GENERATE_SECRET__';

const targets = [
  { example: 'apps/api/.env.example', target: 'apps/api/.env' },
  { example: 'apps/web/.env.example', target: 'apps/web/.env.local' },
];

for (const { example, target } of targets) {
  const examplePath = resolve(root, example);
  const targetPath = resolve(root, target);

  if (existsSync(targetPath)) {
    console.log(`✔ ${target} already exists, skipping`);
    continue;
  }
  if (!existsSync(examplePath)) {
    console.warn(`⚠ ${example} not found, skipping`);
    continue;
  }

  copyFileSync(examplePath, targetPath);
  const content = readFileSync(targetPath, 'utf8').replaceAll(SECRET_TOKEN, () =>
    randomBytes(48).toString('hex'),
  );
  writeFileSync(targetPath, content);
  console.log(`✔ created ${target}`);
}

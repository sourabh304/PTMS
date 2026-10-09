#!/usr/bin/env node
/**
 * Creates local environment files from the committed examples.
 * Any value equal to `__GENERATE_SECRET__` is replaced with a cryptographically
 * random secret, so no credentials ever need to live in source control.
 * Existing env files are never overwritten; variables added to an example later are
 * appended to them so upgrades keep working.
 */
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SECRET_TOKEN = '__GENERATE_SECRET__';
const KEY = /^\s*([A-Z0-9_]+)\s*=/;

const withSecrets = (text) => text.replaceAll(SECRET_TOKEN, () => randomBytes(48).toString('hex'));
const keysOf = (text) => new Set(text.split(/\r?\n/).map((line) => line.match(KEY)?.[1]).filter(Boolean));

const targets = [
  { example: 'apps/api/.env.example', target: 'apps/api/.env' },
  { example: 'apps/web/.env.example', target: 'apps/web/.env.local' },
];

for (const { example, target } of targets) {
  const examplePath = resolve(root, example);
  const targetPath = resolve(root, target);

  if (!existsSync(examplePath)) {
    console.warn(`⚠ ${example} not found, skipping`);
    continue;
  }

  if (existsSync(targetPath)) {
    const current = readFileSync(targetPath, 'utf8');
    const present = keysOf(current);
    const missing = readFileSync(examplePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => {
        const key = line.match(KEY)?.[1];
        return key && !present.has(key);
      });
    if (!missing.length) {
      console.log(`✔ ${target} already exists, skipping`);
      continue;
    }
    const separator = current.endsWith('\n') ? '' : '\n';
    writeFileSync(targetPath, `${current}${separator}${withSecrets(missing.join('\n'))}\n`);
    console.log(`✔ ${target}: added ${missing.map((line) => line.match(KEY)[1]).join(', ')}`);
    continue;
  }

  copyFileSync(examplePath, targetPath);
  writeFileSync(targetPath, withSecrets(readFileSync(targetPath, 'utf8')));
  console.log(`✔ created ${target}`);
}

#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parseToonUI, validateToonUI } from '@toon-ui/core';

const [, , command, file] = process.argv;

if (!command) {
  console.log('toon-ui <validate|inspect> <file>');
  process.exit(0);
}

if (!file) {
  console.error('A file path is required.');
  process.exit(1);
}

const source = readFileSync(file, 'utf8');
const ast = parseToonUI(source);

if (command === 'inspect') {
  console.log(JSON.stringify(ast, null, 2));
  process.exit(0);
}

if (command === 'validate') {
  const result = validateToonUI(ast);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

console.error(`Unsupported command: ${command}`);
process.exit(1);

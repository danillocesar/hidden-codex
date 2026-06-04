#!/usr/bin/env node
/**
 * PostToolUse hook — auto-format edited files with Prettier.
 *
 * Reads the tool-call JSON from stdin, extracts the edited file path, and runs
 * `prettier --write` on it when the extension is supported. This keeps Tailwind
 * class ordering (prettier-plugin-tailwindcss) and import/format conventions
 * consistent on every Edit/Write, matching the pre-commit gate in CLAUDE.md.
 *
 * Always exits 0 — formatting is best-effort and must never block the agent.
 */
import { spawnSync } from 'node:child_process';
import { extname } from 'node:path';

const SUPPORTED = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md', '.json', '.css']);

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    // If nothing is piped, don't hang.
    if (process.stdin.isTTY) resolve('');
  });
}

const raw = await readStdin();
let payload;
try {
  payload = JSON.parse(raw || '{}');
} catch {
  process.exit(0);
}

const input = payload.tool_input ?? {};
// Edit/Write expose file_path; MultiEdit/others may use different keys.
const paths = [input.file_path, input.path].filter(Boolean);
if (paths.length === 0) process.exit(0);

const targets = paths.filter((p) => SUPPORTED.has(extname(p).toLowerCase()));
if (targets.length === 0) process.exit(0);

// `pnpm exec prettier` resolves the local prettier + tailwind plugin.
const isWin = process.platform === 'win32';
const result = spawnSync('pnpm', ['exec', 'prettier', '--write', '--log-level', 'warn', ...targets], {
  stdio: ['ignore', 'inherit', 'inherit'],
  shell: isWin, // needed so Windows finds the pnpm.cmd shim
});

// Never fail the hook on formatter issues.
void result;
process.exit(0);

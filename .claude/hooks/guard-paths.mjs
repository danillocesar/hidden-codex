#!/usr/bin/env node
/**
 * PreToolUse hook — block edits to protected paths.
 *
 * CLAUDE.md lists areas that must not change without human approval:
 *   - prisma/migrations/  (applied migrations are immutable)
 *   - .env / .env.local   (real credentials)
 *   - reference/satsuki-ficha-reference.html  (frozen visual source of truth)
 *   - books/              (copyright PDFs, read-only)
 *
 * Reads the tool-call JSON from stdin; if the target path matches a protected
 * pattern, prints a reason to stderr and exits 2 — which tells Claude Code to
 * DENY the tool call and surface the reason. Any other path exits 0 (allow).
 */
import { readFileSync } from 'node:fs';

const PROTECTED = [
  { re: /prisma[\\/]migrations[\\/]/i, why: 'Applied migrations are immutable — generate a NEW migration instead.' },
  { re: /(^|[\\/])\.env(\.|$)/i, why: 'Env files hold real credentials — edit them manually outside the agent.' },
  { re: /satsuki-ficha-reference\.html$/i, why: 'This is the frozen visual source of truth — do not modify.' },
  { re: /(^|[\\/])books[\\/]/i, why: 'books/ holds copyright PDFs — read-only, never modify.' },
];

let raw = '';
try {
  raw = readFileSync(0, 'utf8');
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw || '{}');
} catch {
  process.exit(0);
}

const input = payload.tool_input ?? {};
const path = input.file_path ?? input.path ?? '';
if (!path) process.exit(0);

const hit = PROTECTED.find((p) => p.re.test(path));
if (hit) {
  process.stderr.write(`Blocked edit to protected path: ${path}\n${hit.why}\n`);
  process.exit(2); // deny + feed stderr back to Claude
}

process.exit(0);

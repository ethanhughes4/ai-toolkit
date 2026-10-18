#!/usr/bin/env node
// check-rules.mjs — mechanical project checks. No AI, no judgement: patterns only.
//
// Usage:
//   node scripts/check-rules.mjs                 check the whole project (tests vs HEAD)
//   node scripts/check-rules.mjs --base main     compare test files against another ref
//   node scripts/check-rules.mjs --files a b c   check only these files (used by hooks)
//   node scripts/check-rules.mjs --json          machine-readable output
//
// Exit code: 1 if any FAIL, otherwise 0.
//
// To allow a specific line on purpose, put this on the same line or the line above:
//   /* check-rules-ignore: <reason> */     (or // check-rules-ignore: <reason>)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, resolve, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'build', 'coverage', '.git', '.screenshots',
  '.claude', 'reviews', 'specs', 'design', 'notes',
]);
const STYLE_EXT = new Set(['.css', '.scss']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const DATA_EXT = new Set(['.json', '.env', '.yml', '.yaml']);
const TEST_RE = /(\.test\.|\.spec\.|[\\/]__tests__[\\/])/;
const IGNORE_MARK = 'check-rules-ignore';
const SELF = 'scripts/check-rules.mjs';

const COLOUR_PROPS = new Set([
  'color', 'background', 'background-color', 'border', 'border-color',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline', 'outline-color', 'fill', 'stroke', 'box-shadow', 'text-shadow',
  'text-decoration-color', 'caret-color', 'accent-color', 'column-rule-color',
]);
const NAMED_COLOURS = /\b(white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|silver|navy|teal|maroon)\b/i;
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i;

export function isTestFile(path) {
  return TEST_RE.test(path.replace(/\\/g, '/'));
}

function hasIgnoreMark(lines, lineNo) {
  // lineNo is 1-based
  const here = lines[lineNo - 1] || '';
  const above = lines[lineNo - 2] || '';
  return here.includes(IGNORE_MARK) || above.includes(IGNORE_MARK);
}

// ---- CSS: a tiny parser that records each declaration with its selectors ----
function parseCss(text) {
  const decls = [];
  const stack = [];
  let buf = '';
  let bufLine = 0;
  let line = 1;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      for (let j = i; j < stop; j++) if (text[j] === '\n') line++;
      i = stop;
      continue;
    }
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === ';' || ch === '}') {
      const d = buf.trim();
      if (d && d.includes(':') && stack.length) {
        decls.push({ text: d, line: bufLine, selectors: [...stack] });
      }
      buf = '';
      if (ch === '}') stack.pop();
    } else {
      if (!buf.trim() && ch.trim()) bufLine = line;
      buf += ch;
    }
    if (ch === '\n') line++;
    i++;
  }
  return decls;
}

function checkStyle(file, text, out) {
  const lines = text.split(/\r?\n/);
  for (const d of parseCss(text)) {
    if (hasIgnoreMark(lines, d.line)) continue;
    const colon = d.text.indexOf(':');
    const prop = d.text.slice(0, colon).trim().toLowerCase();
    const value = d.text.slice(colon + 1).trim();
    if (prop.startsWith('--')) continue; // token definition — raw values allowed here
    if (prop.startsWith('$') || prop.startsWith('@')) continue;

    const where = { file, line: d.line };

    if (RAW_COLOUR.test(value) || (COLOUR_PROPS.has(prop) && NAMED_COLOURS.test(value))) {
      out.push({ level: 'FAIL', rule: 'raw-colour', ...where,
        msg: `${prop}: ${value} — use a colour token (var(--...)) instead of a raw value` });
    }

    if ((prop === 'font-size' || prop === 'font') && /\d(\.\d+)?(px|rem|em|pt)\b/.test(value)) {
      out.push({ level: 'FAIL', rule: 'raw-font-size', ...where,
        msg: `${prop}: ${value} — use a type-scale token instead of a raw size` });
    }

    const removesOutline =
      (prop === 'outline' && /^(none|0(px)?)\b/i.test(value)) ||
      (prop === 'outline-width' && /^0(px)?\b/.test(value)) ||
      (prop === 'outline-style' && /^none\b/i.test(value));
    const isAcceptedPattern = d.selectors.some((s) => s.includes(':not(:focus-visible)'));
    if (removesOutline && !isAcceptedPattern) {
      out.push({ level: 'FAIL', rule: 'focus-removed', ...where,
        msg: `${prop}: ${value} on "${d.selectors.at(-1)}" — this can hide the focus ring. ` +
             `Remove it, or if another visible focus style replaces it, mark the line with ${IGNORE_MARK}: <reason>` });
    }
  }
}

// ---- Code files ----
const SKIP_RE = /\b(?:it|test|describe)\.(?:skip|only|todo)\s*\(|\b(?:xit|xtest|xdescribe|fit|fdescribe)\s*\(/;
const SECRET_RES = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /(?:api[_-]?key|secret|password|passwd|token)["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i,
];

function checkCode(file, text, out) {
  const lines = text.split(/\r?\n/);
  const test = isTestFile(file);
  lines.forEach((ln, idx) => {
    const lineNo = idx + 1;
    if (hasIgnoreMark(lines, lineNo)) return;
    const where = { file, line: lineNo };

    if (test && SKIP_RE.test(ln)) {
      out.push({ level: 'FAIL', rule: 'skipped-test', ...where,
        msg: 'skipped, focused or todo test — every test must run' });
    }
    if (!test && /["'`]#[0-9a-f]{3,8}["'`]/i.test(ln)) {
      out.push({ level: 'WARN', rule: 'raw-colour-in-code', ...where,
        msg: 'raw colour in code — use a CSS token' });
    }
    if (!test && /dangerouslySetInnerHTML|\.innerHTML\s*=|\binsertAdjacentHTML\(/.test(ln)) {
      out.push({ level: 'WARN', rule: 'unsafe-html', ...where,
        msg: 'raw HTML injection — needs a security review' });
    }
    if (!test && /\beval\s*\(|\bnew Function\s*\(/.test(ln)) {
      out.push({ level: 'FAIL', rule: 'eval', ...where, msg: 'eval / new Function — not allowed' });
    }
  });
  checkSecrets(file, lines, out);
}

function checkSecrets(file, lines, out) {
  lines.forEach((ln, idx) => {
    if (hasIgnoreMark(lines, idx + 1)) return;
    if (SECRET_RES.some((re) => re.test(ln))) {
      out.push({ level: 'FAIL', rule: 'secret', file, line: idx + 1,
        msg: 'looks like a hard-coded secret — move it out of the code' });
    }
  });
}

// ---- Tests vs git: deleted or weakened ----
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

// Strong matchers check a specific value or shape; weak ones only check "something is there".
const STRONG_RE = /\.(?:toEqual|toStrictEqual|toMatchObject|toHaveBeenCalledWith|toHaveBeenNthCalledWith|toHaveBeenLastCalledWith|toHaveLength|toContain|toContainEqual|toHaveTextContent|toHaveValue|toHaveAttribute|toMatchSnapshot|toMatchInlineSnapshot)\s*\(|\.toThrow\w*\(\s*[^)\s]/g;
const WEAK_RE = /\.(?:toBeTruthy|toBeFalsy|toBeDefined)\s*\(|\.not\.(?:toBeNull|toBeUndefined)\s*\(/g;

function countTests(text) {
  return {
    asserts: (text.match(/\bexpect\s*\(/g) || []).length +
             (text.match(/\bassert(?:\.\w+)?\s*\(/g) || []).length,
    cases: (text.match(/\b(?:it|test)\s*\(/g) || []).length,
    strong: (text.match(STRONG_RE) || []).length,
    weak: (text.match(WEAK_RE) || []).length,
  };
}

function checkTestChanges(root, base, onlyFiles, out) {
  let diff;
  try {
    git(['rev-parse', '--is-inside-work-tree'], root);
    diff = git(['diff', '--name-status', base, '--'], root);
  } catch {
    out.push({ level: 'WARN', rule: 'no-git', file: '-', line: 0,
      msg: `could not compare tests against "${base}" (not a git repo, or unknown ref)` });
    return;
  }
  for (const row of diff.split('\n').filter(Boolean)) {
    const parts = row.split('\t');
    const status = parts[0][0];
    const oldPath = parts[1];
    const newPath = parts[2] || parts[1];
    if (!isTestFile(oldPath)) continue;
    if (onlyFiles && !onlyFiles.has(newPath) && !onlyFiles.has(oldPath)) continue;

    if (status === 'D') {
      out.push({ level: 'FAIL', rule: 'test-deleted', file: oldPath, line: 0,
        msg: `existing test file deleted (vs ${base})` });
      continue;
    }
    if (status !== 'M' && status !== 'R') continue;

    let before = '';
    try { before = git(['show', `${base}:${oldPath}`], root); } catch { continue; }
    const afterPath = join(root, newPath);
    if (!existsSync(afterPath)) continue;
    const after = readFileSync(afterPath, 'utf8');
    const b = countTests(before);
    const a = countTests(after);

    // A file-level mark downgrades weakening to a warning (e.g. the spec really changed).
    const marked = after.includes(`${IGNORE_MARK}: test-change`);
    const level = marked ? 'WARN' : 'FAIL';

    if (a.asserts < b.asserts || a.cases < b.cases) {
      out.push({ level, rule: 'test-weakened', file: newPath, line: 0,
        msg: `fewer checks than ${base}: assertions ${b.asserts} → ${a.asserts}, tests ${b.cases} → ${a.cases}` });
    } else if (a.strong < b.strong || a.weak > b.weak) {
      out.push({ level, rule: 'test-loosened', file: newPath, line: 0,
        msg: `assertions got looser than ${base}: exact-value matchers ${b.strong} → ${a.strong}, ` +
             `"is something there" matchers ${b.weak} → ${a.weak}. If the spec really changed, add ` +
             `"// ${IGNORE_MARK}: test-change <reason>" to the file` });
    } else {
      out.push({ level: 'WARN', rule: 'test-changed', file: newPath, line: 0,
        msg: `existing test changed (vs ${base}) — check the change is justified by the spec, ` +
             `and that no assertion became looser (e.g. toEqual → toBeTruthy, whole object → one field)` });
    }
  }
}

// ---- Walking the project ----
function walk(dir, root, files = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, root, files);
    else files.push(relative(root, full).replace(/\\/g, '/'));
  }
  return files;
}

export function checkFile(root, rel, out) {
  const full = join(root, rel);
  if (!existsSync(full)) return;
  const ext = extname(rel).toLowerCase();
  const base = rel.split('/').pop();
  if (rel === SELF || base === 'package-lock.json') return;
  const text = readFileSync(full, 'utf8');
  if (STYLE_EXT.has(ext)) checkStyle(rel, text, out);
  else if (CODE_EXT.has(ext)) checkCode(rel, text, out);
  else if (DATA_EXT.has(ext) || base.startsWith('.env')) checkSecrets(rel, text.split(/\r?\n/), out);
}

export function runChecks({ root = process.cwd(), base = 'HEAD', files = null } = {}) {
  const out = [];
  const list = files
    ? files.map((f) => (isAbsolute(f) ? relative(root, f) : f).replace(/\\/g, '/'))
    : walk(root, root);
  for (const rel of list) checkFile(root, rel, out);
  checkTestChanges(root, base, files ? new Set(list) : null, out);
  return out;
}

export function format(results) {
  if (!results.length) return 'check-rules: all clear';
  const order = { FAIL: 0, WARN: 1 };
  const sorted = [...results].sort((a, b) => order[a.level] - order[b.level]);
  const lines = sorted.map((r) => `${r.level}  [${r.rule}] ${r.file}${r.line ? ':' + r.line : ''} — ${r.msg}`);
  const fails = results.filter((r) => r.level === 'FAIL').length;
  const warns = results.length - fails;
  lines.push(`check-rules: ${fails} FAIL, ${warns} WARN`);
  return lines.join('\n');
}

// ---- CLI ----
const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(`--${name}`);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const filesIdx = args.indexOf('--files');
  const files = filesIdx !== -1
    ? args.slice(filesIdx + 1).filter((a) => !a.startsWith('--'))
    : null;
  const results = runChecks({ base: opt('base') || 'HEAD', files });
  if (args.includes('--json')) console.log(JSON.stringify(results, null, 2));
  else console.log(format(results));
  process.exit(results.some((r) => r.level === 'FAIL') ? 1 : 0);
}
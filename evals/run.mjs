#!/usr/bin/env node
// evals/run.mjs — runs the toolkit's eval cases with headless Claude Code.
//
// Each case: a fresh throwaway workspace → (optional setup prompt, committed) →
// the case prompt via `claude -p` → graders check the reply and the files.
//
// Usage (from the ai-toolkit folder, after running `install`):
//   node evals/run.mjs                    run every case once
//   node evals/run.mjs --case reviewer    only cases whose name contains "reviewer"
//   node evals/run.mjs --runs 3           run each case 3 times
//   node evals/run.mjs --dry              set up workspaces only, no Claude calls
//   node evals/run.mjs --list             list the cases
//
// Every real run costs usage. Each case has a budget cap (budgetUsd).
// Graders see only files the run created or changed (add "anyFile": true to see all).

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, cpSync, mkdtempSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(HERE, 'config.json'), 'utf8'));
const IS_WIN = process.platform === 'win32';

// ---------- CLI ----------
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i !== -1 ? args[i + 1] : undefined; };
const has = (n) => args.includes(`--${n}`);
const RUNS = Number(opt('runs') || 1);
const FILTER = opt('case');
const DRY = has('dry');

// ---------- helpers ----------
function sh(cmd, cmdArgs, cwd, input) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd, input, encoding: 'utf8', shell: IS_WIN, maxBuffer: 64 * 1024 * 1024,
    timeout: (CONFIG.timeoutMinutes || 45) * 60 * 1000,
  });
  return { code: r.status, out: r.stdout || '', err: r.stderr || (r.error ? String(r.error) : '') };
}

function git(cwdir, ...a) {
  return sh('git', ['-c', 'user.name=eval', '-c', 'user.email=eval@local', ...a], cwdir);
}

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, root, out);
    else out.push(relative(root, full).replace(/\\/g, '/'));
  }
  return out;
}

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

// Graders only see files created or changed by the run (set before the prompt).
let BEFORE = null;
function snapshot(ws) {
  const m = new Map();
  for (const f of walk(ws)) m.set(f, createHash('sha1').update(readFileSync(join(ws, f))).digest('hex'));
  return m;
}
function changedFiles(ws) {
  return walk(ws).filter((f) => !BEFORE || BEFORE.get(f) !== createHash('sha1').update(readFileSync(join(ws, f))).digest('hex'));
}
function filesMatching(ws, glob, anyFile = false) {
  const re = globToRegex(glob);
  return (anyFile ? walk(ws) : changedFiles(ws)).filter((f) => re.test(f));
}

// The text a grader looks at: "reply" or "file:<glob>"
function targetText(ws, reply, target = 'reply', anyFile = false) {
  if (target === 'reply') return { text: reply, label: 'reply' };
  if (target.startsWith('file:')) {
    const files = filesMatching(ws, target.slice(5), anyFile);
    if (!files.length) return { text: null, label: target };
    return { text: files.map((f) => readFileSync(join(ws, f), 'utf8')).join('\n\n'), label: files.join(', ') };
  }
  throw new Error(`unknown target "${target}"`);
}

function claude(prompt, cwd, { maxTurns, budgetUsd, model, judge = false } = {}) {
  const flags = ['-p', '--output-format', 'json'];
  if (judge) {
    flags.push('--max-turns', '1', '--permission-mode', 'dontAsk');
    if (CONFIG.judgeModel) flags.push('--model', CONFIG.judgeModel);
  } else {
    flags.push('--max-turns', String(maxTurns || 60));
    flags.push('--permission-mode', 'acceptEdits');
    flags.push('--allowedTools', CONFIG.allowedTools);
    if (budgetUsd) flags.push('--max-budget-usd', String(budgetUsd));
    if (model) flags.push('--model', model);
    flags.push(...(CONFIG.extraArgs || []));
  }
  const started = Date.now();
  const r = sh(CONFIG.claudeCommand || 'claude', flags, cwd, prompt);
  let parsed = null;
  try { parsed = JSON.parse(r.out); } catch { /* not JSON */ }
  return {
    ok: r.code === 0 && parsed && !parsed.is_error,
    reply: parsed?.result ?? r.out,
    cost: parsed?.total_cost_usd ?? 0,
    seconds: Math.round((Date.now() - started) / 1000),
    error: r.code !== 0 || !parsed ? (r.err || r.out).slice(0, 500) : (parsed.is_error ? String(parsed.result).slice(0, 500) : ''),
  };
}

// ---------- graders ----------
function runGrader(g, ws, reply) {
  const label = g.label || g.type;
  try {
    switch (g.type) {
      case 'file_exists': {
        const f = filesMatching(ws, g.path, g.anyFile);
        return { label, pass: f.length > 0, why: f.length ? `found ${f.join(', ')}` : `no file matches ${g.path}` };
      }
      case 'file_absent': {
        const f = filesMatching(ws, g.path, g.anyFile);
        return { label, pass: f.length === 0, why: f.length ? `unexpected ${f.join(', ')}` : `none match ${g.path}` };
      }
      case 'regex': {
        const { text, label: what } = targetText(ws, reply, g.target, g.anyFile);
        if (text == null) return { label, pass: false, why: `nothing to check (${what})` };
        const found = new RegExp(g.pattern, g.flags || '').test(text);
        const pass = g.absent ? !found : found;
        return { label, pass, why: `${g.absent ? 'must not match' : 'must match'} /${g.pattern}/ in ${what}: ${found ? 'matched' : 'no match'}` };
      }
      case 'count': {
        const { text, label: what } = targetText(ws, reply, g.target, g.anyFile);
        if (text == null) return { label, pass: false, why: `nothing to check (${what})` };
        const flags = (g.flags || '').includes('g') ? g.flags : (g.flags || '') + 'g';
        const n = (text.match(new RegExp(g.pattern, flags)) || []).length;
        const pass = n >= (g.min ?? 0) && n <= (g.max ?? Infinity);
        return { label, pass, why: `count ${n} (allowed ${g.min ?? 0}–${g.max ?? '∞'}) in ${what}` };
      }
      case 'judge': {
        const { text, label: what } = targetText(ws, reply, g.target, g.anyFile);
        if (text == null) return { label, pass: false, why: `nothing to judge (${what})` };
        if (DRY) return { label, pass: true, why: 'dry run — judge skipped' };
        const prompt =
          `You are grading the output of an AI tool. Apply this rubric strictly.\n\n` +
          `RUBRIC:\n${g.rubric}\n\n` +
          `Reply with exactly PASS or FAIL on the first line, then one sentence saying why.\n\n` +
          `OUTPUT TO GRADE (${what}):\n----\n${text.slice(0, 60000)}\n----`;
        const judgeDir = mkdtempSync(join(tmpdir(), 'ai-toolkit-judge-'));
        const r = claude(prompt, judgeDir, { judge: true });
        const first = String(r.reply).trim().split('\n')[0].toUpperCase();
        const pass = first.startsWith('PASS');
        return { label, pass, why: String(r.reply).trim().split('\n').slice(0, 2).join(' ').slice(0, 300), cost: r.cost };
      }
      default:
        return { label, pass: false, why: `unknown grader type "${g.type}"` };
    }
  } catch (e) {
    return { label, pass: false, why: `grader error: ${e.message}` };
  }
}

// ---------- workspaces ----------
function makeWorkspace(c, runDir) {
  const ws = join(runDir, 'ws');
  const fx = c.fixture || 'minimal';
  if (typeof fx === 'string') {
    const src = join(HERE, 'fixtures', fx);
    if (!existsSync(src)) throw new Error(`fixture "${fx}" not found in evals/fixtures`);
    cpSync(src, ws, { recursive: true });
    git(ws, 'init', '-q');
    git(ws, 'add', '-A');
    git(ws, 'commit', '-qm', 'fixture');
  } else {
    const repo = CONFIG.repos?.[fx.repo] || fx.repo;
    if (!repo || !existsSync(repo)) throw new Error(`repo "${fx.repo}" not found — set it in evals/config.json`);
    const cl = sh('git', ['clone', '--quiet', repo, ws], runDir);
    if (cl.code !== 0) throw new Error(`git clone failed: ${cl.err}`);
    if (fx.ref) git(ws, 'checkout', '-q', fx.ref);
    if (fx.install) {
      const lock = existsSync(join(ws, 'package-lock.json'));
      const r = sh('npm', [lock ? 'ci' : 'install', '--no-audit', '--no-fund', '--prefer-offline'], ws);
      if (r.code !== 0) throw new Error(`npm install failed: ${r.err.slice(0, 300)}`);
    }
  }
  return ws;
}

function headSha(ws) {
  return git(ws, 'rev-parse', '--short', 'HEAD').out.trim();
}

// ---------- versions under test ----------
function installedVersions() {
  const base = join(homedir(), '.claude');
  const out = [];
  for (const [dir, file] of [['skills', 'SKILL.md'], ['agents', null]]) {
    const root = join(base, dir);
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      const p = file ? join(root, name, file) : join(root, name);
      if (!existsSync(p) || statSync(p).isDirectory()) continue;
      const m = readFileSync(p, 'utf8').match(/<!--\s*([\w-]+)\s+(v[\d.]+)\s*-->/);
      if (m) out.push(`${m[1]} ${m[2]}`);
    }
  }
  return out.sort();
}

// ---------- main ----------
const casesDir = join(HERE, 'cases');
const cases = readdirSync(casesDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ file: f, ...JSON.parse(readFileSync(join(casesDir, f), 'utf8')) }))
  .filter((c) => !FILTER || c.name.includes(FILTER));

if (has('list')) {
  for (const c of cases) console.log(`${c.name.padEnd(28)} ${c.about || ''}`);
  process.exit(0);
}
if (!cases.length) { console.error('No cases match.'); process.exit(1); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const resultsDir = join(HERE, 'results', stamp);
const workRoot = join(tmpdir(), 'ai-toolkit-evals', stamp);
mkdirSync(resultsDir, { recursive: true });
mkdirSync(workRoot, { recursive: true });

const versions = installedVersions();
console.log(`Testing installed toolkit: ${versions.join(' · ') || '(no versions found — did you run install?)'}`);
console.log(`Workspaces: ${workRoot}\n`);

const results = [];
for (const c of cases) {
  const runs = [];
  for (let n = 1; n <= RUNS; n++) {
    const runDir = join(workRoot, `${c.name}-${n}`);
    mkdirSync(runDir, { recursive: true });
    const run = { n, cost: 0, seconds: 0, graders: [], error: '' };
    try {
      const ws = makeWorkspace(c, runDir);
      run.workspace = ws;
      const vars = { base: headSha(ws) };

      if (c.setup) {
        if (DRY) run.notes = 'dry: setup skipped';
        else {
          const s = claude(c.setup, ws, { maxTurns: 30, budgetUsd: c.setupBudgetUsd || 1 });
          run.cost += s.cost;
          if (!s.ok) throw new Error(`setup failed: ${s.error}`);
          git(ws, 'add', '-A');
          git(ws, 'commit', '-qm', 'wip');
        }
      }

      BEFORE = snapshot(ws);
      const prompt = c.prompt.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
      let reply = '';
      if (!DRY) {
        const r = claude(prompt, ws, { maxTurns: c.maxTurns, budgetUsd: c.budgetUsd, model: c.model });
        run.cost += r.cost; run.seconds = r.seconds; reply = r.reply;
        if (!r.ok) run.error = r.error;
      }
      writeFileSync(join(runDir, 'reply.md'), reply || '(dry run)');

      for (const g of c.graders) {
        const gr = runGrader(g, ws, reply);
        run.cost += gr.cost || 0;
        run.graders.push(gr);
      }
    } catch (e) {
      run.error = e.message;
    }
    run.pass = !run.error && run.graders.length > 0 && run.graders.every((g) => g.pass);
    runs.push(run);

    const mark = run.pass ? 'PASS' : 'FAIL';
    console.log(`${mark}  ${c.name} #${n}  $${run.cost.toFixed(2)}  ${run.seconds}s`);
    for (const g of run.graders) console.log(`      ${g.pass ? '✔' : '✘'} ${g.label} — ${g.why}`);
    if (run.error) console.log(`      ! ${run.error}`);
  }
  const passed = runs.filter((r) => r.pass).length;
  results.push({ name: c.name, about: c.about, passed, runs: runs.length, cost: runs.reduce((s, r) => s + r.cost, 0), detail: runs });
}

// ---------- report ----------
const total = results.reduce((s, r) => s + r.cost, 0);
const lines = [
  `# Eval run ${stamp}`,
  '',
  `Toolkit: ${versions.join(' · ')}`,
  '',
  '| Case | Passed | Cost | About |',
  '|---|---|---|---|',
  ...results.map((r) => `| ${r.name} | ${r.passed}/${r.runs} | $${r.cost.toFixed(2)} | ${r.about || ''} |`),
  '',
  `Total cost: $${total.toFixed(2)}`,
  '',
  '## Details',
];
for (const r of results) {
  for (const run of r.detail) {
    lines.push('', `### ${r.name} #${run.n} — ${run.pass ? 'PASS' : 'FAIL'}`);
    if (run.workspace) lines.push(`Workspace: \`${run.workspace}\``);
    if (run.error) lines.push(`Error: ${run.error}`);
    for (const g of run.graders) lines.push(`- ${g.pass ? '✔' : '✘'} **${g.label}** — ${g.why}`);
  }
}
writeFileSync(join(resultsDir, 'summary.md'), lines.join('\n'));
writeFileSync(join(resultsDir, 'results.json'), JSON.stringify({ stamp, versions, results }, null, 2));

console.log(`\n${results.map((r) => `${r.name}: ${r.passed}/${r.runs}`).join(' · ')}`);
console.log(`Total cost: $${total.toFixed(2)}`);
console.log(`Report: ${join(resultsDir, 'summary.md')}`);
process.exit(results.every((r) => r.passed === r.runs) ? 0 : 1);
import { execSync, execFileSync } from 'node:child_process';

const STDIO = { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] };

function run(cmd) {
  try {
    return execSync(cmd, STDIO).trim();
  } catch {
    return '';
  }
}

function runArgs(args) {
  try {
    return execFileSync(args[0], args.slice(1), STDIO).trim();
  } catch {
    return '';
  }
}

export function isGitRepo() {
  return run('git rev-parse --is-inside-work-tree') === 'true';
}

export function getRepoName() {
  const remote = run('git remote get-url origin');
  if (remote) {
    const match = remote.match(/\/([^/]+?)(\.git)?$/);
    if (match) return match[1];
  }
  const toplevel = run('git rev-parse --show-toplevel');
  return toplevel.split('/').pop() || 'unknown';
}

export function getCurrentUser() {
  return run('git config user.name') || 'Unknown';
}

export function getCommits({ author, since, until } = {}) {
  const args = ['git', 'log', '--no-merges', '--format=%H|%an|%ae|%aI|%s'];
  if (author) args.push(`--author=${author}`);
  if (since) args.push(`--since=${since}`);
  if (until) args.push(`--until=${until}`);
  const raw = runArgs(args);
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const [hash, name, email, date, ...msgParts] = line.split('|');
    return { hash, name, email, date, message: msgParts.join('|') };
  });
}

// Single git command to get all diff stats + file names + language info
export function getDiffStatsAndLangs({ author, since, until } = {}) {
  const args = ['git', 'log', '--no-merges', '--numstat', '--format='];
  if (author) args.push(`--author=${author}`);
  if (since) args.push(`--since=${since}`);
  if (until) args.push(`--until=${until}`);

  const raw = runArgs(args);

  let added = 0, removed = 0;
  const files = new Set();
  const fileChanges = {};
  const extCount = {};

  if (raw) {
    for (const line of raw.split('\n')) {
      if (!line || !line.includes('\t')) continue;
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const [a, r, file] = parts;
      if (a === '-') continue; // binary
      const addNum = parseInt(a) || 0;
      const remNum = parseInt(r) || 0;
      added += addNum;
      removed += remNum;
      files.add(file);
      fileChanges[file] = (fileChanges[file] || 0) + addNum + remNum;

      const ext = file.includes('.') ? file.split('.').pop().toLowerCase() : 'other';
      extCount[ext] = (extCount[ext] || 0) + 1;
    }
  }

  return { added, removed, files, fileChanges, extCount };
}

export function getAllAuthors({ since, until } = {}) {
  const args = ['git', 'log', '--no-merges', '--format=%an'];
  if (since) args.push(`--since=${since}`);
  if (until) args.push(`--until=${until}`);
  const raw = runArgs(args);
  if (!raw) return [];
  const counts = {};
  for (const name of raw.split('\n').filter(Boolean)) {
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, commits]) => ({ name, commits }))
    .sort((a, b) => b.commits - a.commits);
}

export function getStreakData(author) {
  const raw = runArgs(['git', 'log', '--no-merges', `--author=${author}`, '--format=%aI']);
  if (!raw) return { current: 0, longest: 0 };

  const dates = [...new Set(
    raw.split('\n').filter(Boolean).map(d => d.slice(0, 10))
  )].sort();

  if (!dates.length) return { current: 0, longest: 0 };

  let longest = 1, current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  // Check if current streak is active (last commit today or yesterday)
  const lastDate = new Date(dates[dates.length - 1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24);
  if (diffDays > 1) current = 0;

  return { current, longest: Math.max(longest, current) };
}

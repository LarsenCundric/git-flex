import { execSync, execFileSync } from 'node:child_process';

const STDIO = { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] };

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

function getEmptyTreeHash() {
  return run('git hash-object -t tree /dev/null') || '4b825dc642cb6eb9a060e54bf899d69f82cf17c8';
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

export function getDiffStats(commits) {
  if (!commits.length) return { added: 0, removed: 0, files: new Set(), fileChanges: {} };
  let added = 0, removed = 0;
  const files = new Set();
  const fileChanges = {};

  for (const { hash } of commits) {
    const numstat = runArgs(['git', 'diff', '--numstat', `${hash}~1`, hash]);
    if (!numstat) {
      // First commit — diff against empty tree
      const numstat2 = runArgs(['git', 'diff', '--numstat', getEmptyTreeHash(), hash]);
      if (!numstat2) continue;
      for (const line of numstat2.split('\n').filter(Boolean)) {
        const [a, r, file] = line.split('\t');
        if (a === '-') continue;
        added += parseInt(a) || 0;
        removed += parseInt(r) || 0;
        files.add(file);
        fileChanges[file] = (fileChanges[file] || 0) + (parseInt(a) || 0) + (parseInt(r) || 0);
      }
      continue;
    }
    for (const line of numstat.split('\n').filter(Boolean)) {
      const [a, r, file] = line.split('\t');
      if (a === '-') continue;
      added += parseInt(a) || 0;
      removed += parseInt(r) || 0;
      files.add(file);
      fileChanges[file] = (fileChanges[file] || 0) + (parseInt(a) || 0) + (parseInt(r) || 0);
    }
  }

  return { added, removed, files, fileChanges };
}

export function getLanguageBreakdown(commits) {
  if (!commits.length) return {};
  const extCount = {};

  for (const { hash } of commits) {
    let filesRaw = runArgs(['git', 'diff', '--name-only', `${hash}~1`, hash]);
    if (!filesRaw) {
      filesRaw = runArgs(['git', 'diff', '--name-only', getEmptyTreeHash(), hash]);
    }
    if (!filesRaw) continue;
    for (const file of filesRaw.split('\n').filter(Boolean)) {
      const ext = file.includes('.') ? file.split('.').pop().toLowerCase() : 'other';
      extCount[ext] = (extCount[ext] || 0) + 1;
    }
  }

  return extCount;
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

import { getCommits, getDiffStats, getLanguageBreakdown, getCurrentUser } from './git.js';

const EXT_NAMES = {
  js: 'JavaScript', ts: 'TypeScript', jsx: 'React JSX', tsx: 'React TSX',
  py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java',
  cpp: 'C++', c: 'C', cs: 'C#', php: 'PHP', swift: 'Swift',
  kt: 'Kotlin', scala: 'Scala', html: 'HTML', css: 'CSS', scss: 'SCSS',
  less: 'Less', json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
  md: 'Markdown', sql: 'SQL', sh: 'Shell', bash: 'Shell', zsh: 'Shell',
  vue: 'Vue', svelte: 'Svelte', dart: 'Dart', lua: 'Lua', zig: 'Zig',
  ex: 'Elixir', exs: 'Elixir', erl: 'Erlang', hs: 'Haskell',
  ml: 'OCaml', r: 'R', jl: 'Julia', tf: 'Terraform', dockerfile: 'Docker',
  graphql: 'GraphQL', proto: 'Protobuf', xml: 'XML', other: 'Other',
};

export function computeStats({ author, since, until } = {}) {
  const user = author || getCurrentUser();
  const commits = getCommits({ author: user, since, until });
  const { added, removed, files, fileChanges } = getDiffStats(commits);
  const langRaw = getLanguageBreakdown(commits);

  // Language percentages
  const totalFiles = Object.values(langRaw).reduce((a, b) => a + b, 0) || 1;
  const languages = Object.entries(langRaw)
    .map(([ext, count]) => ({
      ext,
      name: EXT_NAMES[ext] || ext.toUpperCase(),
      count,
      pct: Math.round((count / totalFiles) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Most edited file
  const mostEdited = Object.entries(fileChanges)
    .sort((a, b) => b[1] - a[1])[0];

  // Peak coding hour
  const hourCounts = new Array(24).fill(0);
  for (const c of commits) {
    const hour = new Date(c.date).getHours();
    hourCounts[hour]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return {
    author: user,
    commits: commits.length,
    added,
    removed,
    net: added - removed,
    filesCount: files.size,
    languages,
    mostEdited: mostEdited ? { file: mostEdited[0], changes: mostEdited[1] } : null,
    peakHour,
    hourCounts,
    commitData: commits,
  };
}

export function getTimeRange(period) {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return { since: d.toISOString().slice(0, 10), label: 'Today' };
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return { since: d.toISOString().slice(0, 10), label: 'This Week' };
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { since: d.toISOString().slice(0, 10), label: 'This Month' };
    }
    case 'all':
    default:
      return { since: undefined, label: 'All Time' };
  }
}

export function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function formatNumber(n) {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

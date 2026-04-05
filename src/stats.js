import { getCommits, getDiffStatsAndLangs, getCurrentUser } from './git.js';

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

  // Single git command for all diff stats + language breakdown
  const { added, removed, files, fileChanges, extCount } = getDiffStatsAndLangs({ author: user, since, until });

  // Language percentages (merge extensions that map to the same language name)
  const totalFiles = Object.values(extCount).reduce((a, b) => a + b, 0) || 1;
  const langMerged = {};
  for (const [ext, count] of Object.entries(extCount)) {
    const name = EXT_NAMES[ext] || ext.toUpperCase();
    langMerged[name] = (langMerged[name] || 0) + count;
  }
  const languages = Object.entries(langMerged)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalFiles) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Most edited file (skip lockfiles and generated junk)
  const IGNORE = /(\block\b|\.lock$|\.min\.|\.map$|\.snap$|\.d\.ts$|package-lock|yarn\.lock|pnpm-lock|uv\.lock|Cargo\.lock|Gemfile\.lock|poetry\.lock|composer\.lock|go\.sum|shrinkwrap|dist\/|build\/|\.generated\.|__pycache__|\.svg$|\.ico$|migrations\/|openapi\.|swagger\.|\.proto$|\.pb\.|schema\.prisma)/i;
  const mostEdited = Object.entries(fileChanges)
    .filter(([f]) => !IGNORE.test(f))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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
    mostEdited: mostEdited.length ? mostEdited.map(([file, changes]) => ({ file, changes })) : null,
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

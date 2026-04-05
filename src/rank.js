export function getRank(stats, streakData) {
  const titles = [];

  // Time-based titles
  const { peakHour, hourCounts } = stats;
  const nightCommits = hourCounts.slice(22, 24).reduce((a, b) => a + b, 0)
    + hourCounts.slice(0, 5).reduce((a, b) => a + b, 0);
  const morningCommits = hourCounts.slice(5, 9).reduce((a, b) => a + b, 0);
  const total = hourCounts.reduce((a, b) => a + b, 0) || 1;

  if (nightCommits / total > 0.3) titles.push({ title: 'Night Owl', icon: '\u{1F989}', weight: 3 });
  if (morningCommits / total > 0.3) titles.push({ title: 'Early Bird', icon: '\u{1F426}', weight: 3 });

  // Weekend warrior
  const weekendCommits = (stats.commitData || []).filter(c => {
    const day = new Date(c.date).getDay();
    return day === 0 || day === 6;
  }).length;
  if (weekendCommits / total > 0.3) titles.push({ title: 'Weekend Warrior', icon: '\u{2694}\u{FE0F}', weight: 2 });

  // Message pattern titles
  const messages = (stats.commitData || []).map(c => c.message.toLowerCase());
  const fixCount = messages.filter(m => m.includes('fix') || m.includes('bug') || m.includes('patch')).length;
  const refactorCount = messages.filter(m => m.includes('refactor') || m.includes('clean') || m.includes('restructure')).length;
  const featCount = messages.filter(m => m.includes('feat') || m.includes('add') || m.includes('implement')).length;
  const docsCount = messages.filter(m => m.includes('doc') || m.includes('readme') || m.includes('comment')).length;
  const testCount = messages.filter(m => m.includes('test') || m.includes('spec') || m.includes('coverage')).length;

  if (fixCount / total > 0.3) titles.push({ title: 'Bug Slayer', icon: '\u{1F41B}', weight: 4 });
  if (refactorCount / total > 0.2) titles.push({ title: 'Refactor King', icon: '\u{1F451}', weight: 4 });
  if (featCount / total > 0.3) titles.push({ title: 'Feature Factory', icon: '\u{1F3ED}', weight: 3 });
  if (docsCount / total > 0.2) titles.push({ title: 'Docs Hero', icon: '\u{1F4DA}', weight: 2 });
  if (testCount / total > 0.2) titles.push({ title: 'Test Guru', icon: '\u{1F9EA}', weight: 2 });

  // Volume-based
  if (stats.commits >= 500) titles.push({ title: 'Commit Machine', icon: '\u{1F916}', weight: 5 });
  else if (stats.commits >= 100) titles.push({ title: 'Prolific Coder', icon: '\u{26A1}', weight: 3 });

  if (stats.added > 10000) titles.push({ title: 'Code Cannon', icon: '\u{1F4A5}', weight: 3 });
  if (stats.removed > stats.added) titles.push({ title: 'Code Surgeon', icon: '\u{1FA7A}', weight: 4 });

  // Streak-based
  if (streakData && streakData.current >= 30) titles.push({ title: 'Streak Legend', icon: '\u{1F525}', weight: 5 });
  else if (streakData && streakData.current >= 7) titles.push({ title: 'On Fire', icon: '\u{1F525}', weight: 3 });

  // Language diversity
  if (stats.languages.length >= 5) titles.push({ title: 'Polyglot', icon: '\u{1F30D}', weight: 2 });

  if (!titles.length) {
    if (stats.commits > 0) titles.push({ title: 'Contributor', icon: '\u{1F4BB}', weight: 1 });
    else titles.push({ title: 'Observer', icon: '\u{1F440}', weight: 0 });
  }

  titles.sort((a, b) => b.weight - a.weight);
  return titles[0];
}

export function getLevel(commits) {
  if (commits >= 1000) return { level: 10, name: 'Legendary', bar: '\u2588'.repeat(10) };
  if (commits >= 500) return { level: 8, name: 'Master', bar: '\u2588'.repeat(8) + '\u2591'.repeat(2) };
  if (commits >= 200) return { level: 6, name: 'Expert', bar: '\u2588'.repeat(6) + '\u2591'.repeat(4) };
  if (commits >= 100) return { level: 5, name: 'Skilled', bar: '\u2588'.repeat(5) + '\u2591'.repeat(5) };
  if (commits >= 50) return { level: 4, name: 'Adept', bar: '\u2588'.repeat(4) + '\u2591'.repeat(6) };
  if (commits >= 20) return { level: 3, name: 'Apprentice', bar: '\u2588'.repeat(3) + '\u2591'.repeat(7) };
  if (commits >= 5) return { level: 2, name: 'Novice', bar: '\u2588'.repeat(2) + '\u2591'.repeat(8) };
  return { level: 1, name: 'Newcomer', bar: '\u2588' + '\u2591'.repeat(9) };
}

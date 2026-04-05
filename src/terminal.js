import chalk from 'chalk';
import { formatHour, formatNumber } from './stats.js';
import { getRank, getLevel } from './rank.js';
import { getHighlights } from './highlights.js';

const BOX = { tl: '\u256D', tr: '\u256E', bl: '\u2570', br: '\u256F', h: '\u2500', v: '\u2502' };
const W = 56;

function line(left, content, right) {
  const stripped = content.replace(/\x1B\[[0-9;]*m/g, '');
  const pad = W - 2 - stripped.length;
  return `${left}${content}${' '.repeat(Math.max(0, pad))}${right}`;
}

function box(content) {
  return `${BOX.v} ${content}`;
}

function hr() {
  return chalk.dim(`${BOX.v}${BOX.h.repeat(W - 2)}${BOX.v}`);
}

function padRight(str, len) {
  const stripped = str.replace(/\x1B\[[0-9;]*m/g, '');
  return str + ' '.repeat(Math.max(0, len - stripped.length));
}

function langBar(pct) {
  const filled = Math.round(pct / 5);
  return chalk.green('\u2588'.repeat(filled)) + chalk.dim('\u2591'.repeat(20 - filled));
}

export function renderCard(stats, streakData, repoName, periodLabel) {
  const rank = getRank(stats, streakData);
  const level = getLevel(stats.commits);
  const o = [];

  // Top border
  o.push(chalk.cyan(`${BOX.tl}${BOX.h.repeat(W - 2)}${BOX.tr}`));

  // Header
  const title = ` FLEX \u2022 ${repoName}`;
  const period = periodLabel;
  const headerPad = W - 2 - title.length - period.length;
  o.push(chalk.cyan(BOX.v) + chalk.bold.white(title) + ' '.repeat(Math.max(1, headerPad)) + chalk.dim(period) + chalk.cyan(BOX.v));

  o.push(chalk.cyan(`${BOX.v}${BOX.h.repeat(W - 2)}${BOX.v}`));

  // User + rank
  const userLine = ` ${chalk.bold.yellow(stats.author)}  ${rank.icon}  ${chalk.italic.magenta(rank.title)}`;
  o.push(line(chalk.cyan(BOX.v), userLine, chalk.cyan(BOX.v)));

  // Level bar
  const lvlLine = ` ${chalk.dim('LVL')} ${chalk.white(level.level)} ${chalk.cyan(level.bar)} ${chalk.dim(level.name)}`;
  o.push(line(chalk.cyan(BOX.v), lvlLine, chalk.cyan(BOX.v)));

  o.push(hr());

  // Stats grid
  const col1 = [
    [chalk.dim('Commits'), chalk.bold.white(formatNumber(stats.commits))],
    [chalk.dim('Added'), chalk.bold.green('+' + formatNumber(stats.added))],
    [chalk.dim('Removed'), chalk.bold.red('-' + formatNumber(stats.removed))],
    [chalk.dim('Net'), chalk.bold[stats.net >= 0 ? 'green' : 'red']((stats.net >= 0 ? '+' : '') + formatNumber(stats.net))],
  ];
  const col2 = [
    [chalk.dim('Files'), chalk.bold.white(formatNumber(stats.filesCount))],
    [chalk.dim('Peak Hour'), chalk.bold.white(formatHour(stats.peakHour))],
    [chalk.dim('Streak'), chalk.bold.yellow(`${streakData.current}d \u{1F525}`)],
    [chalk.dim('Top Streak'), chalk.bold.white(`${streakData.longest}d`)],
  ];

  for (let i = 0; i < col1.length; i++) {
    const left = ` ${padRight(col1[i][0], 10)} ${padRight(col1[i][1], 10)}`;
    const right = `${padRight(col2[i][0], 11)} ${col2[i][1]}`;
    const full = left + '  ' + right;
    o.push(line(chalk.cyan(BOX.v), full, chalk.cyan(BOX.v)));
  }

  // Languages
  if (stats.languages.length) {
    o.push(hr());
    o.push(line(chalk.cyan(BOX.v), ` ${chalk.bold.white('Languages')}`, chalk.cyan(BOX.v)));
    for (const lang of stats.languages.slice(0, 5)) {
      const lbl = padRight(` ${chalk.white(lang.name)}`, 20);
      const bar = langBar(lang.pct);
      const pctStr = chalk.dim(`${lang.pct}%`);
      o.push(line(chalk.cyan(BOX.v), `${lbl} ${bar} ${pctStr}`, chalk.cyan(BOX.v)));
    }
  }

  // Highlights
  const highlights = getHighlights(stats, streakData);
  if (highlights.length) {
    o.push(hr());
    for (const h of highlights) {
      o.push(line(chalk.cyan(BOX.v), ` ${chalk.yellow('>')} ${chalk.italic.white(h)}`, chalk.cyan(BOX.v)));
    }
  }

  // Bottom
  o.push(chalk.cyan(`${BOX.bl}${BOX.h.repeat(W - 2)}${BOX.br}`));

  return o.join('\n');
}

export function renderComparison(stats1, stats2, streak1, streak2, repoName) {
  const rank1 = getRank(stats1, streak1);
  const rank2 = getRank(stats2, streak2);
  const o = [];
  const W2 = 64;

  o.push(chalk.cyan(`${BOX.tl}${BOX.h.repeat(W2 - 2)}${BOX.tr}`));
  o.push(line(chalk.cyan(BOX.v), chalk.bold.white(` FLEX VS \u2022 ${repoName}`), chalk.cyan(BOX.v)));
  o.push(chalk.cyan(`${BOX.v}${BOX.h.repeat(W2 - 2)}${BOX.v}`));

  function vsLine(label, v1, v2) {
    return line(chalk.cyan(BOX.v),
      ` ${padRight(chalk.dim(label), 12)} ${padRight(v1, 14)} ${chalk.dim('vs')} ${padRight(v2, 14)}`,
      chalk.cyan(BOX.v));
  }

  // Names
  o.push(vsLine('', chalk.bold.yellow(stats1.author), chalk.bold.blue(stats2.author)));
  o.push(vsLine('Rank', chalk.magenta(`${rank1.icon} ${rank1.title}`), chalk.magenta(`${rank2.icon} ${rank2.title}`)));
  o.push(hr());
  o.push(vsLine('Commits', chalk.white(formatNumber(stats1.commits)), chalk.white(formatNumber(stats2.commits))));
  o.push(vsLine('Added', chalk.green('+' + formatNumber(stats1.added)), chalk.green('+' + formatNumber(stats2.added))));
  o.push(vsLine('Removed', chalk.red('-' + formatNumber(stats1.removed)), chalk.red('-' + formatNumber(stats2.removed))));
  o.push(vsLine('Files', chalk.white(formatNumber(stats1.filesCount)), chalk.white(formatNumber(stats2.filesCount))));
  o.push(vsLine('Streak', chalk.yellow(`${streak1.current}d`), chalk.yellow(`${streak2.current}d`)));

  o.push(chalk.cyan(`${BOX.bl}${BOX.h.repeat(W2 - 2)}${BOX.br}`));
  return o.join('\n');
}

export function renderTeam(authors, repoName, periodLabel) {
  const o = [];
  const W2 = 52;

  o.push(chalk.cyan(`${BOX.tl}${BOX.h.repeat(W2 - 2)}${BOX.tr}`));
  o.push(line(chalk.cyan(BOX.v), chalk.bold.white(` FLEX TEAM \u2022 ${repoName} \u2022 ${periodLabel}`), chalk.cyan(BOX.v)));
  o.push(chalk.cyan(`${BOX.v}${BOX.h.repeat(W2 - 2)}${BOX.v}`));

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
  const maxCommits = authors[0]?.commits || 1;

  for (let i = 0; i < Math.min(authors.length, 15); i++) {
    const a = authors[i];
    const medal = medals[i] || chalk.dim(`${i + 1}.`);
    const bar = chalk.green('\u2588'.repeat(Math.max(1, Math.round((a.commits / maxCommits) * 15))));
    const name = padRight(chalk.white(a.name), 20);
    o.push(line(chalk.cyan(BOX.v),
      ` ${padRight(medal, 4)} ${name} ${bar} ${chalk.dim(a.commits)}`,
      chalk.cyan(BOX.v)));
  }

  o.push(chalk.cyan(`${BOX.bl}${BOX.h.repeat(W2 - 2)}${BOX.br}`));
  return o.join('\n');
}

export function renderStreak(streakData, stats, repoName) {
  const o = [];
  o.push(chalk.cyan(`${BOX.tl}${BOX.h.repeat(W - 2)}${BOX.tr}`));
  o.push(line(chalk.cyan(BOX.v), chalk.bold.white(` FLEX STREAK \u2022 ${repoName}`), chalk.cyan(BOX.v)));
  o.push(chalk.cyan(`${BOX.v}${BOX.h.repeat(W - 2)}${BOX.v}`));

  o.push(line(chalk.cyan(BOX.v), ` ${chalk.dim('Author')}    ${chalk.bold.yellow(stats.author)}`, chalk.cyan(BOX.v)));
  o.push(line(chalk.cyan(BOX.v), ` ${chalk.dim('Current')}   ${chalk.bold.yellow(`${streakData.current} days`)} ${streakData.current >= 7 ? '\u{1F525}' : ''}`, chalk.cyan(BOX.v)));
  o.push(line(chalk.cyan(BOX.v), ` ${chalk.dim('Longest')}   ${chalk.bold.white(`${streakData.longest} days`)} \u{1F3C6}`, chalk.cyan(BOX.v)));

  // Visual streak bar
  const days = Math.min(streakData.current, 30);
  const bar = chalk.yellow('\u2588'.repeat(days)) + chalk.dim('\u2591'.repeat(30 - days));
  o.push(line(chalk.cyan(BOX.v), ` ${bar}`, chalk.cyan(BOX.v)));

  let msg = '';
  if (streakData.current === 0) msg = 'Start a streak today!';
  else if (streakData.current >= 30) msg = 'UNSTOPPABLE!';
  else if (streakData.current >= 14) msg = 'Incredible dedication!';
  else if (streakData.current >= 7) msg = 'One week strong!';
  else if (streakData.current >= 3) msg = 'Building momentum...';
  else msg = 'Keep it going!';
  o.push(line(chalk.cyan(BOX.v), ` ${chalk.italic.dim(msg)}`, chalk.cyan(BOX.v)));

  o.push(chalk.cyan(`${BOX.bl}${BOX.h.repeat(W - 2)}${BOX.br}`));
  return o.join('\n');
}

export function renderLangs(stats, repoName, periodLabel) {
  const o = [];
  o.push(chalk.cyan(`${BOX.tl}${BOX.h.repeat(W - 2)}${BOX.tr}`));
  o.push(line(chalk.cyan(BOX.v), chalk.bold.white(` FLEX LANGS \u2022 ${repoName} \u2022 ${periodLabel}`), chalk.cyan(BOX.v)));
  o.push(chalk.cyan(`${BOX.v}${BOX.h.repeat(W - 2)}${BOX.v}`));

  if (!stats.languages.length) {
    o.push(line(chalk.cyan(BOX.v), chalk.dim(' No language data found'), chalk.cyan(BOX.v)));
  } else {
    for (const lang of stats.languages) {
      const lbl = padRight(` ${chalk.bold.white(lang.name)}`, 22);
      const bar = langBar(lang.pct);
      const pct = padRight(chalk.yellow(`${lang.pct}%`), 6);
      const cnt = chalk.dim(`(${lang.count} files)`);
      o.push(line(chalk.cyan(BOX.v), `${lbl} ${bar} ${pct} ${cnt}`, chalk.cyan(BOX.v)));
    }
  }

  o.push(chalk.cyan(`${BOX.bl}${BOX.h.repeat(W - 2)}${BOX.br}`));
  return o.join('\n');
}

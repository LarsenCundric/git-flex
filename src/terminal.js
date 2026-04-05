import chalk from 'chalk';
import stringWidth from 'string-width';
import { formatHour, formatNumber } from './stats.js';
import { getRank, getLevel } from './rank.js';
import { getHighlights } from './highlights.js';

const BOX = { tl: '\u256D', tr: '\u256E', bl: '\u2570', br: '\u256F', h: '\u2500', v: '\u2502' };
const W = 58;

function line(content, width = W) {
  const vis = stringWidth(content);
  const pad = width - 2 - vis;
  return `${chalk.cyan(BOX.v)}${content}${' '.repeat(Math.max(0, pad))}${chalk.cyan(BOX.v)}`;
}

function hr(width = W) {
  return chalk.dim(`${BOX.v}${BOX.h.repeat(width - 2)}${BOX.v}`);
}

function top(width = W) {
  return chalk.cyan(`${BOX.tl}${BOX.h.repeat(width - 2)}${BOX.tr}`);
}

function bot(width = W) {
  return chalk.cyan(`${BOX.bl}${BOX.h.repeat(width - 2)}${BOX.br}`);
}

function sep(width = W) {
  return chalk.cyan(`${BOX.v}${BOX.h.repeat(width - 2)}${BOX.v}`);
}

function pad(str, len) {
  const vis = stringWidth(str);
  return str + ' '.repeat(Math.max(0, len - vis));
}

function langBar(pct) {
  const filled = Math.round(pct / 5);
  return chalk.green('\u2588'.repeat(filled)) + chalk.dim('\u2591'.repeat(20 - filled));
}

export function renderCard(stats, streakData, repoName, periodLabel) {
  const rank = getRank(stats, streakData);
  const level = getLevel(stats.commits);
  const o = [];

  o.push(top());

  // Header
  const title = ` FLEX \u2022 ${repoName}`;
  const period = periodLabel;
  const headerPad = W - 2 - stringWidth(title) - stringWidth(period);
  o.push(chalk.cyan(BOX.v) + chalk.bold.white(title) + ' '.repeat(Math.max(1, headerPad)) + chalk.dim(period) + chalk.cyan(BOX.v));

  o.push(sep());

  // User + rank
  o.push(line(` ${chalk.bold.yellow(stats.author)}  ${rank.icon}  ${chalk.italic.magenta(rank.title)}`));

  // Level bar
  o.push(line(` ${chalk.dim('LVL')} ${chalk.white(level.level)} ${chalk.cyan(level.bar)} ${chalk.dim(level.name)}`));

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
    const left = ` ${pad(col1[i][0], 10)} ${pad(col1[i][1], 10)}`;
    const right = `${pad(col2[i][0], 11)} ${col2[i][1]}`;
    const full = left + '  ' + right;
    o.push(line(full));
  }

  // Languages
  if (stats.languages.length) {
    o.push(hr());
    o.push(line(` ${chalk.bold.white('Languages')}`));
    for (const lang of stats.languages.slice(0, 5)) {
      const lbl = pad(` ${chalk.white(lang.name)}`, 20);
      const bar = langBar(lang.pct);
      const pctStr = chalk.dim(`${lang.pct}%`);
      o.push(line(`${lbl} ${bar} ${pctStr}`));
    }
  }

  // Highlights
  const highlights = getHighlights(stats, streakData);
  if (highlights.length) {
    o.push(hr());
    for (const h of highlights) {
      o.push(line(` ${chalk.yellow('>')} ${chalk.italic.white(h)}`));
    }
  }

  o.push(bot());
  return o.join('\n');
}

export function renderComparison(stats1, stats2, streak1, streak2, repoName) {
  const rank1 = getRank(stats1, streak1);
  const rank2 = getRank(stats2, streak2);
  const o = [];
  const CW = 64;

  o.push(top(CW));
  o.push(line(chalk.bold.white(` FLEX VS \u2022 ${repoName}`), CW));
  o.push(sep(CW));

  function vsLine(label, v1, v2) {
    return line(` ${pad(chalk.dim(label), 12)} ${pad(v1, 14)} ${chalk.dim('vs')} ${pad(v2, 14)}`, CW);
  }

  o.push(vsLine('', chalk.bold.yellow(stats1.author), chalk.bold.blue(stats2.author)));
  o.push(vsLine('Rank', chalk.magenta(`${rank1.icon} ${rank1.title}`), chalk.magenta(`${rank2.icon} ${rank2.title}`)));
  o.push(hr(CW));
  o.push(vsLine('Commits', chalk.white(formatNumber(stats1.commits)), chalk.white(formatNumber(stats2.commits))));
  o.push(vsLine('Added', chalk.green('+' + formatNumber(stats1.added)), chalk.green('+' + formatNumber(stats2.added))));
  o.push(vsLine('Removed', chalk.red('-' + formatNumber(stats1.removed)), chalk.red('-' + formatNumber(stats2.removed))));
  o.push(vsLine('Files', chalk.white(formatNumber(stats1.filesCount)), chalk.white(formatNumber(stats2.filesCount))));
  o.push(vsLine('Streak', chalk.yellow(`${streak1.current}d`), chalk.yellow(`${streak2.current}d`)));

  o.push(bot(CW));
  return o.join('\n');
}

export function renderTeam(authors, repoName, periodLabel) {
  const o = [];
  const TW = 76;

  o.push(top(TW));
  o.push(line(chalk.bold.white(` FLEX TEAM \u2022 ${repoName} \u2022 ${periodLabel}`), TW));
  o.push(sep(TW));

  // Header row
  o.push(line(` ${pad('', 4)} ${pad(chalk.dim('Name'), 18)} ${pad(chalk.dim('Commits'), 8)} ${pad(chalk.dim('Added'), 9)} ${pad(chalk.dim('Removed'), 9)} ${pad(chalk.dim('Net'), 9)}`, TW));
  o.push(hr(TW));

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

  for (let i = 0; i < Math.min(authors.length, 15); i++) {
    const a = authors[i];
    const medal = medals[i] || chalk.dim(`${i + 1}.`);
    const name = pad(chalk.white(a.name), 18);
    const commits = pad(chalk.bold.white(formatNumber(a.commits)), 8);
    const added = pad(chalk.green('+' + formatNumber(a.added)), 9);
    const removed = pad(chalk.red('-' + formatNumber(a.removed)), 9);
    const net = a.net >= 0
      ? chalk.green('+' + formatNumber(a.net))
      : chalk.red(formatNumber(a.net));
    o.push(line(` ${pad(medal, 4)} ${name} ${commits} ${added} ${removed} ${pad(net, 9)}`, TW));
  }

  o.push(bot(TW));
  return o.join('\n');
}

export function renderStreak(streakData, stats, repoName) {
  const o = [];
  o.push(top());
  o.push(line(chalk.bold.white(` FLEX STREAK \u2022 ${repoName}`)));
  o.push(sep());

  o.push(line(` ${chalk.dim('Author')}    ${chalk.bold.yellow(stats.author)}`));
  o.push(line(` ${chalk.dim('Current')}   ${chalk.bold.yellow(`${streakData.current} days`)} ${streakData.current >= 7 ? '\u{1F525}' : ''}`));
  o.push(line(` ${chalk.dim('Longest')}   ${chalk.bold.white(`${streakData.longest} days`)} \u{1F3C6}`));

  const days = Math.min(streakData.current, 30);
  const bar = chalk.yellow('\u2588'.repeat(days)) + chalk.dim('\u2591'.repeat(30 - days));
  o.push(line(` ${bar}`));

  let msg = '';
  if (streakData.current === 0) msg = 'Start a streak today!';
  else if (streakData.current >= 30) msg = 'UNSTOPPABLE!';
  else if (streakData.current >= 14) msg = 'Incredible dedication!';
  else if (streakData.current >= 7) msg = 'One week strong!';
  else if (streakData.current >= 3) msg = 'Building momentum...';
  else msg = 'Keep it going!';
  o.push(line(` ${chalk.italic.dim(msg)}`));

  o.push(bot());
  return o.join('\n');
}

export function renderLangs(stats, repoName, periodLabel) {
  const o = [];
  const LW = 62;
  o.push(top(LW));
  o.push(line(chalk.bold.white(` FLEX LANGS \u2022 ${repoName} \u2022 ${periodLabel}`), LW));
  o.push(sep(LW));

  if (!stats.languages.length) {
    o.push(line(chalk.dim(' No language data found'), LW));
  } else {
    for (const lang of stats.languages) {
      const lbl = pad(` ${chalk.bold.white(lang.name)}`, 16);
      const bar = langBar(lang.pct);
      const pct = pad(chalk.yellow(`${lang.pct}%`), 5);
      const cnt = chalk.dim(`(${lang.count} files)`);
      o.push(line(`${lbl} ${bar} ${pct} ${cnt}`, LW));
    }
  }

  o.push(bot(LW));
  return o.join('\n');
}

#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync } from 'node:fs';
import { isGitRepo, getRepoName, getCurrentUser, getStreakData, getAllAuthors } from './git.js';
import { computeStats, getTimeRange } from './stats.js';
import { renderCard, renderComparison, renderTeam, renderStreak, renderLangs } from './terminal.js';
import { generateSVG } from './svg.js';

function ensureRepo() {
  if (!isGitRepo()) {
    console.error('Error: not a git repository. Run flex inside a git repo.');
    process.exit(1);
  }
}

const program = new Command();

program
  .name('flex')
  .description('Show off your coding stats')
  .version('1.0.0')
  .argument('[period]', 'today (default), week, month, or all')
  .action((period) => {
    ensureRepo();
    period = period || 'today';
    const { since, label } = getTimeRange(period);
    const repoName = getRepoName();
    const stats = computeStats({ since });
    const streakData = getStreakData(getCurrentUser());
    console.log(renderCard(stats, streakData, repoName, label));
  });

program
  .command('vs <author>')
  .description('Compare your stats with a teammate')
  .option('-p, --period <period>', 'today, week, month, all', 'all')
  .action((author, opts) => {
    ensureRepo();
    const cleanAuthor = author.replace(/^@/, '');
    const { since, label } = getTimeRange(opts.period);
    const repoName = getRepoName();
    const myStats = computeStats({ since });
    const theirStats = computeStats({ author: cleanAuthor, since });
    const myStreak = getStreakData(getCurrentUser());
    const theirStreak = getStreakData(cleanAuthor);
    console.log(renderComparison(myStats, theirStats, myStreak, theirStreak, repoName));
  });

program
  .command('team')
  .description('Show all contributors ranked')
  .option('-p, --period <period>', 'today, week, month, all', 'all')
  .action((opts) => {
    ensureRepo();
    const { since, label } = getTimeRange(opts.period);
    const repoName = getRepoName();
    const authors = getAllAuthors({ since });
    console.log(renderTeam(authors, repoName, label));
  });

program
  .command('card')
  .description('Generate a shareable SVG card')
  .option('--dark', 'Dark theme (default)')
  .option('--midnight', 'Midnight theme')
  .option('--light', 'Light theme')
  .option('-p, --period <period>', 'today, week, month, all', 'all')
  .option('-o, --output <file>', 'Output file', 'flex-card.svg')
  .action((opts) => {
    ensureRepo();
    const theme = opts.midnight ? 'midnight' : opts.light ? 'light' : 'dark';
    const { since, label } = getTimeRange(opts.period);
    const repoName = getRepoName();
    const stats = computeStats({ since });
    const streakData = getStreakData(getCurrentUser());
    const svg = generateSVG(stats, streakData, repoName, label, theme);
    writeFileSync(opts.output, svg);
    console.log(`✨ Card saved to ${opts.output} (${theme} theme)`);
  });

program
  .command('streak')
  .description('Show your commit streak')
  .action(() => {
    ensureRepo();
    const repoName = getRepoName();
    const user = getCurrentUser();
    const streakData = getStreakData(user);
    const stats = computeStats({});
    console.log(renderStreak(streakData, stats, repoName));
  });

program
  .command('langs')
  .description('Breakdown by language/file type')
  .option('-p, --period <period>', 'today, week, month, all', 'all')
  .action((opts) => {
    ensureRepo();
    const { since, label } = getTimeRange(opts.period);
    const repoName = getRepoName();
    const stats = computeStats({ since });
    console.log(renderLangs(stats, repoName, label));
  });

program.parse();
import { formatHour, formatNumber } from './stats.js';
import { getRank, getLevel } from './rank.js';
import { getHighlights } from './highlights.js';

const DARK = {
  bg1: '#0d1117', bg2: '#161b22', border: '#30363d',
  text: '#e6edf3', textDim: '#7d8590', accent: '#58a6ff',
  green: '#3fb950', red: '#f85149', yellow: '#d29922',
  purple: '#bc8cff', grad1: '#0d1117', grad2: '#161b22',
};

const LIGHT = {
  bg1: '#ffffff', bg2: '#f6f8fa', border: '#d0d7de',
  text: '#1f2328', textDim: '#656d76', accent: '#0969da',
  green: '#1a7f37', red: '#cf222e', yellow: '#9a6700',
  purple: '#8250df', grad1: '#ffffff', grad2: '#f6f8fa',
};

export function generateSVG(stats, streakData, repoName, periodLabel, theme = 'dark') {
  const c = theme === 'light' ? LIGHT : DARK;
  const rank = getRank(stats, streakData);
  const level = getLevel(stats.commits);
  const highlights = getHighlights(stats, streakData);
  const W = 480, H = 430;

  // Language bars
  let langBars = '';
  let langLabels = '';
  let xOffset = 30;
  const barW = W - 60;
  for (const lang of stats.languages.slice(0, 6)) {
    const w = Math.max(2, (lang.pct / 100) * barW);
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#79c0ff'];
    const color = colors[stats.languages.indexOf(lang) % colors.length];
    langBars += `<rect x="${xOffset}" y="290" width="${w}" height="8" rx="2" fill="${color}"/>`;
    if (lang.pct >= 8) {
      langLabels += `<text x="${xOffset + w / 2}" y="316" fill="${c.textDim}" font-size="10" text-anchor="middle" font-family="'SF Mono','Fira Code',monospace">${lang.name} ${lang.pct}%</text>`;
    }
    xOffset += w + 2;
  }

  // Hour activity chart (mini sparkline)
  const maxH = Math.max(...stats.hourCounts, 1);
  let sparkline = '';
  for (let i = 0; i < 24; i++) {
    const h = (stats.hourCounts[i] / maxH) * 40;
    const x = 30 + i * ((W - 60) / 24);
    sparkline += `<rect x="${x}" y="${340 - h}" width="${(W - 60) / 24 - 1}" height="${h}" rx="1" fill="${c.accent}" opacity="0.6"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c.grad1}"/>
      <stop offset="100%" style="stop-color:${c.grad2}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${c.accent}"/>
      <stop offset="100%" style="stop-color:${c.purple}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" rx="12" fill="url(#bg)" stroke="${c.border}" stroke-width="1"/>

  <!-- Header line -->
  <rect x="0" y="54" width="${W}" height="1" fill="${c.border}"/>

  <!-- Title -->
  <text x="30" y="36" fill="${c.accent}" font-size="16" font-weight="bold" font-family="'SF Mono','Fira Code',monospace" filter="url(#glow)">FLEX</text>
  <text x="78" y="36" fill="${c.textDim}" font-size="13" font-family="'SF Mono','Fira Code',monospace">${escXml(repoName)} \u2022 ${escXml(periodLabel)}</text>

  <!-- User + Rank -->
  <text x="30" y="82" fill="${c.yellow}" font-size="15" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${escXml(stats.author)}</text>
  <text x="${30 + stats.author.length * 9.5}" y="82" fill="${c.purple}" font-size="13" font-style="italic" font-family="'SF Mono','Fira Code',monospace">  ${rank.icon} ${escXml(rank.title)}</text>

  <!-- Level bar -->
  <text x="30" y="105" fill="${c.textDim}" font-size="11" font-family="'SF Mono','Fira Code',monospace">LVL ${level.level} \u2022 ${escXml(level.name)}</text>
  <rect x="160" y="96" width="120" height="8" rx="4" fill="${c.border}"/>
  <rect x="160" y="96" width="${level.level * 12}" height="8" rx="4" fill="url(#accent)"/>

  <!-- Separator -->
  <rect x="30" y="116" width="${W - 60}" height="1" fill="${c.border}"/>

  <!-- Stats grid -->
  <text x="30" y="142" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">COMMITS</text>
  <text x="30" y="160" fill="${c.text}" font-size="18" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${formatNumber(stats.commits)}</text>

  <text x="140" y="142" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">ADDED</text>
  <text x="140" y="160" fill="${c.green}" font-size="18" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">+${formatNumber(stats.added)}</text>

  <text x="250" y="142" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">REMOVED</text>
  <text x="250" y="160" fill="${c.red}" font-size="18" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">-${formatNumber(stats.removed)}</text>

  <text x="370" y="142" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">FILES</text>
  <text x="370" y="160" fill="${c.text}" font-size="18" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${formatNumber(stats.filesCount)}</text>

  <!-- Row 2 -->
  <text x="30" y="195" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">PEAK HOUR</text>
  <text x="30" y="213" fill="${c.text}" font-size="14" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${formatHour(stats.peakHour)}</text>

  <text x="140" y="195" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">STREAK</text>
  <text x="140" y="213" fill="${c.yellow}" font-size="14" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${streakData.current}d \u{1F525}</text>

  <text x="250" y="195" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">BEST STREAK</text>
  <text x="250" y="213" fill="${c.text}" font-size="14" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${streakData.longest}d</text>

  <text x="370" y="195" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">NET LINES</text>
  <text x="370" y="213" fill="${stats.net >= 0 ? c.green : c.red}" font-size="14" font-weight="bold" font-family="'SF Mono','Fira Code',monospace">${stats.net >= 0 ? '+' : ''}${formatNumber(stats.net)}</text>

  <!-- Highlights -->
  ${highlights.map((h, i) => `<text x="30" y="${250 + i * 18}" fill="${c.yellow}" font-size="11" font-style="italic" font-family="'SF Mono','Fira Code',monospace">&gt; ${escXml(h)}</text>`).join('\n  ')}

  <!-- Language bars -->
  ${langBars}
  ${langLabels}

  <!-- Activity sparkline -->
  <text x="30" y="340" fill="${c.textDim}" font-size="10" font-family="'SF Mono','Fira Code',monospace">ACTIVITY BY HOUR</text>
  ${sparkline}

  <!-- Footer -->
  <text x="${W - 30}" y="${H - 12}" fill="${c.textDim}" font-size="9" text-anchor="end" font-family="'SF Mono','Fira Code',monospace">generated by flex</text>
</svg>`;
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncPath(p, max) {
  if (p.length <= max) return p;
  return '...' + p.slice(-(max - 3));
}

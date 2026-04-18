import { formatHour, formatNumber } from './stats.js';
import { getRank, getLevel } from './rank.js';
import { getHighlights } from './highlights.js';

const DARK = {
  bg1: '#0d1117', bg2: '#161b22', border: '#30363d',
  text: '#e6edf3', textDim: '#7d8590', accent: '#58a6ff',
  green: '#3fb950', red: '#f85149', yellow: '#d29922',
  purple: '#bc8cff', grad1: '#0d1117', grad2: '#161b22',
};

const MIDNIGHT = {
  bg1: '#09090b', bg2: '#18181b', border: '#27272a',
  text: '#f4f4f5', textDim: '#71717a', accent: '#10b981',
  green: '#22c55e', red: '#ef4444', yellow: '#eab308',
  purple: '#a855f7', grad1: '#09090b', grad2: '#18181b',
};

const LIGHT = {
  bg1: '#ffffff', bg2: '#f6f8fa', border: '#d0d7de',
  text: '#1f2328', textDim: '#656d76', accent: '#0969da',
  green: '#1a7f37', red: '#cf222e', yellow: '#9a6700',
  purple: '#8250df', grad1: '#ffffff', grad2: '#f6f8fa',
};

export function generateSVG(stats, streakData, repoName, periodLabel, theme = 'dark') {
  const c = theme === 'light' ? LIGHT : theme === 'midnight' ? MIDNIGHT : DARK;
  const rank = getRank(stats, streakData);
  const level = getLevel(stats.commits);
  const highlights = getHighlights(stats, streakData);
  const W = 480;
  const F = `font-family="'SF Mono','Fira Code',monospace"`;

  // Dynamic Y layout — each section pushes cursor down
  let y = 0;

  // Header: 0-54
  y = 54;

  // User + rank + level: 55-116
  y = 116;

  // Stats grid row 1: values at y+26, y+44
  const statsY = y + 10;    // 126 — labels
  const statsValY = statsY + 18; // 144 — values

  // Stats grid row 2
  const stats2Y = statsValY + 25;    // 169 — labels
  const stats2ValY = stats2Y + 18;   // 187 — values

  // Highlights
  y = stats2ValY + 20; // 207
  const hlY = y;

  // Language section
  y = hlY + highlights.length * 18 + 14;
  const langTitleY = y;
  const langBarY = y + 14;
  const langLabelY = langBarY + 20;

  // Sparkline section
  y = langLabelY + 16;
  const sparkTitleY = y;
  const sparkBaseY = sparkTitleY + 50;

  // Footer
  const footerY = sparkBaseY + 20;
  const H = footerY + 10;

  // Build language bars
  let langBars = '';
  let langLabels = '';
  let xOffset = 30;
  const barW = W - 60;
  const langs = stats.languages.slice(0, 6);
  const langColors = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#79c0ff'];
  for (let i = 0; i < langs.length; i++) {
    const lang = langs[i];
    const w = Math.max(2, (lang.pct / 100) * barW);
    langBars += `<rect x="${xOffset}" y="${langBarY}" width="${w}" height="8" rx="2" fill="${langColors[i % langColors.length]}"/>`;
    if (lang.pct >= 8) {
      langLabels += `<text x="${xOffset + w / 2}" y="${langLabelY}" fill="${c.textDim}" font-size="10" text-anchor="middle" ${F}>${lang.name} ${lang.pct}%</text>`;
    }
    xOffset += w + 2;
  }

  // Build sparkline
  const maxHour = Math.max(...stats.hourCounts, 1);
  let sparkline = '';
  const sparkH = 40;
  for (let i = 0; i < 24; i++) {
    const h = (stats.hourCounts[i] / maxHour) * sparkH;
    const x = 30 + i * ((W - 60) / 24);
    sparkline += `<rect x="${x}" y="${sparkBaseY - h}" width="${(W - 60) / 24 - 1}" height="${h}" rx="1" fill="${c.accent}" opacity="0.6"/>`;
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

  <!-- Header -->
  <rect x="0" y="54" width="${W}" height="1" fill="${c.border}"/>
  <text x="30" y="36" fill="${c.accent}" font-size="16" font-weight="bold" ${F} filter="url(#glow)">FLEX</text>
  <text x="78" y="36" fill="${c.textDim}" font-size="13" ${F}>${escXml(repoName)} \u2022 ${escXml(periodLabel)}</text>

  <!-- User + Rank -->
  <text x="30" y="82" fill="${c.yellow}" font-size="15" font-weight="bold" ${F}>${escXml(stats.author)}</text>
  <text x="${30 + stats.author.length * 9.5}" y="82" fill="${c.purple}" font-size="13" font-style="italic" ${F}>  ${rank.icon} ${escXml(rank.title)}</text>

  <!-- Level bar -->
  <text x="30" y="105" fill="${c.textDim}" font-size="11" ${F}>LVL ${level.level} \u2022 ${escXml(level.name)}</text>
  <rect x="160" y="96" width="120" height="8" rx="4" fill="${c.border}"/>
  <rect x="160" y="96" width="${level.level * 12}" height="8" rx="4" fill="url(#accent)"/>

  <!-- Separator -->
  <rect x="30" y="116" width="${W - 60}" height="1" fill="${c.border}"/>

  <!-- Stats row 1 -->
  <text x="30" y="${statsY}" fill="${c.textDim}" font-size="10" ${F}>COMMITS</text>
  <text x="30" y="${statsValY}" fill="${c.text}" font-size="18" font-weight="bold" ${F}>${formatNumber(stats.commits)}</text>

  <text x="140" y="${statsY}" fill="${c.textDim}" font-size="10" ${F}>ADDED</text>
  <text x="140" y="${statsValY}" fill="${c.green}" font-size="18" font-weight="bold" ${F}>+${formatNumber(stats.added)}</text>

  <text x="250" y="${statsY}" fill="${c.textDim}" font-size="10" ${F}>REMOVED</text>
  <text x="250" y="${statsValY}" fill="${c.red}" font-size="18" font-weight="bold" ${F}>-${formatNumber(stats.removed)}</text>

  <text x="370" y="${statsY}" fill="${c.textDim}" font-size="10" ${F}>FILES</text>
  <text x="370" y="${statsValY}" fill="${c.text}" font-size="18" font-weight="bold" ${F}>${formatNumber(stats.filesCount)}</text>

  <!-- Stats row 2 -->
  <text x="30" y="${stats2Y}" fill="${c.textDim}" font-size="10" ${F}>PEAK HOUR</text>
  <text x="30" y="${stats2ValY}" fill="${c.text}" font-size="14" font-weight="bold" ${F}>${formatHour(stats.peakHour)}</text>

  <text x="140" y="${stats2Y}" fill="${c.textDim}" font-size="10" ${F}>STREAK</text>
  <text x="140" y="${stats2ValY}" fill="${c.yellow}" font-size="14" font-weight="bold" ${F}>${streakData.current}d \u{1F525}</text>

  <text x="250" y="${stats2Y}" fill="${c.textDim}" font-size="10" ${F}>TOP STREAK</text>
  <text x="250" y="${stats2ValY}" fill="${c.text}" font-size="14" font-weight="bold" ${F}>${streakData.longest}d</text>

  <text x="370" y="${stats2Y}" fill="${c.textDim}" font-size="10" ${F}>NET LINES</text>
  <text x="370" y="${stats2ValY}" fill="${stats.net >= 0 ? c.green : c.red}" font-size="14" font-weight="bold" ${F}>${stats.net >= 0 ? '+' : ''}${formatNumber(stats.net)}</text>

  <!-- Highlights -->
  ${highlights.map((h, i) => `<text x="30" y="${hlY + i * 18}" fill="${c.yellow}" font-size="11" font-style="italic" ${F}>&gt; ${escXml(h)}</text>`).join('\n  ')}

  <!-- Languages -->
  <text x="30" y="${langTitleY}" fill="${c.textDim}" font-size="10" ${F}>LANGUAGES</text>
  ${langBars}
  ${langLabels}

  <!-- Activity sparkline -->
  <text x="30" y="${sparkTitleY}" fill="${c.textDim}" font-size="10" ${F}>ACTIVITY BY HOUR</text>
  ${sparkline}

  <!-- Footer -->
  <text x="${W - 30}" y="${footerY}" fill="${c.textDim}" font-size="9" text-anchor="end" ${F}>generated by git-flex</text>
</svg>`;
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

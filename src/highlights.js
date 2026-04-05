export function getHighlights(stats, streakData) {
  const pool = [];
  const commits = stats.commitData || [];

  // === TIME PATTERNS ===

  // Biggest single day
  const dayMap = {};
  for (const c of commits) {
    const d = c.date.slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + 1;
  }
  const biggestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  if (biggestDay && biggestDay[1] >= 3) {
    const d = new Date(biggestDay[0]);
    const month = d.toLocaleString('en', { month: 'short' });
    const day = d.getDate();
    pool.push({ text: `${biggestDay[1]} commits on ${month} ${day} — absolute machine`, weight: biggestDay[1] });
  }

  // Weekend commits
  const weekendCommits = commits.filter(c => {
    const day = new Date(c.date).getDay();
    return day === 0 || day === 6;
  });
  if (weekendCommits.length >= 10) {
    pool.push({ text: `${weekendCommits.length} weekend commits... touch grass`, weight: 6 });
  } else if (weekendCommits.length >= 3) {
    pool.push({ text: `${weekendCommits.length} weekend commits — no rest for the goated`, weight: 3 });
  }
  if (weekendCommits.length === 0 && commits.length >= 20) {
    pool.push({ text: `Zero weekend commits — work-life balance king`, weight: 4 });
  }

  // Late night
  const lateNight = commits.filter(c => {
    const h = new Date(c.date).getHours();
    return h >= 0 && h < 5;
  });
  if (lateNight.length >= 5) {
    pool.push({ text: `${lateNight.length} commits between midnight and 5 AM... you okay?`, weight: 5 });
  } else if (lateNight.length >= 1) {
    pool.push({ text: `Caught coding at ${new Date(lateNight[0].date).getHours() || 12} AM — sus`, weight: 2 });
  }

  // Early bird
  const earlyBird = commits.filter(c => {
    const h = new Date(c.date).getHours();
    return h >= 5 && h < 7;
  });
  if (earlyBird.length >= 10) {
    pool.push({ text: `${earlyBird.length} commits before 7 AM — wakes up and ships`, weight: 5 });
  }

  // Friday afternoon shipper
  const fridayPM = commits.filter(c => {
    const d = new Date(c.date);
    return d.getDay() === 5 && d.getHours() >= 15;
  });
  if (fridayPM.length >= 5) {
    pool.push({ text: `${fridayPM.length} Friday afternoon deploys — lives dangerously`, weight: 6 });
  } else if (fridayPM.length >= 1) {
    pool.push({ text: `Pushed on a Friday afternoon at least once — bold`, weight: 3 });
  }

  // Monday morning warrior
  const mondayAM = commits.filter(c => {
    const d = new Date(c.date);
    return d.getDay() === 1 && d.getHours() < 10;
  });
  if (mondayAM.length >= 10) {
    pool.push({ text: `${mondayAM.length} Monday morning commits — hits the ground running`, weight: 4 });
  }

  // === VOLUME & IMPACT ===

  // Deletion king
  if (stats.removed > stats.added && stats.removed > 100) {
    pool.push({ text: `Deleted more than you wrote — mass cleanup arc`, weight: 7 });
  }

  // Ratio flex
  if (stats.added > 0 && stats.removed > 0) {
    const ratio = stats.removed / stats.added;
    if (ratio > 0.8 && ratio < 1.0) {
      pool.push({ text: `Removes almost as much as they add — clean coder`, weight: 4 });
    }
  }

  // Massive net additions
  if (stats.net > 50000) {
    pool.push({ text: `+${fmt(stats.net)} net lines — entire features in one go`, weight: 7 });
  } else if (stats.net > 10000) {
    pool.push({ text: `+${fmt(stats.net)} net lines — built a whole codebase`, weight: 6 });
  } else if (stats.net > 1000) {
    pool.push({ text: `+${fmt(stats.net)} net lines — shipping machine`, weight: 4 });
  }

  // Files touched
  if (stats.filesCount >= 500) {
    pool.push({ text: `Touched ${fmt(stats.filesCount)} files — knows every corner of this repo`, weight: 5 });
  } else if (stats.filesCount >= 100) {
    pool.push({ text: `${stats.filesCount} files touched — gets around`, weight: 3 });
  }

  // Commit volume
  if (stats.commits >= 1000) {
    pool.push({ text: `${fmt(stats.commits)} commits — this repo is basically yours`, weight: 7 });
  } else if (stats.commits >= 500) {
    pool.push({ text: `${fmt(stats.commits)} commits — major contributor energy`, weight: 5 });
  } else if (stats.commits >= 100) {
    pool.push({ text: `${stats.commits} commits — putting in the reps`, weight: 3 });
  }

  // Avg commits per active day
  const activeDays = Object.keys(dayMap).length;
  if (activeDays > 0) {
    const avgPerDay = stats.commits / activeDays;
    if (avgPerDay >= 5) {
      pool.push({ text: `${avgPerDay.toFixed(1)} commits/day avg — rapid fire`, weight: 5 });
    } else if (avgPerDay >= 3) {
      pool.push({ text: `${avgPerDay.toFixed(1)} commits/day avg — consistent output`, weight: 3 });
    }
  }

  // Active days
  if (activeDays >= 200) {
    pool.push({ text: `Active ${activeDays} days — basically lives here`, weight: 6 });
  } else if (activeDays >= 100) {
    pool.push({ text: `Active ${activeDays} days — showed up and shipped`, weight: 5 });
  } else if (activeDays >= 30) {
    pool.push({ text: `${activeDays} active days — locked in for a month+`, weight: 3 });
  }

  // === LANGUAGE ===

  if (stats.languages.length && stats.languages[0].pct >= 80) {
    const lang = stats.languages[0].name;
    const quips = {
      Python: `${stats.languages[0].pct}% Python — basically a snake at this point`,
      TypeScript: `${stats.languages[0].pct}% TypeScript — type safety is a lifestyle`,
      JavaScript: `${stats.languages[0].pct}% JavaScript — any% type coercion run`,
      Rust: `${stats.languages[0].pct}% Rust — zero bugs, maximum suffering`,
      Go: `${stats.languages[0].pct}% Go — if err != nil { respect++ }`,
      Ruby: `${stats.languages[0].pct}% Ruby — a person of culture`,
      Java: `${stats.languages[0].pct}% Java — AbstractFactoryBeanProxyManager`,
      'C++': `${stats.languages[0].pct}% C++ — dangerously close to the metal`,
      C: `${stats.languages[0].pct}% C — talks directly to the CPU`,
      'C#': `${stats.languages[0].pct}% C# — Unity dev or enterprise warrior`,
      PHP: `${stats.languages[0].pct}% PHP — and proud of it, apparently`,
      Swift: `${stats.languages[0].pct}% Swift — Apple ecosystem locked in`,
      Kotlin: `${stats.languages[0].pct}% Kotlin — modern Android royalty`,
      Shell: `${stats.languages[0].pct}% Shell — automates everything`,
      Dart: `${stats.languages[0].pct}% Dart — Flutter gang`,
      Vue: `${stats.languages[0].pct}% Vue — the progressive framework enjoyer`,
      Svelte: `${stats.languages[0].pct}% Svelte — no virtual DOM, no problem`,
      Elixir: `${stats.languages[0].pct}% Elixir — functional and proud`,
      Haskell: `${stats.languages[0].pct}% Haskell — a monad is just a monoid in the...`,
      Lua: `${stats.languages[0].pct}% Lua — Neovim config or game dev, no in between`,
      Zig: `${stats.languages[0].pct}% Zig — the chosen one`,
      Scala: `${stats.languages[0].pct}% Scala — functional OOP hybrid enjoyer`,
    };
    pool.push({ text: quips[lang] || `${stats.languages[0].pct}% ${lang} — fully locked in`, weight: 5 });
  } else if (stats.languages.length >= 6) {
    pool.push({ text: `${stats.languages.length} languages — full-stack doesn't even cover it`, weight: 5 });
  } else if (stats.languages.length >= 4) {
    pool.push({ text: `${stats.languages.length} languages — polyglot mode activated`, weight: 4 });
  }

  // Frontend/backend detection
  const langNames = stats.languages.map(l => l.name.toLowerCase());
  const hasFrontend = langNames.some(l => ['react tsx', 'react jsx', 'vue', 'svelte', 'css', 'scss', 'html'].includes(l));
  const hasBackend = langNames.some(l => ['python', 'go', 'rust', 'java', 'ruby', 'c#', 'elixir'].includes(l));
  if (hasFrontend && hasBackend) {
    pool.push({ text: `Frontend and backend — true full-stack`, weight: 4 });
  }

  // === STREAKS ===

  if (streakData.current >= 60) {
    pool.push({ text: `${streakData.current}-day streak — this is discipline`, weight: 9 });
  } else if (streakData.current >= 30) {
    pool.push({ text: `${streakData.current}-day streak — at this point it's a lifestyle`, weight: 8 });
  } else if (streakData.current >= 14) {
    pool.push({ text: `${streakData.current}-day streak — two weeks of pure lock-in`, weight: 6 });
  } else if (streakData.current >= 7) {
    pool.push({ text: `${streakData.current}-day streak and counting`, weight: 4 });
  }
  if (streakData.longest >= 60 && streakData.longest > streakData.current) {
    pool.push({ text: `Once went ${streakData.longest} days straight — legendary run`, weight: 6 });
  } else if (streakData.longest >= 30 && streakData.longest > streakData.current) {
    pool.push({ text: `${streakData.longest}-day best streak — the grind was real`, weight: 5 });
  }
  if (streakData.current === 0 && streakData.longest >= 7) {
    pool.push({ text: `Streak broken — redemption arc starts now`, weight: 3 });
  }

  // === COMMIT MESSAGE PATTERNS ===

  const messages = commits.map(c => c.message.toLowerCase());

  const fixes = messages.filter(m => /fix|bug|patch|hotfix/i.test(m));
  if (fixes.length >= 50) {
    pool.push({ text: `${fixes.length} bug fixes — born to debug`, weight: 5 });
  } else if (fixes.length >= 20) {
    pool.push({ text: `${fixes.length} bug fixes — the exterminator`, weight: 4 });
  }

  const refactors = messages.filter(m => /refactor|clean|restructure/i.test(m));
  if (refactors.length >= 20) {
    pool.push({ text: `${refactors.length} refactors — the codebase whisperer`, weight: 5 });
  } else if (refactors.length >= 10) {
    pool.push({ text: `${refactors.length} refactors — leaves it better than they found it`, weight: 4 });
  }

  const feats = messages.filter(m => /feat|feature|add|implement|new/i.test(m));
  if (feats.length >= 50) {
    pool.push({ text: `${feats.length} features shipped — product team's best friend`, weight: 5 });
  } else if (feats.length >= 20) {
    pool.push({ text: `${feats.length} features shipped — builder mentality`, weight: 4 });
  }

  const wip = messages.filter(m => /wip|work in progress|tmp|todo|hack/i.test(m));
  if (wip.length >= 10) {
    pool.push({ text: `${wip.length} WIP commits — moves fast, cleans up later`, weight: 3 });
  }

  const yolo = messages.filter(m => /yolo|lol|oops|forgot|ugh|fml|fuck|shit/i.test(m));
  if (yolo.length >= 5) {
    pool.push({ text: `${yolo.length} "oops" commits — keeping it real`, weight: 4 });
  } else if (yolo.length >= 1) {
    pool.push({ text: `At least one commit message they regret`, weight: 2 });
  }

  const initials = messages.filter(m => /^initial|^first|^init|^bootstrap|^setup/i.test(m));
  if (initials.length >= 3) {
    pool.push({ text: `${initials.length} repos bootstrapped — serial project starter`, weight: 4 });
  }

  // One-word commit messages
  const oneWord = messages.filter(m => !m.includes(' '));
  if (oneWord.length >= 10) {
    pool.push({ text: `${oneWord.length} one-word commit messages — a person of few words`, weight: 3 });
  }

  // Long commit messages (verbose)
  const verbose = messages.filter(m => m.length > 100);
  if (verbose.length >= 10) {
    pool.push({ text: `${verbose.length} commit essays — believes in documentation`, weight: 3 });
  }

  // === PEAK HOUR PERSONALITY ===

  const { peakHour } = stats;
  if (peakHour >= 5 && peakHour <= 7) {
    pool.push({ text: `Peak hour: ${fmtHour(peakHour)} — codes before the sun`, weight: 3 });
  } else if (peakHour >= 22 || peakHour <= 2) {
    pool.push({ text: `Peak hour: ${fmtHour(peakHour)} — nocturnal programmer`, weight: 3 });
  } else if (peakHour >= 12 && peakHour <= 13) {
    pool.push({ text: `Peak hour: ${fmtHour(peakHour)} — lunch break diff machine`, weight: 3 });
  } else if (peakHour >= 9 && peakHour <= 10) {
    pool.push({ text: `Peak hour: ${fmtHour(peakHour)} — standup then straight to shipping`, weight: 3 });
  } else if (peakHour >= 14 && peakHour <= 16) {
    pool.push({ text: `Peak hour: ${fmtHour(peakHour)} — afternoon flow state`, weight: 3 });
  }

  // === FUN COMBOS ===

  // Bus factor warning
  if (stats.commits >= 500 && stats.filesCount >= 200) {
    pool.push({ text: `If you leave, this repo is cooked`, weight: 6 });
  }

  // Micro-committer
  if (stats.commits > 0 && stats.added / stats.commits < 10) {
    pool.push({ text: `${(stats.added / stats.commits).toFixed(1)} lines/commit avg — atomic commits gang`, weight: 3 });
  }

  // Mega-committer
  if (stats.commits > 0 && stats.added / stats.commits > 200) {
    pool.push({ text: `${Math.round(stats.added / stats.commits)} lines/commit avg — go big or go home`, weight: 4 });
  }

  // Sort by weight, pick top 3
  pool.sort((a, b) => b.weight - a.weight);
  return pool.slice(0, 3).map(h => h.text);
}

function fmt(n) {
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function fmtHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

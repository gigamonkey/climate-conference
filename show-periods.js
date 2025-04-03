#!/usr/bin/env node

import { dumpJSON, loadJSON } from './file-util.js';
import { argv } from 'process';
import { mapValues } from './util.js';

const BAD = '❌';
const GOOD = '✅';
const OK = '🆗';

const { entries, groupBy, keys } = Object;

const data = await loadJSON(argv[2]);

const emoji = (assigned, ideal, minimum, maximum) => {
  if (assigned === ideal) {
    return GOOD;
  } else {
    return minimum <= assigned && assigned <= maximum ? OK : BAD;
  }
};

const all = entries(data.stats).flatMap(([workshop, { limits, periods }]) => {
  return entries(periods).map(([period, assigned]) => {
    return { workshop, period, assigned, limits }
  });
});


const byPeriod = mapValues(groupBy(all, x => x.period), items => mapValues(groupBy(items, x => x.workshop), x => x[0]));

keys(byPeriod).toSorted().forEach(p => {
  console.log(`\nPeriod ${p}`);
  const workshops = byPeriod[p];
  keys(workshops).toSorted().forEach(w => {
    const { assigned, limits } = workshops[w];
    const { ideal, minimum, maximum } = limits;
    let delta = assigned - ideal;
    if (delta > 0) delta = '+' + delta;
    else if (delta === 0) delta = '--';
    const sym = emoji(assigned, ideal, minimum, maximum);
    console.log(`  ${sym} [${delta}] ${w} (${minimum}/${ideal}/${maximum}) assigned: ${assigned}`);
  });
});

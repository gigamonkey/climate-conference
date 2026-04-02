#!/usr/bin/env node

import { loadJSON } from './file-util.js';
import { Command } from 'commander';
import { mapValues } from './util.js';

const BAD = '❌';
const GOOD = '✅';
const OK = '🆗';

const { entries, groupBy, keys } = Object;

const emoji = (assigned, ideal, minimum, maximum) => {
  if (assigned === ideal) {
    return GOOD;
  } else {
    return minimum <= assigned && assigned <= maximum ? OK : BAD;
  }
};

const main = async (jsonFile) => {
  const data = await loadJSON(jsonFile);

  const all = entries(data.stats).map(([workshopId, { workshop, location, limits, assigned }]) => {
    return { workshop, location, period: limits.period, assigned, limits };
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
};

new Command()
  .name('show-periods')
  .description('Show workshop assignments grouped by period from a GA result JSON')
  .argument('<json-file>', 'path to the GA result JSON file')
  .action(main)
  .parse();

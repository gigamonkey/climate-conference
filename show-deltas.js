#!/usr/bin/env node

import { loadJSON } from './file-util.js';
import { Command } from 'commander';

const BAD = '❌';
const GOOD = '✅';
const OK = '🆗';

const { entries } = Object;

const emoji = (assigned, ideal, minimum, maximum) => {
  if (assigned === ideal) {
    return GOOD;
  } else {
    return minimum <= assigned && assigned <= maximum ? OK : BAD;
  }
};

const main = async (jsonFile) => {
  const data = await loadJSON(jsonFile);

  entries(data.stats).forEach(([workshopId, { workshop, location, limits, assigned }]) => {
    const { minimum, ideal, maximum } = limits;
    const delta = assigned - ideal;
    const sym = emoji(assigned, ideal, minimum, maximum);
    const loc = location ? ` [${location}]` : '';
    console.log(`${sym} ${workshop}${loc}: ${assigned} (${delta >= 0 ? '+' : ''}${delta}) [${minimum}/${ideal}/${maximum}]`);
  });
};

new Command()
  .name('show-deltas')
  .description('Show workshop enrollment deltas from a GA result JSON')
  .argument('<json-file>', 'path to the GA result JSON file')
  .action(main)
  .parse();

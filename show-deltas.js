#!/usr/bin/env node

import { dumpJSON, loadJSON } from './file-util.js';
import { argv } from 'process';

const BAD = '❌';
const GOOD = '✅';
const OK = '🆗';

const { entries } = Object;

const data = await loadJSON(argv[2]);

const emoji = (assigned, ideal, minimum, maximum) => {
  if (assigned === ideal) {
    return GOOD;
  } else {
    return minimum <= assigned && assigned <= maximum ? OK : BAD;
  }
};


entries(data.stats).forEach(([workshopId, { workshop, location, limits, assigned }]) => {
  const { minimum, ideal, maximum } = limits;
  const delta = assigned - ideal;
  const sym = emoji(assigned, ideal, minimum, maximum);
  const loc = location ? ` [${location}]` : '';
  console.log(`${sym} ${workshop}${loc}: ${assigned} (${delta >= 0 ? '+' : ''}${delta}) [${minimum}/${ideal}/${maximum}]`);
});

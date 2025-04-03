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


entries(data.stats).forEach(([workshop, { limits, periods }]) => {
  const { minimum, ideal, maximum } = limits;
  console.log(`${workshop}: min: ${minimum}; ideal: ${ideal}; maximum: ${maximum}`);
  entries(periods).forEach(([p, assigned]) => {
    const delta = assigned - ideal;
    const sym = emoji(assigned, ideal, minimum, maximum)
    console.log(`  ${sym} Period ${p} - ${assigned} (${delta}) [${workshop} ${minimum}/${ideal}/${maximum}]`);
  });
});

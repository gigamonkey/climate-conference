#!/usr/bin/env node

import { dumpJSON, loadJSON } from './file-util.js';
import { argv } from 'process';

const BAD = '❌';
const GOOD = '✅';
const OK = '🆗';

const { entries } = Object;

const data = await loadJSON(argv[2]);

const emoji = (n, ideal, minimum, maximum) => {
  if (n === ideal) {
    return GOOD;
  } else {
    return minimum <= n && n <= maximum ? OK : BAD;
  }
};


entries(data.stats).forEach(([workshop, { limits, periods }]) => {
  const { minimum, ideal, maximum } = limits;
  console.log(`${workshop}: min: ${minimum}; ideal: ${ideal}; maximum: ${maximum}`);
  entries(periods).forEach(([p, n]) => {
    const delta = n - ideal;
    const sym = emoji(n, ideal, minimum, maximum)
    console.log(`  ${sym} Period ${p} - ${n} (${delta})`);
  });
});

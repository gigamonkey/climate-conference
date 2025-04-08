#!/usr/bin/env node

import { dumpJSON, loadJSON } from './file-util.js';
import { argv } from 'process';

const { entries } = Object;

const data = await loadJSON(argv[2]);

data.dna.forEach(({email, periods}) => {
  entries(periods).forEach(([period, workshop]) => {
    console.log([email, period, workshop].join("\t"));
  });
});

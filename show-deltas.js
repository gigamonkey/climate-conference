#!/usr/bin/env node

import { dumpJSON, loadJSON } from './file-util.js';
import { argv } from 'process';

const data = await loadJSON(argv[2]);

data.stats.forEach(({name, assigned, ideal}) => {
  console.log([name, assigned, ideal, assigned - ideal].join('\t'));
});

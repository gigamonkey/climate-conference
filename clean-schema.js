#!/usr/bin/env node

import { loadCSV } from './file-util.js'
import { argv } from 'process';

const data = await loadCSV(argv[2], {})

data[0].forEach(x => {
  x = x.toLowerCase();
  x = x.replace(/\s+/g, '_');
  x = x.replace(/\W+/g, '');
  console.log(x);
});

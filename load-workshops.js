#!/usr/bin/env node

// Load information about workshops from the two spreadsheet exports.

import { DB } from 'pugsql';
import { argv } from 'process';
import { loadCSV } from './file-util.js'

const db = new DB(argv[2]).addQueries('pugly.sql');

const periods = Array.from({length: 6}, (_, i) => `p${i + 1}`);

const singlePeriod = await loadCSV(argv[3], {
  columns: [ 'workshop', ...periods, 'minimum', 'maximum', 'ideal', 'ignore' ],
  from_line: 2,
  trim: true,
});

const multiPeriod = await loadCSV(argv[4], {
  columns: [ 'workshop', 'periods', 'minimum', 'maximum', 'ideal', 'ignore' ],
  from_line: 2,
  trim: true,
});

singlePeriod.forEach(x => {
  periods.forEach((p, i) => {
    if (x[p] === 'TRUE') {
      db.makeWorkshop({...x, period: i + 1, duration: 1 })
    }
  });
});

multiPeriod.forEach(x => {
  const { periods } = x;
  const segments = periods.trim().split(/,\s+/);
  segments.forEach(s => {
    const [ start, end ] = s.split('-');
    db.makeWorkshop({...x, period: start, duration: (end - start) + 1  })
  });
});

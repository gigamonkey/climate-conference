#!/usr/bin/env node

// Load workshops from the raw_workshops table into the workshops table,
// expanding the comma-delimited periods column into individual rows.

import { DB } from 'pugsql';
import { Command } from 'commander';

const program = new Command();
program
  .name('load-workshops')
  .description('Load workshops from raw_workshops into the workshops table')
  .argument('<database>', 'path to the SQLite database')
  .parse();

const db = new DB(program.args[0]).addQueries('pugly.sql');

const rows = db.rawWorkshops();

for (const { workshop, location, periods, minimum, maximum, ideal } of rows) {
  for (const segment of periods.split(',').map(s => s.trim())) {
    const parts = segment.split('-');
    if (parts.length === 1) {
      // Single period, e.g. "3"
      const period = Number(parts[0]);
      db.makeWorkshop({ workshop, location, period, duration: 1, minimum, maximum, ideal });
    } else {
      // Inclusive range, e.g. "1-3" means periods 1, 2, and 3
      const start = Number(parts[0]);
      const end = Number(parts[1]);
      db.makeWorkshop({ workshop, location, period: start, duration: (end - start) + 1, minimum, maximum, ideal });
    }
  }
}

#!/usr/bin/env node

// Compare workshop names between the spreadsheet and the form.
// Must be run after the database is fully built (make all).

import 'dotenv/config';
import { DB } from 'pugsql';
import { Command } from 'commander';

const main = (database) => {
  const db = new DB(database).addQueries('queries.sql');

  const spreadsheet = new Set(db.workshopsFromSpreadsheet());
  const form = new Set(db.workshopsFromForm());

  const onlyInSpreadsheet = [...spreadsheet].filter(w => !form.has(w)).sort();
  const onlyInForm = [...form].filter(w => !spreadsheet.has(w)).sort();

  if (onlyInSpreadsheet.length === 0 && onlyInForm.length === 0) {
    console.log('All workshop names match.');
  } else {
    if (onlyInSpreadsheet.length > 0) {
      console.log(`In spreadsheet but not in form (${onlyInSpreadsheet.length}):`);
      onlyInSpreadsheet.forEach(w => console.log(`  ${w}`));
    }
    if (onlyInForm.length > 0) {
      console.log(`In form but not in spreadsheet (${onlyInForm.length}):`);
      onlyInForm.forEach(w => console.log(`  ${w}`));
    }
  }
};

new Command()
  .name('match-workshops')
  .description('Compare workshop names between spreadsheet and form')
  .argument('[database]', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();

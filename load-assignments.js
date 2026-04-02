#!/usr/bin/env node

// Load assignments from a GA result JSON into the assignments table.

import 'dotenv/config';
import { loadJSON } from './file-util.js';
import { DB } from 'pugsql';
import { Command } from 'commander';

const { entries } = Object;

const main = async (jsonFile, options) => {
  const data = await loadJSON(jsonFile);
  const db = new DB(options.database).addQueries('pugly.sql');

  db.db.exec('delete from assignments');

  data.dna.forEach(({ student_id, periods }) => {
    entries(periods).forEach(([period, { workshop, location }]) => {
      db.insertAssignment({ studentId: student_id, period: Number(period), workshop, location });
    });
  });

  console.log(`Loaded ${data.dna.length} students into assignments table.`);
};

new Command()
  .name('load-assignments')
  .description('Load assignments from a GA result JSON into the database')
  .argument('<json-file>', 'path to the GA result JSON file')
  .option('-d, --database <path>', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();

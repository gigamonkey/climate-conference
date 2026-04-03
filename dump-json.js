#!/usr/bin/env node

import 'dotenv/config';
import { dumpJSON } from './file-util.js';
import { DB } from 'pugsql';
import { Command } from 'commander';

const { groupBy, entries, fromEntries } = Object;

const mapValues = (obj, fn) => fromEntries(entries(obj).map(([k, v]) => [k, fn(v)]));

const main = (database) => {
  const db = new DB(database).addQueries('queries.sql');

  const rows = db.possibilities();
  const byStudent = groupBy(rows, row => row.student_id);
  const byPeriod = mapValues(byStudent, rows => mapValues(groupBy(rows, row => row.period), rows => rows.map(x => x.workshop)));

  dumpJSON(byPeriod);
};

new Command()
  .name('dump-json')
  .description('Dump student possibilities as JSON')
  .argument('[database]', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();

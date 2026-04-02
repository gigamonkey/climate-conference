#!/usr/bin/env node

import 'dotenv/config';
import { dumpJSON } from './file-util.js';
import { DB } from 'pugsql';
import { Command } from 'commander';
import { randomAssignment } from './assignments.js';

const { groupBy, entries, fromEntries } = Object;

const mapValues = (obj, fn) => fromEntries(entries(obj).map(([k, v]) => [k, fn(v, k)]));

const main = (database) => {
  const db = new DB(database).addQueries('queries.sql');

  const periods = mapValues(groupBy(db.periods(), row => row.email), xs => xs.map(x => x.period));
  const choices = mapValues(groupBy(db.possibilities(), row => row.email), xs => xs.map(({email, ...x}) => x));

  const combined = mapValues(choices, (v, k) => {
    const student = {
      periods: periods[k],
      choices: v,
    };
    const randoms = Array.from({length: 10}, () => randomAssignment(student));
    return { ...student, randoms };
  });

  dumpJSON(combined);
};

new Command()
  .name('dump-json2')
  .description('Dump student choices with random assignments as JSON')
  .argument('[database]', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();

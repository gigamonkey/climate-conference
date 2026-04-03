#!/usr/bin/env node

// Dump student assignments as a pivoted TSV table with one row per student
// and columns for each period.

import 'dotenv/config';
import { loadJSON } from './file-util.js';
import { DB } from 'pugsql';
import { Command } from 'commander';

const { entries, fromEntries } = Object;

const main = async (jsonFile, options) => {
  const data = await loadJSON(jsonFile);
  const db = new DB(options.database).addQueries('queries.sql');

  // student_id -> {first_name, last_name, hive}
  const info = fromEntries(db.studentInfo().map(({ student_id, first_name, last_name, hive }) =>
    [student_id, { last_name, first_name, hive }]
  ));

  console.log(['last_name', 'first_name', 'hive', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'].join('\t'));

  // Sort by last name, first name
  const sorted = [...data.dna].sort((a, b) => {
    const ai = info[a.student_id] || {};
    const bi = info[b.student_id] || {};
    return (ai.last_name || '').localeCompare(bi.last_name || '')
      || (ai.first_name || '').localeCompare(bi.first_name || '');
  });

  sorted.forEach(({ student_id, periods }) => {
    const s = info[student_id] || {};
    const row = [
      s.last_name || '',
      s.first_name || '',
      s.hive || '',
    ];
    for (let p = 1; p <= 6; p++) {
      row.push(periods[p]?.workshop || '');
    }
    console.log(row.join('\t'));
  });
};

new Command()
  .name('show-assignments')
  .description('Dump student assignments as a pivoted TSV table')
  .argument('<json-file>', 'path to the GA result JSON file')
  .option('-d, --database <path>', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();

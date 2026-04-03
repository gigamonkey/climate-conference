#!/usr/bin/env node

import { loadJSON } from './file-util.js';
import { Command } from 'commander';

const { entries } = Object;

const main = async (jsonFile) => {
  const data = await loadJSON(jsonFile);

  console.log(['student_id', 'name', 'email', 'period', 'workshop', 'location'].join('\t'));
  data.dna.forEach(({student_id, name, email, periods}) => {
    entries(periods).forEach(([period, { workshop, location }]) => {
      console.log([student_id, name, email, period, workshop, location].join("\t"));
    });
  });
};

new Command()
  .name('dump-assignments')
  .description('Dump assignments from a GA result JSON as TSV')
  .argument('<json-file>', 'path to the GA result JSON file')
  .action(main)
  .parse();

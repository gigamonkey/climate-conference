#!/usr/bin/env node

import { loadCSV } from './file-util.js'
import { Command } from 'commander';

const main = async (csvFile) => {
  const data = await loadCSV(csvFile, {});

  data[0].forEach(x => {
    x = x.toLowerCase();
    x = x.replace(/\s+/g, '_');
    x = x.replace(/\W+/g, '');
    console.log(x);
  });
};

new Command()
  .name('clean-schema')
  .description('Print cleaned column names from a CSV file')
  .argument('<csv-file>', 'path to the CSV file')
  .action(main)
  .parse();

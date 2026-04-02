#!/usr/bin/env node

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { Command } from 'commander';

const main = async (options) => {
  const { columns: showColumns } = options;

  const dataDir = process.env.DATA_DIR;
  if (!dataDir) {
    console.error('DATA_DIR environment variable is not set.');
    process.exit(1);
  }

  // Load input file descriptions
  const inputs = JSON.parse(await readFile('inputs.json', 'utf-8'));

  // Parse raw_ table definitions from schema.sql
  const schema = await readFile('schema.sql', 'utf-8');
  const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(raw_\w+)\s*\(([\s\S]*?)\);/gi;

  const tables = [];
  for (const match of schema.matchAll(tableRegex)) {
    const name = match[1];
    const columns = match[2]
      .split(',')
      .map(col => col.trim().split(/\s+/)[0])
      .filter(Boolean);
    tables.push({ name, columns });
  }

  let exitCode = 0;

  for (const { name, columns } of tables) {
    const csvPath = `${dataDir}/${name}.csv`;
    let data;
    try {
      data = await readFile(csvPath, 'utf-8');
    } catch (e) {
      const source = inputs[name];
      console.error(`MISSING: ${csvPath}` + (source ? ` (source: ${source})` : ''));
      exitCode = 1;
      continue;
    }

    const records = parse(data, { relax_column_count: true });
    if (records.length === 0) {
      console.error(`EMPTY: ${csvPath}`);
      exitCode = 1;
      continue;
    }

    const csvColumns = records[0];
    const csvCount = csvColumns.length;
    const schemaCount = columns.length;

    if (csvCount !== schemaCount) {
      console.error(`MISMATCH: ${name} — schema has ${schemaCount} columns, CSV has ${csvCount}`);
      exitCode = 1;
    } else {
      console.log(`OK: ${name} (${schemaCount} columns)`);
    }

    if (showColumns) {
      const maxLen = Math.max(schemaCount, csvCount);
      const nameWidth = Math.max(...columns.map(c => c.length), 'schema'.length);
      console.log(`  ${'schema'.padEnd(nameWidth)}  csv`);
      for (let i = 0; i < maxLen; i++) {
        const s = (columns[i] || '—').padEnd(nameWidth);
        const c = csvColumns[i] || '—';
        const marker = columns[i] && csvColumns[i] && columns[i] !== csvColumns[i] ? ' *' : '';
        console.log(`  ${s}  ${c}${marker}`);
      }
    }
  }

  process.exit(exitCode);
};

new Command()
  .name('validate-inputs')
  .description('Validate that CSV files match the raw_ table schemas')
  .option('--columns', 'show paired schema and CSV column names')
  .action(main)
  .parse();

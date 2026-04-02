#!/usr/bin/env node

// Ensure every student has a single-period workshop choice for each of their
// available periods, then pad to 10 total choices with random single-period
// workshops.

import 'dotenv/config';
import { DB } from 'pugsql';
import { Command } from 'commander';
import { sample } from './random.js';
import { mapValues } from './util.js';

const { groupBy, entries, fromEntries } = Object;

const main = (database) => {
  const db = new DB(database)
        .addQueries('pugly.sql')
        .addQueries('queries.sql');

  // All single-period workshop names
  const allWorkshopNames = new Set(db.workshopNames());

  // Single-period workshops grouped by period: { period -> Set of workshop names }
  const workshopsByPeriod = mapValues(
    groupBy(db.singlePeriodWorkshops(), r => r.period),
    xs => new Set(xs.map(x => x.workshop))
  );

  // Student periods: { student_id -> [period, ...] }
  const studentPeriods = mapValues(
    groupBy(db.studentPeriods(), r => r.student_id),
    xs => xs.map(x => x.period)
  );

  // Existing choices: { student_id -> Set of workshop names }
  const choices = mapValues(
    groupBy(db.choices(), row => row.student_id),
    xs => new Set(xs.map(x => x.workshop))
  );

  // For each student that needs scheduling, figure out which periods have no
  // single-period workshop choice and add one. Then pad to 10 total.
  db.toSchedule().forEach(studentId => {
    const chosen = choices[studentId] || new Set();
    const periods = studentPeriods[studentId] || [];

    // For each period, check if the student has at least one single-period
    // workshop choice available in that period. If not, add one.
    for (const period of periods) {
      const available = workshopsByPeriod[period];
      if (!available) continue;
      const hasChoiceForPeriod = [...chosen].some(w => available.has(w));
      if (!hasChoiceForPeriod) {
        const candidates = [...available.difference(chosen)];
        if (candidates.length > 0) {
          const workshop = candidates[Math.floor(Math.random() * candidates.length)];
          chosen.add(workshop);
          db.insertChoice({ studentId, workshop, submitted: 0 });
        }
      }
    }

    // Pad remaining slots to 10 with random single-period workshops.
    if (chosen.size < 10) {
      const extra = sample([...allWorkshopNames.difference(chosen)], 10 - chosen.size);
      extra.forEach(workshop => {
        db.insertChoice({ studentId, workshop, submitted: 0 });
      });
    }
  });
};

new Command()
  .name('pad-choices')
  .description('Pad student choices to ensure period coverage and 10 total')
  .argument('[database]', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .action(main)
  .parse();

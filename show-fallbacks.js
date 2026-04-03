#!/usr/bin/env node

// Show students who were assigned workshops they didn't express a preference
// for (fallback assignments). Outputs JSON with details about each affected
// student's assignments and original choices.

import 'dotenv/config';
import { loadJSON, dumpJSON } from './file-util.js';
import { DB } from 'pugsql';
import { Command } from 'commander';

const { entries, groupBy, fromEntries } = Object;

const mapValues = (o, fn) => fromEntries(entries(o).map(([k, v]) => [k, fn(v, k)]));

const main = async (jsonFile, options) => {
  const data = await loadJSON(jsonFile);
  const db = new DB(options.database).addQueries('pugly.sql').addQueries('queries.sql');

  // Submitted choices per student_id: { student_id -> Set of workshop names }
  const submittedChoices = mapValues(
    groupBy(db.choices().filter(c => c.submitted), r => r.student_id),
    xs => new Set(xs.map(x => x.workshop))
  );

  // Submitted choices with period info from all_choices:
  // { student_id -> [{workshop, period, duration, workshop_id}] }
  const choiceDetails = mapValues(
    groupBy(db.possibilities(), r => r.student_id),
    xs => xs.filter(x => submittedChoices[x.student_id]?.has(x.workshop))
      .map(({ email, student_id, ...rest }) => rest)
  );

  const affected = [];

  data.dna.forEach(({ student_id, email, name, periods }) => {
    const submitted = submittedChoices[student_id] || new Set();
    const assignments = entries(periods);
    const fallbacks = assignments.filter(([p, { workshop }]) => !submitted.has(workshop));

    if (fallbacks.length > 0) {
      affected.push({
        student_id,
        email,
        name,
        fallback_periods: fromEntries(fallbacks.map(([p, v]) => [p, v.workshop])),
        all_assignments: fromEntries(assignments.map(([p, v]) => [p, { workshop: v.workshop, submitted: submitted.has(v.workshop) }])),
        submitted_choices: choiceDetails[student_id] || [],
      });
    }
  });

  console.log(`${affected.length} of ${data.dna.length} students have fallback assignments.`);
  console.log(`Total fallback period slots: ${affected.reduce((n, s) => n + entries(s.fallback_periods).length, 0)}`);

  if (options.json) {
    dumpJSON(affected);
  }
};

new Command()
  .name('show-fallbacks')
  .description('Show students assigned to workshops they did not choose')
  .argument('<json-file>', 'path to the GA result JSON file')
  .option('-d, --database <path>', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .option('--json', 'output full details as JSON')
  .action(main)
  .parse();

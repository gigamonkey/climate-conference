#!/usr/bin/env node

// Insert into the database random single-period workshop choices until every
// student has 10.

import { DB } from 'pugsql';
import { argv } from 'process';
import { sample } from './random.js';
import { mapValues } from './util.js';

const { groupBy, entries, fromEntries } = Object;

const db = new DB(argv[2])
      .addQueries('pugly.sql')
      .addQueries('queries.sql');

const workshops = new Set(db.workshopNames());
const choices = mapValues(groupBy(db.choices(), row => row.student_id), xs => new Set(xs.map(({workshop, ...x}) => workshop)));

const randomChoices = (workshops, chosen) => {
  return sample([...workshops.difference(chosen)], 10 - chosen.size);
};

db.toSchedule().forEach(studentId => {
  const chosen = choices[studentId] || new Set();
  if (chosen.size < 10) {
    const extra = chosen.size > 0 ? randomChoices(workshops, chosen) : workshops;
    extra.forEach(workshop => {
      db.insertChoice({ studentId, workshop, submitted: 0 });
    });
  }
});

#!/usr/bin/env node --max_old_space_size=16384

import { dumpJSON, saveJSON } from './file-util.js';
import { DB } from 'pugsql';
import { argv } from 'process';
import { mapValues } from './util.js';
import { WorkshopAssignment } from './workshop-assignment.js';
import { GA, fittest } from './ga.js';
import { mkdirSync, writeFileSync } from 'fs';

const { groupBy, entries, fromEntries } = Object;

const mutationRate = 0.005;

const except = (property) => {
  return (obj) => {
    const { [property]: _, ...rest } = obj;
    return rest;
  };
};

// FIXME: not clear this actually does anything.
const internWorkshopNames = true;

const interned = new Map();

const intern = (s) => {
  if (internWorkshopNames) {
    if (!interned.has(s)) {
      interned.set(s, s);
    }
    return interned.get(s);
  } else {
    return s;
  }
};

const db = new DB(argv[2]).addQueries('queries.sql');

const popSize = Number(argv[3]);
const generations = Number(argv[4]);

// Map of workshop names to limits dicts
const limits = fromEntries(db.limits().map(({workshop, ...limits}) => [ intern(workshop), limits ]));

// Map of student emails to periods that need to be assigned
const periods = mapValues(groupBy(db.periods(), row => row.email), xs => xs.map(x => x.period));

// Map of student email to choices as (period, duration, workshop) objects.
const studentChoices = mapValues(groupBy(db.possibilities(), row => row.email), (choices) => {
  return choices.map(({ email, ...rest }) => {
    rest.workshop = intern(rest.workshop);
    return rest;
  });
});

const students = mapValues(studentChoices, (choices, email) => {
  return {
    email,
    periods: periods[email],
    choices,
  };
});

const start = new Date().toISOString();

const wa = new WorkshopAssignment(limits, students, mutationRate);

const logger = async (g, pop, best) => {
  console.log(`Generation ${g} - best: ${best.fitness}`);
  mkdirSync(`runs/${start}/`, { recursive: true });
  writeFileSync(
    `runs/${start}/g${g}-${popSize}x${generations}.json`,
    JSON.stringify({
      config: {
        g,
        popSize,
        mutationRate,
      },
      ...best,
      stats: wa.stats(best.dna),
    }, null, 2));
};

const ga = new GA(wa, logger);

ga.run(popSize, generations);

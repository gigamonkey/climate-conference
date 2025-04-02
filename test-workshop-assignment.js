#!/usr/bin/env node

import { dumpJSON, saveJSON } from './file-util.js';
import { DB } from 'pugsql';
import { argv } from 'process';
import { mapValues } from './util.js';
import { WorkshopAssignment, countAssignments } from './workshop-assignment.js';
import { GA, fittest } from './ga.js';
import { mkdirSync, writeFileSync } from 'fs';

const { groupBy, entries, fromEntries } = Object;

const except = (property) => {
  return (obj) => {
    const { [property]: _, ...rest } = obj;
    return rest;
  };
};

const db = new DB(argv[2]).addQueries('queries.sql');

const popSize = Number(argv[3]);
const generations = Number(argv[4]);

// Map of workshop name to limits dicts
const limits = fromEntries(db.limits().map(({workshop, ...limits}) => [ workshop, limits ]));

// Map of student email to periods that need to be assigned
const periods = mapValues(groupBy(db.periods(), row => row.email), xs => xs.map(x => x.period));

// Map of student email to choices as (period, duration, workshop) objects.
const studentChoices = mapValues(groupBy(db.possibilities(), row => row.email), xs => xs.map(({email, ...rest}) => rest));

const students = mapValues(studentChoices, (choices, email) => {
  return {
    email,
    periods: periods[email],
    choices,
  };
});

const start = new Date().toISOString();

const logger = async (g, pop) => {
  const best = fittest(pop);
  console.log(`Generation ${g} - best: ${best.fitness}`);
  mkdirSync(`runs/${start}/`, { recursive: true });
  writeFileSync(
    `runs/${start}/g${g}-${popSize}x${generations}.json`,
    JSON.stringify({
      ...best,
      stats: countAssignments(best.dna, limits),
    }, null, 2));
};

const wa = new WorkshopAssignment(limits, students, 0.01);

const ga = new GA(wa, logger);

ga.run(popSize, generations);

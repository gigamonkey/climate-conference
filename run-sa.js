#!/usr/bin/env node --max_old_space_size=16384

import { dumpJSON, saveJSON } from './file-util.js';
import { DB } from 'pugsql';
import { argv } from 'process';
import { mapValues } from './util.js';
import { WorkshopSA } from './workshop-sa.js';
import { GA, fittest } from './ga.js';
import { mkdirSync, writeFileSync } from 'fs';

const { groupBy, entries, fromEntries } = Object;

const mutationRate = 0.005;
//const mutationRate = 1;

const except = (property) => {
  return (obj) => {
    const { [property]: _, ...rest } = obj;
    return rest;
  };
};

const db = new DB(argv[2]).addQueries('queries.sql');

const iterations = Number(argv[3]);

// Map of workshop names to limits dicts
const limits = fromEntries(db.limits().map(({workshop, ...limits}) => [ workshop, limits ]));

// Map of student emails to periods that need to be assigned
const periods = mapValues(groupBy(db.periods(), row => row.email), xs => xs.map(x => x.period));

// Map of student email to choices as (period, duration, workshop) objects.
const studentChoices = mapValues(groupBy(db.possibilities(), row => row.email), (choices) => {
  return choices.map(({ email, ...rest }) => {
    rest.workshop = rest.workshop;
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

const sa = new WorkshopSA(limits, students, mutationRate);

console.log(sa.constraintsBase);


sa.run(1000, iterations);

//sa.test(iterations);

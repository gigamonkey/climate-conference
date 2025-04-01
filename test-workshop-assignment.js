#!/usr/bin/env node

import { dumpJSON } from './file-util.js';
import { DB } from 'pugsql';
import { argv } from 'process';
import { mapValues } from './util.js';
import { WorkshopAssignment } from './workshop-assignment.js';
import { GA, fittest } from './ga.js';

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

const logger = (g, pop) => {
  console.log(`Generation ${g} - best: ${fittest(pop).fitness}`);
};

const wa = new WorkshopAssignment(limits, students, 0.01);

const ga = new GA(wa, logger);

ga.run(popSize, generations);

// const p1 = wa.randomDNA();
// const p2 = wa.randomDNA();

// //wa.foo(p1);

// console.log(wa.fitness(p1));
// console.log(wa.fitness(p2));
// console.log(wa.fitness(wa.cross(p1, p2)));

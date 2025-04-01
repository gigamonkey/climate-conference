#!/usr/bin/env node

import { dumpJSON } from './file-util.js';
import { DB } from 'pugsql';
import { argv } from 'process';
import { randomAssignment } from './assignments.js';

const { groupBy, entries, fromEntries } = Object;

const mapValues = (obj, fn) => fromEntries(entries(obj).map(([k, v]) => [k, fn(v, k)]));

const db = new DB(argv[2]).addQueries('queries.sql');

const periods = mapValues(groupBy(db.periods(), row => row.email), xs => xs.map(x => x.period));
const choices = mapValues(groupBy(db.possibilities(), row => row.email), xs => xs.map(({email, ...x}) => x));


const combined = mapValues(choices, (v, k) => {
  const student = {
    periods: periods[k],
    choices: v,
  };
  const randoms = Array.from({length: 10}, () => randomAssignment(student));
  return { ...student, randoms };
});

dumpJSON(combined);

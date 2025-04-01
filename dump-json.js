#!/usr/bin/env node

import { dumpJSON } from './file-util.js';
import { DB } from 'pugsql';
import { argv } from 'process';

const { groupBy, entries, fromEntries } = Object;

const mapValues = (obj, fn) => fromEntries(entries(obj).map(([k, v]) => [k, fn(v)]));

const db = new DB(argv[2]).addQueries('queries.sql');


const rows = db.possibilities();
const byEmail = groupBy(rows, row => row.email);
const byPeriod = mapValues(byEmail, rows => mapValues(groupBy(rows, row => row.period), rows => rows.map(x => x.workshop)));


dumpJSON(byPeriod);

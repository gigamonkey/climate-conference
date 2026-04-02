#!/usr/bin/env node --max_old_space_size=16384

import 'dotenv/config';
import { dumpJSON, saveJSON } from './file-util.js';
import { DB } from 'pugsql';
import { Command } from 'commander';
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

const main = (database, options) => {
  const popSize = Number(options.population);
  const generations = Number(options.generations);

  const dataDir = process.env.DATA_DIR;
  if (!dataDir) {
    console.error('DATA_DIR environment variable is not set.');
    process.exit(1);
  }

  const db = new DB(database).addQueries('queries.sql');

  const limitsRows = db.limits();

  // Map of workshop_id to limits dicts
  const limits = fromEntries(limitsRows.map(({ workshop_id, workshop, location, ...rest }) => [workshop_id, rest]));

  // Map of workshop_id to workshop name
  const workshopNames = fromEntries(limitsRows.map(({ workshop_id, workshop }) => [workshop_id, intern(workshop)]));

  // Map of workshop_id to location
  const workshopLocations = fromEntries(limitsRows.map(({ workshop_id, location }) => [workshop_id, location]));

  // Map of student emails to periods that need to be assigned
  const periods = mapValues(groupBy(db.periods(), row => row.email), xs => xs.map(x => x.period));

  // Map of email to student_id
  const studentIds = fromEntries(db.periods().map(({ email, student_id }) => [email, student_id]));

  // Map of student email to choices as (period, duration, workshop, workshop_id) objects.
  const studentChoices = mapValues(groupBy(db.possibilities(), row => row.email), (choices) => {
    return choices.map(({ email, student_id, ...rest }) => {
      rest.workshop = intern(rest.workshop);
      return rest;
    });
  });

  const students = mapValues(studentChoices, (choices, email) => {
    return {
      email,
      student_id: studentIds[email],
      periods: periods[email],
      choices,
    };
  });

  const start = new Date().toISOString();

  const wa = new WorkshopAssignment(limits, workshopNames, workshopLocations, students, mutationRate);

  // Translate workshop_ids in DNA back to names and locations for output.
  const dnaForOutput = (dna) => dna.map(({ email, student_id, periods }) => ({
    email,
    student_id,
    periods: fromEntries(entries(periods).map(([p, id]) => [p, {
      workshop: workshopNames[id],
      location: workshopLocations[id],
    }])),
  }));

  const logger = async (g, pop, best) => {
    console.log(`Generation ${g} - best: ${best.fitness}`);
    mkdirSync(`${dataDir}/runs/${start}/`, { recursive: true });
    writeFileSync(
      `${dataDir}/runs/${start}/g${g}-${popSize}x${generations}.json`,
      JSON.stringify({
        config: {
          g,
          popSize,
          mutationRate,
        },
        fitness: best.fitness,
        dna: dnaForOutput(best.dna),
        stats: wa.stats(best.dna),
      }, null, 2));
  };

  const ga = new GA(wa, logger);

  ga.run(popSize, generations);
};

new Command()
  .name('run')
  .description('Run the genetic algorithm to optimize workshop assignments')
  .argument('[database]', 'path to the SQLite database', `${process.env.DATA_DIR}/db.db`)
  .requiredOption('-p, --population <size>', 'number of organisms in the population')
  .requiredOption('-g, --generations <count>', 'number of generations to run')
  .action(main)
  .parse();

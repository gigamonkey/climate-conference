#!/usr/bin/env node

import { loadJSON } from './file-util.js';
import { argv } from 'process';
import { shuffled } from './random.js';

/*
 * Make a random assignment for the given student such that every required
 * period is filled, no workshop is assigned twice, and no period is assigned
 * more than once. Handles multi-period workshops by assigning them to all
 * periods.
 */
const randomAssignment = (student) => {

  const done = (x) => student.periods.every(p => p in x);

  // Since we eliminate incompatible choices we don't need to check here.
  const add = (assignment, { period, duration, workshop }) => {
    const updated = {...assignment};
    for (let i = 0; i < duration; i++) {
      updated[period + i] = workshop;
    };
    return updated;
  };

  const overlap = ([a, b], [c, d]) => Math.max(a, c) <= Math.min(b, d);

  const range = (c) => [c.period, c.period + c.duration - 1];

  const incompatible = (c, choice) => {
    return (
      choice.workshop === c.workshop || overlap(range(c), range(choice))
    );
  }

  const eliminate = (c, choices) => choices.filter(x => !incompatible(c, x));

  const loop = (assignment, left) => {
    if (done(assignment)) {
      return assignment;
    } else if (left.length === 0) {
      return false;
    } else {
      const c = left[0];
      return (
        loop(add(assignment, c), eliminate(c, left)) || loop(assignment, left.slice(1))
      );
    }
  };

  return { email: student.email, periods: loop({}, shuffled(student.choices)) };
};


export { randomAssignment };

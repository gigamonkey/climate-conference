import { dumpJSON } from './file-util.js';
import { p, choose, shuffled } from './random.js';
import { sum } from './util.js';

const { abs, exp, floor, min, max, pow, random, sqrt } = Math;
const { entries, keys, values } = Object;

class WorkshopSA {

  constructor(limits, students, mutationRate) {
    this.limits = limits;
    this.workshops = new Set(keys(limits));
    this.students = students;
    this.ordered = values(students);
    this.mutationRate = mutationRate;
    this.constraintsBase = constraintsBase(values(limits), this.ordered.length);
  }

  test(size) {
    let best = null;
    for (let i = 0; i < size; i++) {
      const state = this.randomState();
      if (best == null || state.score > best.score) {
        best = state;
        console.log(`[${i}] best: ${best.score}`);
      }
    }
  }

  run(initialTemp, iters) {
    let state = this.randomState();
    let best = state;

    console.log(`Starting at: ${state.score}`);

    for (let k = 0; k < iters; k++) {

      //if (k % 10000 === 0) console.log(`[${k}] current: ${state.score}`);

      const temperature = initialTemp * 0.95 ** k;
      //const prob = 0.99999999 ** k

      //console.log(prob);
      const newState = this.makeMove(state, 1);
      if (newState.score > state.score) {
        console.log(`[${k}] moving to better new state. Score: ${newState.score}`);
        state = newState;
      //} else if (p(exp(-(state.score - newState.score)/temperature))) {
        //console.log(`Moving to worse new state. Score: ${newState.score}`);
        //state = newState;
      }

      if (newState.score > best.score) {
        //console.log(`Saving new best. Score: ${newState.score}`);
        best = newState;
      }
    }
    console.log(`Best: ${best.score}`);
  }

  newState(assignments) {
    const score = this.fitness(assignments);
    return { assignments, score };
  }

  randomState() {
    return this.newState(this.ordered.map(randomAssignment));
  }

  makeMove(currentState, prob) {
    return this.newState(currentState.assignments.map(g => this.maybeMutate(g, prob)));
  }

  fitness(assignments) {
    return this.constraints(this.countAssignments(assignments));
  }

  // Combined score for all assignments to workshops.
  constraints(assignments) {
    return this.constraintsBase ** distance(assignments.map(distanceFromIdeal));
  }

  maybeMutate(gene) {
    if (p(this.mutationRate)) {
      // Mutate by picking a random workshop from choices and assign it. This
      // allows multi-period workshops a chance to get filled in a way the other
      // mutation scheme does not. However that does mean that if we pick a
      // single-period workshop to assign it might fill just one period of an
      // already-assigned multi-period workshop. So we actually pick the
      // replacement and then clear all the periods covered by the current
      // occupant of the new choice's period. Then assign the new choice and
      // then randomly fill periods to fill in any other empty periods.

      const student = this.students[gene.email];
      const mutated = structuredClone(gene);
      const assigned = new Set(values(gene.periods));
      const notAssigned = student.choices.filter(({workshop}) => !assigned.has(workshop));
      const replacement = choose(notAssigned);

      // Clear all the workshops that occupy periods the replacement needs to be
      // in. This may also clear periods that the replacement will not occupy;
      // those will be randomly refilled.
      for (let i = 0; i < replacement.duration; i++) {
        clearWorkshop(mutated.periods, gene.periods[replacement.period + i]);
      }

      // I think this is just because we prefer students to not be assigned to
      // two field trips. So if the replacement we're adding is a field trip we
      // remove any other field trips. Though they could be randomly put back.
      // Or maybe I'm misremembering what this code is for.
      if (isFieldTrip(replacement.workshop)) {
        values(mutated.periods).filter(isFieldTrip).forEach(w => clearWorkshop(mutated.periods, w));
      }

      assignChoice(mutated.periods, replacement);
      mutated.periods = randomlyFillPeriods(mutated.periods, student);

      // Possibly we couldn't fill in the remaining slots?
      if (mutated.periods) {
        return mutated;
      }
    }
    return gene;
  }

  countAssignments(state) {
    const stats = this.stats(state);
    return entries(stats).flatMap(([workshop, { limits, periods }]) => {
      return entries(periods).map(([period, assigned]) => {
        return { assigned, limits };
      });
    });
  }

  stats(assignments) {
    const data = {};
    assignments.map(g => g.periods).forEach(p => {
      entries(p).forEach(([period, workshop]) => {
        if (!(workshop in data)) {
          const limits = this.limits[workshop];
          data[workshop] = { limits, periods: {} };
        }
        if (!(period in data[workshop].periods)) {
          data[workshop].periods[period] = 0;
        }
        data[workshop].periods[period]++;
      })
    });
    return data;
  }
}

/*
 * Make a fresh random assignment of choices for a given student.
 */
const randomAssignment = (student) => {
  const x = {
    email: student.email,
    periods: randomlyFillPeriods({}, student),
  };
  if (!x.periods) throw new Error(`Can't make assignment for ${JSON.stringify(student, null, 2)}`);
  return x;
};

const randomlyFillPeriods = (assigned, { choices, periods }) => {
  // Recursively fill empty slots with backtracking if we get into a situation
  // where none of the remaining choices can fill an empty period.
  const fill = (ap, left) => {
    if (periods.every(p => p in ap)) {
      return ap;
    } else if (left.length === 0) {
      return false;
    } else {
      const c = left[0];
      return (
        fill(assignChoice({...ap}, c), eliminate(c, left)) || fill(ap, left.slice(1))
      );
    }
  };

  return fill(assigned, shuffled(usableChoices(choices, assigned)));
};

const usableChoices = (choices, assigned) => {
  const assignedWorkshops = new Set(values(assigned));
  return choices.filter(c => usableChoice(c, assigned, assignedWorkshops));
};

const usableChoice = (choice, assigned, assignedWorkshops) => {
  const { period, duration, workshop } = choice;
  for (let i = 0; i < duration; i++) {
    if (period + i in assigned) return false;
  }
  return !assignedWorkshops.has(workshop);
};

const eliminate = (c, cs) => cs.filter(x => !incompatible(c, x));

const isFieldTrip = (w) => w.startsWith("Field Trip");

const incompatible = (c1, c2) => c1.workshop === c2.workshop || overlap(range(c1), range(c2));

const overlap = ([a, b], [c, d]) => max(a, c) <= min(b, d);

const range = ({ period, duration }) => [period, period + duration - 1];

const clearWorkshop = (assigned, workshop) => {
  entries(assigned)
    .filter(([p, w]) => w === workshop)
    .map((([p, w]) => p))
    .forEach(p => { delete assigned[p]; });
};

const assignChoice = (assigned, { period, duration, workshop }) => {
  for (let i = 0; i < duration; i++) {
    assigned[period + i] = workshop;
  };
  return assigned;
};


// Combined score for all assignments to workshops.
const constraints = (base, assignments) => base ** distance(assignments.map(distanceFromIdeal));

// How far away from the ideal number of students is a given assignment.
const distanceFromIdeal = ({ assigned, limits }) => {
  const { ideal, minimum, maximum } = limits;

  // distance from ideal;
  let score = abs(assigned - ideal) / ideal;

  // Penalty for being below minimum
  score += 5 * (assigned < minimum ? abs(assigned - minimum) / ideal : 0)

  // Penalty for being above maximum
  score += 5 * (assigned > maximum ? abs(assigned - maximum) / ideal : 0);

  return score;
};

const distance = (scores) => sqrt(sum(scores.map(n => n * n)));

// Find the maximum distance from the ideal based on our per-workshop
// distanceFromIdeal score function.
const maxDistance = (workshopLimits, numStudents) => {
  const d = (assigned, limits) => distanceFromIdeal({ assigned, limits });
  const idx = indexOfFarthest(workshopLimits, numStudents, d);
  return distance(workshopLimits.map((lim, i) => i == idx ? d(numStudents, lim) : d(0, lim)));
};

// Index of the workshop that would be the farthest from ideal if we put all the
// students into it. Roughly the smallest ideal except if the maximum is lower
// the above the maximum penalty might kick in.
const indexOfFarthest = (workshopLimits, numStudents, d) => {
  let idx = 0;
  for (let i = 1; i < workshopLimits.length; i++) {
    if (d(numStudents, workshopLimits[i]) > d(numStudents, workshopLimits[idx])) {
      idx = i;
    }
  }
  return idx;
}

const constraintsBase = (workshopLimits, numStudents) => {
  // 2^-1022 is the minimum positve normalized double
  return pow(2, -1022 / maxDistance(workshopLimits, numStudents))
};


export { WorkshopSA };

import { sum } from './util.js';
import { dumpJSON } from './file-util.js';
import { p, choose, shuffled } from './random.js';

const { abs, floor, min, max, random } = Math;
const { entries, keys, values } = Object;

class WorkshopAssignment {

  constructor(limits, students, mutationRate) {
    this.limits = limits;
    this.workshops = new Set(keys(limits));
    this.students = students;
    this.ordered = values(students);
    this.mutationRate = mutationRate;
  }

  randomDNA() {
    return this.ordered.map(randomAssignment);
  }

  mutatedDNA(dna, p) {
    throw new Error("nyi");
  }

  fitness(dna) {
    return constraints(countAssignments(dna, this.limits));
  }

  cross(p1, p2) {
    return p1.map((g, i) => this.maybeMutate((random() < 0.5 ? g : p2[i])));
  }

  maybeMutate(gene) {
    // Mutate by picking a workshop to remove, clearing whatever periods its in
    // and then randomly refilling those periods the same way we did when we
    // made the assignment.

    if (p(this.mutationRate)) {
      const student = this.students[gene.email];
      const mutated = structuredClone(gene);

      const workshop = choose(values(mutated.periods));
      const toClear = entries(mutated.periods).filter(([p, w]) => w === workshop).map((([p, w]) => p))
      toClear.forEach(p => { delete mutated.periods[p]; });

      // This could technically end up putting back the same workshop but maybe
      // that's okay since it's also conceivable that that's the only workshop
      // that can be put in that spot.
      mutated.periods = randomlyFillPeriods(mutated.periods, student);
      // const p = this.students[gene.email].periods.toSorted();
      // console.log(`Mutated\n ${JSON.stringify({p, ...gene}, null, 2)}\nto\n${JSON.stringify({p, ...mutated}, null, 2)}`);
    }

    return gene;
  }


  foo(dna) {
    dumpJSON(dna);
    const assignments = countAssignments(dna, this.limits)
    dumpJSON(assignments);
    console.log(constraints(assignments));

  }

}

/*
 * Make a random assignment for the given student such that every required
 * period is filled exactly once and no workshop is assigned twice. Handles
 * multi-period workshops by assigning them to all periods.
 */
const randomAssignmentX = (student) => {

  const done = (x) => student.periods.every(p => p in x);

  // Since we eliminate incompatible choices we don't need to check here.
  const add = (assignment, { period, duration, workshop }) => {
    const updated = {...assignment};
    for (let i = 0; i < duration; i++) {
      updated[period + i] = workshop;
    };
    return updated;
  };

  const overlap = ([a, b], [c, d]) => max(a, c) <= min(b, d);

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

/*
 * Make a fresh random assignment of choices for a given student.
 */
const randomAssignment = (student) => {
  return {
    email: student.email,
    periods: randomlyFillPeriods({}, student),
  };
};

// The choices must be filtered down to only those choices that can still be
// assigned, i.e. no choice that require an already assigned period and no
// choices of workshops that have already been assigned.
const randomlyFillPeriods = (assigned, { choices, periods }) => {

  const workshops = new Set(values(assigned));

  const usable = choices.filter(c => !(c.period in assigned) && !workshops.has(c.workshop))

  const done = (x) => periods.every(p => p in x);

  // Since we eliminate incompatible choices we don't need to check here.
  const add = (assignment, { period, duration, workshop }) => {
    const updated = {...assignment};
    for (let i = 0; i < duration; i++) {
      updated[period + i] = workshop;
    };
    return updated;
  };

  const overlap = ([a, b], [c, d]) => max(a, c) <= min(b, d);

  const range = (c) => [c.period, c.period + c.duration - 1];

  const incompatible = (c, choice) => {
    return (
      choice.workshop === c.workshop || overlap(range(c), range(choice))
    );
  }

  const eliminate = (c, cs) => cs.filter(x => !incompatible(c, x));

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

  return loop(assigned, shuffled(usable));
};



const countAssignments = (dna, limits) => {
  const byWorkshop = {};
  dna.map(g => g.periods).forEach(p => {
    entries(p).forEach(([period, workshop]) => {
      if (!(workshop in byWorkshop)) {
        byWorkshop[workshop] = {};
      }
      if (!(period in byWorkshop[workshop])) {
        byWorkshop[workshop][period] = 0;
      }
      byWorkshop[workshop][period]++;
    })
  });
  return entries(byWorkshop).flatMap(([workshop, periods]) => {
    return entries(periods).map(([period, assigned]) => {
      const name = `${workshop} - P${period}`;
      const ideal = limits[workshop].ideal;
      return { name, assigned, ideal };
    });
  });
}

// Combined score for all assignments to workshops.
const constraints = (assignments) => 0.1 ** sum(assignments.map(scoreWorkshop));

// How far away from the ideal number of students is a given assignment.
const scoreWorkshop = ({assigned, ideal}) => abs(assigned - ideal) / ideal;


export { WorkshopAssignment };

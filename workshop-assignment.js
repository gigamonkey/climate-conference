import { dumpJSON } from './file-util.js';
import { fitnessWeighted, fittest } from './ga.js';
import { p, choose, shuffled } from './random.js';
import { sum } from './util.js';

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
    return constraints(this.countAssignments(dna));
  }

  cross(p1, p2) {
    return p1.map((g, i) => this.maybeMutate2((random() < 0.5 ? g : p2[i])));
  }

  maybeMutate(gene) {
    if (p(this.mutationRate)) {
      // Mutate by picking a workshop to remove, clearing whatever periods it's
      // in, and then randomly refilling those periods the same way we did when
      // we made the assignment.

      const student = this.students[gene.email];
      const mutated = structuredClone(gene);

      const workshop = choose(values(mutated.periods));
      clearWorkshop(mutated.periods, workshop);

      // This could technically end up putting back the same workshop but maybe
      // that's okay since it's also conceivable that that's the only workshop
      // that can be put in that spot.
      mutated.periods = randomlyFillPeriods(mutated.periods, student);
      // const p = this.students[gene.email].periods.toSorted();
      // console.log(`Mutated\n ${JSON.stringify({p, ...gene}, null, 2)}\nto\n${JSON.stringify({p, ...mutated}, null, 2)}`);
      return mutated
    }
    return gene;
  }

  maybeMutate2(gene) {
    if (p(this.mutationRate)) {
      // Mutate by picking a random workshop from choices and assign it. This
      // allows multi-period workshops a chance to get filled in a way the other
      // mutation scheme does not. However that does mean that if we pick a
      // single-period workshop to assign it might fill just one period of an
      // already-assigned multi-period workshop. So we actually pick the
      // replacement and if it is duration 1 we clear all the periods covered by
      // the current occupant of the new choice's period. Then assign the new
      // choice and then randomly fill periods to fill in any other empty
      // periods.

      const student = this.students[gene.email];
      const mutated = structuredClone(gene);
      const replacement = choose(student.choices);

      if (replacement.duration == 1) {
        clearWorkshop(mutated.periods, mutated.periods[replacement.period]);
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

  nextGeneration(population) {
    const parents = fitnessWeighted(population, population.length);
    const baby = () => this.cross(choose(parents).dna, choose(parents).dna);
    const next = Array(population.length - 1).fill().map(baby);
    next.push(fittest(population).dna);
    return next;
  }

  countAssignments(dna) {
    return entries(this.stats(dna)).flatMap(([workshop, { limits, periods }]) => {
      return entries(periods).map(([period, assigned]) => {
        const name = `${workshop} - P${period}`;
        const ideal = limits.ideal;
        return { name, assigned, ideal };
      });
    });
  }

  stats(dna) {
    const data = {};
    dna.map(g => g.periods).forEach(p => {
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

const randomlyFillPeriods = (assignedPeriods, { choices, periods }) => {

  const workshops = new Set(values(assignedPeriods));

  const usable = choices.filter(c => {
    for (let i = 0; i < c.duration; i++) {
      if (c.period + i in assignedPeriods) return false;
    }
    return !workshops.has(c.workshop);
  });

  const done = (x) => periods.every(p => p in x);

  const incompatible = (c, choice) => {
    return (
      choice.workshop === c.workshop || overlap(range(c), range(choice))
    );
  }

  const eliminate = (c, cs) => cs.filter(x => !incompatible(c, x));

  const loop = (ap, left) => {
    if (done(ap)) {
      return ap;
    } else if (left.length === 0) {
      return false;
    } else {
      const c = left[0];
      return (
        loop(assignChoice({...ap}, c), eliminate(c, left)) || loop(ap, left.slice(1))
      );
    }
  };

  return loop(assignedPeriods, shuffled(usable));
};

const overlap = ([a, b], [c, d]) => max(a, c) <= min(b, d);

const range = ({ period, duration }) => [period, period + duration - 1];

const clearWorkshop = (assignedPeriods, workshop) => {
  entries(assignedPeriods)
    .filter(([p, w]) => w === workshop)
    .map((([p, w]) => p))
    .forEach(p => { delete assignedPeriods[p]; });
};

const assignChoice = (assignedPeriods, { period, duration, workshop }) => {
  for (let i = 0; i < duration; i++) {
    assignedPeriods[period + i] = workshop;
  };
  return assignedPeriods;
};



// Combined score for all assignments to workshops.
const constraints = (assignments) => 0.1 ** sum(assignments.map(scoreWorkshop));

// How far away from the ideal number of students is a given assignment.
const scoreWorkshop = ({assigned, ideal}) => abs(assigned - ideal) / ideal;

export { WorkshopAssignment };

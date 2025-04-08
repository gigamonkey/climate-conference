import { dumpJSON } from './file-util.js';
import { fitnessWeighted, fittest, topN } from './ga.js';
import { p, choose, randomizer, shuffled } from './random.js';
import { variance } from './util.js';

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
      // replacement and then clear all the periods covered by the current
      // occupant of the new choice's period. Then assign the new choice and
      // then randomly fill periods to fill in any other empty periods.

      const student = this.students[gene.email];
      const mutated = structuredClone(gene);
      const assigned = new Set(values(gene.periods));
      const notAssigned = student.choices.filter(({workshop}) => !assigned.has(workshop));
      const replacement = choose(notAssigned);

      for (let i = 0; i < replacement.duration; i++) {
        clearWorkshop(mutated.periods, gene.periods[replacement.period + i]);
      }

      if (isFieldTrip(replacement.workshop)) {
        values(mutated.periods).filter(isFieldTrip).forEach(w => clearWorkshop(mutated.periods, w));
      }

      check(mutated.periods)
      assignChoice(mutated.periods, replacement);
      try {
        check(mutated.periods)
      } catch {
        console.log(`Chose ${JSON.stringify(replacement)} from ${JSON.stringify(student.choices)} with already assigned ${JSON.stringify(values(gene.periods))}`);
        console.log(`Should have cleared`);
        for (let i = 0; i < replacement.duration; i++) {
          console.log(gene[replacement.period + i]);
        }
        throw new Error(`Error after assigning ${JSON.stringify(replacement)}: ${JSON.stringify(mutated.periods, null, 2)}`);
      }
      mutated.periods = randomlyFillPeriods(mutated.periods, student);

      // Possibly we couldn't fill in the remaining slots?
      if (mutated.periods) {
        return mutated;
      }
    }
    return gene;
  }

  nextGenerationOLD(population) {
    const parents = fitnessWeighted(population, population.length);
    const baby = () => this.cross(choose(parents).dna, choose(parents).dna);
    const next = Array(population.length - 1).fill().map(baby);
    next.push(fittest(population).dna);
    return next;
  }

  nextGenerationR(population) {
    const nextP = randomizer(population, 'fitness');
    const baby = () => this.cross(nextP().dna, nextP().dna);
    const next = Array(population.length - 1).fill().map(baby);
    next.push(fittest(population).dna);
    return next;
  }

  nextGenerationHalf(population) {
    const parents = topN(population, population.length * 2);
    const baby = () => this.cross(choose(parents).dna, choose(parents).dna);
    const next = Array(population.length - 1).fill().map(baby);
    next.push(fittest(population).dna);
    return next;
  }

  // No crossing; just mutate the best organism
  nextGeneration(population) {
    const best = fittest(population);
    const baby = () => best.dna.map(g => this.maybeMutate2(g))
    const next = Array(population.length - 1).fill().map(baby);
    next.push(best.dna);
    return next;
  }

  countAssignments(dna) {
    return entries(this.stats(dna)).flatMap(([workshop, { limits, periods }]) => {
      return entries(periods).map(([period, assigned]) => {
        return { assigned, limits };
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

  return check(fill(assigned, shuffled(usableChoices(choices, assigned))));
};

const check = (r) => {
  if (r[1] === "Field Trip: Alameda County Landfill") {
    if (r[2] !== r[1] || r[3] !== r[1]) throw new Error("Split multiperiod.");
  }

  if ([1,2,3,4,5,6].every(p => r[p] && r[p] === r[1])) {
    throw new Error(`All periods the same: ${JSON.stringify(r)}`);
  }

  if ([1,2,3,4,5,6].every(p => r[p] && isFieldTrip(r[p]))) {
    throw new Error(`All periods are field trip: ${JSON.stringify(r)}`);
  }

  return r;
};

const usableChoices = (choices, assigned) => {
  const workshops = values(assigned);
  const hasFieldTrip = workshops.some(isFieldTrip)
  const assignedWorkshops = new Set(workshops);
  return choices.filter(c => usableChoice(c, assigned, assignedWorkshops, hasFieldTrip));
};

const usableChoice = (choice, assigned, assignedWorkshops, hasFieldTrip) => {

  const { period, duration, workshop } = choice;

  // Choice is a field trip and we already have one.
  if (hasFieldTrip && isFieldTrip(workshop)) {
    return false;
  }

  // Choice's periods already assigned.
  for (let i = 0; i < duration; i++) {
    if (period + i in assigned) return false;
  }

  // Same workshop already assigned in a different period.
  return !assignedWorkshops.has(workshop);
};

const eliminate = (c, cs) => cs.filter(x => !incompatible(c, x));

const isFieldTrip = (w) => w.startsWith("Field Trip");

const incompatible = (c1, c2) => {
  return c1.workshop === c2.workshop || overlap(range(c1), range(c2)) || (isFieldTrip(c1.workshop) && isFieldTrip(c2.workshop));
};

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
const constraints = (assignments) => 0.5 ** variance(assignments.map(scoreWorkshop));

// How far away from the ideal number of students is a given assignment.
const scoreWorkshop = ({assigned, limits }) => {
  const { ideal, minimum, maximum } = limits;

  // distance from ideal;
  let score = abs(assigned - ideal) / ideal;

  // Penalty for being below minimum
  score += 5 * (assigned < minimum ? abs(assigned - minimum) / ideal : 0)

  // Penalty for being above maximum
  score += 5 * (assigned > maximum ? abs(assigned - maximum) / ideal : 0);

  return score;
};

export { WorkshopAssignment };

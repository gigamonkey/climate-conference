import { choose, shuffled, sample, randomInt } from './random.js';
import { count, mapValues, sum, unflattenKeys } from './util.js';
import { fitnessWeighted, fittest } from './ga.js';
import { preferencesScore } from './preferences-score.js';

// FIXME: move these to a config file.
const RANKS = 3;
const CHOP_LAST = false;
const MUTATION_BASE = 0.001;
const MUTATION_SCALE = 10000;

/*
 * A single gene is a list of grouped students (twins, etc.) and the rank they
 * are assigned to.
 */
class Gene {
  constructor(students, rank) {
    this.students = students;
    this.students.forEach(s => {
      s.ranks = Math.min(s.ranks, RANKS);
    });

    this.ranks = this.students.reduce((min, s) => Math.min(min, s.ranks), Infinity);
    if (this.students.length > 1) {
      const c1 = this.students[0].choices;
      this.sameChoices = this.students.map(s => s.choices).every(c => sameChoices(c1, c, this.ranks));
    }
    this.rank = Math.min(rank, this.ranks - 1);
  }

  choices(rank) {
    return this.students.map(s => s.choices[rank]);
  }

  get assignments() {
    return this.students.map(s => s.choices[this.rank]);
  }

  get slots() {
    return this.students.flatMap(s => {
      const school = s.choices[this.rank];
      return [
        `${school}.total`,
        `${school}.genders.${s.gender}`,
        `${school}.categories.${s.category}`,
        ...(s.iep ? [`${school}.iep`] : [])
      ]
    });
  }

  mutationProbability(rates) {
    return 1 - this.slots.reduce((p, s) => p * (1 - rates[s]), 1);
  }

  /*
   * Make a new Gene with the same students and a randomized rank no greater
   * than minRank.
   */
  randomMinRank(minRank) {
    return new Gene(this.students, Math.floor(Math.random() * Math.min(this.ranks, minRank)));
  }

  copy() {
    return new Gene(this.students, this.rank);
  }
}

class SchoolAssignment {

  constructor(limits, grouped) {
    this.limits = limits;
    this.grouped = grouped;
    this.genomeSize = Object.keys(this.grouped).length;
  }

  randomDNA() {
    return generate(this.limits, this.grouped);
  }

  /*
   * Generate a new randomish DNA by point mutating genes in existing dna with
   * som probability. Used when seeding a population from a single critter as a
   * starting point.
   */
  mutatedDNA(dna, p) {
    return dna
      .map(x => new Gene(x.students, x.rank))
      .map(g => Math.random() < p ? g.randomMinRank(RANKS) : g.copy());
  }

  fitness(dna) {
    const c = constraints(slots(this.limits, fillSchools(dna)));
    const p = preferencesScore(dna).aupcr;
    return c ** 2 * p;
  }

  fitnessBreakdown(dna) {
    const c = constraints(slots(this.limits, fillSchools(dna)));
    const p = preferencesScore(dna).aupcr;
    return {
      constraints: c,
      aupcr: p,
      fitness: c ** 2 * p,
    };
  }

  scored(dna) {
    return {
      dna: dna,
      fitness: this.fitness(dna),
    };
  }

  nextGeneration(population) {
    const unique = this.uniqueGenes(population).sort((a, b) => b.fitness - a.fitness);
    const parents = fitnessWeighted(population, population.length);
    const parent = () => parents[randomInt(0, parents.length)].dna;
    const baby = () => this.mutate(this.cross(parent(), parent()), unique.length);

    const next = Array(population.length - 1).fill().map(baby);
    next.push(fittest(population).dna);
    return next;
  }

  cross(p1, p2) {
    return p1.map((g, i) => (Math.random() < 0.5 ? g : p2[i]));
  }

  baby(p1, p2, numUnique) {
    return this.mutate(this.cross(p1, p2), numUnique);
  };

  mutate(dna, unique) {
    // This is a bit more teleological than bioloical evolution but the idea
    // here is we make different genes more likely to mutate based on whether
    // they are contributing to one or more overfull slots. For instance if
    // ac.categories.1 is over by 10 and ac.categories.2 is not over at all,
    // category 1 students in AC will be more likely to be mutated than category
    // 2 students.

    // For each slot we set the mutatation rate to zero if it is not
    // overpopulated and to (filled - limit) / limit so the expected number of
    // genes that will be mutated is the number we need to move out of that
    // slot.

    // Since each gene fills multiple slots we combine the rates for all
    // relevant slots as 1 - product((1 - r) for r in rates). That is, say there
    // are two relevant overpopulated slots for a gene each with a 0.1 mutation
    // rate. The chance that the gene will *not* mutate is 0.9 * 0.9 = 0.81 and
    // the chance that it will mutate is 0.19. Therefore a gene that is helping
    // to overpopulate a bunch of slots will be more likely to be reassigned
    // than one that is only part of one overpopulated slot. If these mutation
    // rates turn out to be too high in practice. we can always scale down the
    // probablity by some constant.

    const slotMutationRates = perSlotMutationRates(this.limits, dna);
    const c = constraints(slots(this.limits, fillSchools(dna)));
    return [ ...dna ].map((g) => maybeMutate(g, slotMutationRates, unique, c));
  }

  key(dna) {
    return dna.map((s) => s.rank).join(',');
  }

  synopsisData(best) {
    const dna = best.dna;
    const { ranks, aupcr } = preferencesScore(dna, true);
    const filled = fillSchools(dna);
    const s = slots(this.limits, filled);
    return {
      ranks,
      filled,
      limits: this.limits,
      slots: s,
      slotsTree: slotTree(s),
      fitness: best.fitness,
      constraints: constraints(s),
      aupcr,
    };
  }

  summarizePopulation(scored) {

    // For each position in the gene make a set to keep track of what ranks have
    // been used at that allele. I.e. if in one critter group[0] gets its first
    // choice we add 0, if in another the same group gets its second choice we
    // add 1, etc. Then loop through the population adding the rank at each
    // allele for each member of the population.
    const alleles = this.grouped.map(() => new Set());
    scored.forEach(s => {
      s.dna.forEach((g, i) => alleles[i].add(g.rank));
    });

    // Now transform the allele data into a simple count of how many alleles
    // have how much diversity. So if the population has zero diversity
    // counts[0] will be the size of the population and all others will be 0.
    const counts = Array(5).fill(0);
    alleles.forEach(a => counts[a.size-1]++);

    const diversity = 1 - (counts.reduce((tot, c, i) => tot + c * (4 - i), 0) / (5 * this.grouped.length));

    return {
      counts,
      diversity,
    };
  }

  uniqueGenes(population) {
    return Object.values(Object.fromEntries(population.map((c) => [ this.key(c.dna), c ])));
  }

  allCurrentDNA() {
    return this.grouped.map(group => {
      const s = group[0];
      const rank = Math.max(s.choices.indexOf(s.slc), 0);
      return new Gene(group, rank);
    });
  }

  allFirstChoiceDNA() {
    return this.grouped.map(g => new Gene(g, 0));
  }

  allFirstChoiceSlots() {
    const dna = this.allFirstChoiceDNA();
    const filled = fillSchools(dna);
    const s = slots(this.limits, filled);
    return slotTree(s);
  }

  /*
   * Make a compact spore of a set of dna consisting of just the ranks of each
   * gene. Assuming we load the spore with a SchoolAssignment with the same
   * groups it should recreate the same dna.
   */
  toSpore(dna) {
    return dna.map(g => g.rank).join('');
  }

  fromSpore(spore) {
    return this.fromRanks(spore.split('').map(Number));
  }

  fromRanks(ranks) {
    return this.grouped.map((g, i) => new Gene(g, ranks[i]));
  }

};

/*
 * Compare two choice lists. Used to avoid splitting up twins who have the same
 * choices.
 */
const sameChoices = (choices1, choices2) => {
  for (let i = 0; i < Math.min(choices1.length, choices2.length); i++) {
    if (choices1[i] !== choices2[i]) {
      return false;
    }
  }
  return true;
}

/*
 * We remove students' lower preferences. First we limit to RANKS and we also
 * may chop off each student's "last" choice. I.e. a student who explicitly
 * ranks three SLCs will get their first or second choice and a student who only
 * ranks two will get their first and no student will get their fourth of fifth
 * choice if RANKS is set to 3 and CHOP_LAST is true.
 */
const rankLimit = (student) => {

  const chopped = student.choices.length - (CHOP_LAST ? 1 : 0);

  if (student.grade === 9) {
    return automaticFirst(student) ? 1 : Math.min(RANKS, chopped);
  } else {
    // For upper-grade lottery can't get a choice worse than current SLC. For
    // students who are not currently in one of the big-five SLCs we treat them
    // like 9th graders, possibly chopping their last choice and limiting to
    // RANKS.

    const currentRank = student.choices.indexOf(student.slc);

    if (currentRank !== -1) {
      return currentRank + 1;
    } else {
      return Math.min(RANKS, chopped);
    }
  }
};

/*
 * Special treatment for 9th graders who are children of staff or have older
 * siblings in their first choice school.
 */
const automaticFirst = (s) => s.grade === 9 && (s.staff || sibInFirst(s));

/*
 * Student has an older sibling in their first choice.
 */
const sibInFirst = (s) => s.siblings.older.includes(s.choices[0]);

const maybeMutate = (g, slotMutationRates, unique, c) => {

  // Can't mutate a gene if there is only one choice.
  if (g.ranks === 1) return g;

  // The mutation rate for a gene depends on the slot mutation rates determined
  // from the DNA as a whole scaled by the number of unique organisms in the
  // population so that mutation gets more likely as diversity decreases. We
  // also add in MUTATION_BASE to give even well-positioned students some chance
  // of changing assignments.
  const p = MUTATION_BASE + g.mutationProbability(slotMutationRates);

  // The more unique organisms the less likely a mutation. I.e. as diversity
  // goes down (unique goes down) mutation becomes more probable. And the bigger
  // MUTATION_SCALE the more likely a mutation.
  const scaled = MUTATION_SCALE * (p / unique);

  // First we may just mutate the assignment to some arbitrary other slc
  const g1 = Math.random() < scaled ? mutateAssignment(g) : g;

  // Then based on the overall level of constraint satisfaction, c and the
  // current rank possibly mutate up to a better rank. I.e. the better
  // constraints are satisfied overall the more likely it is we'll mutate a gene
  // with a low preference choice.
  const g2 = Math.random() < c * 0.01 * g.rank ? mutateUp(g1) : g1;
  return g2;
};

/*
 * Mutate a gene by randomly assigning to a different rank within its limits.
 */
const mutateAssignment = (g) => {
  const { students, rank } = g;
  return new Gene(students, randomInt(0, g.ranks));
};

/*
 * Mutate a gene by randomly assigning it to a different better rank.
 */
const mutateUp = (g) => {
  const { students, rank } = g;
  return new Gene(students, randomInt(0, g.rank));
};


////////////////////////////////////////////////////////////////////////////////
// Random generation.

/*
 * Generate a (not completely) random assignment of students to schools. We bias
 * toward putting students in their preferred schools but we shuffle the
 * students list.
 */
const generate = (limits, grouped) => {

  // The genes in order. Now we just need to fill in the proper rank.
  const genes = grouped.map(g => new Gene(g, -1));

  // Map of available slots per school.
  const available = mapValues(limits, (lim) => lim.total);

  let unassigned = shuffled(genes);

  for (let rank = 0; rank < RANKS - 1; rank++) {
    const stillUnassigned = [];
    for (const gene of unassigned) {
      if (rank < gene.ranks) {
        const choices = gene.choices(rank);
        if (choices.every(c => available[c] > 0)) {
          choices.forEach(choice => {available[choice]--});
          gene.rank = rank;
          continue;
        }
      }
      stillUnassigned.push(gene);
    }
    unassigned = stillUnassigned;
  }
  // Randomly place genes above the rank we'd otherwise place any leftovers.
  unassigned.forEach(g => g.rank = randomInt(0, Math.min(g.ranks, RANKS - 1)));

  return genes;
};

const groupTwins = (students) => {
  const byID = {};
  const groups = {};

  students.forEach(s => {
    // Group is the siblings plus this student.
    const group = new Set(s.siblings.twins);
    group.add(s.id);

    byID[s.id] = s;
    groups[s.id] = group;
  });

  checkGroups(groups);

  const seen = new Set();
  const uniqueGroups = [];
  Object.values(groups).forEach(g => {
    const members = [...g];
    if (!seen.has(members[0])) {
      // Add all the members to seen so we don't process this group again.
      members.forEach(e => seen.add(e));

      // Make a group of the actual student objects
      uniqueGroups.push(members.map(e => byID[e]));
    }
  });

  return uniqueGroups;
};

const checkGroups = (groups)  => {
  Object.entries(groups).forEach(([k, ids]) => {
    [...ids].forEach(id => {
      if (!(id in groups)) {
        throw new Error(`${id}, in group for ${k} doesn't have its their group.`);
      } else if (!groups[id].has(k)) {
        throw new Error(`Group for ${id} doesn't have ${k}`);
      }
    });
  });
  //console.log(`Groups are consistent.`);
};

////////////////////////////////////////////////////////////////////////////////
// Scoring -- we want to score assignments highly that give kids their higher
// ranked choices but also we need to meet the constraints on the size of the
// schools and the gender and category breakdowns.

/*
 * Score from 0 to 1 of how well the assignments satisfy the various
 * constraints.
 */
const constraints = (slots) => 0.01 ** sum(slots.map(constraintScore));

const constraintScore = ({ filled, limit }) => Math.floor(Math.abs(filled - limit)) / limit;

const ranks = (dna) => {
  const r = Array(5).fill(0);
  dna.forEach((g) => {
    r[g.rank] += g.students.length;
  });
  return r;
};

////////////////////////////////////////////////////////////////////////////////
// Bookkeeping

/*
 * Compute the limits within each school: total enrollment plus max by gender,
 * category, and iep. Fill in unpecified limits based on the student population.
 * Gender is handled in a somewhat special way.
 */
const limits = (schools, students) => {
  const allocatedStudents = sum(Object.values(schools).map((s) => s.total));
  const leftoverStudents = students.length - allocatedStudents;

  const allocatedIep = sum(Object.values(schools).map((s) => s.iep));
  const noAllocatedIep = sum(
    Object.values(schools)
      .filter((s) => s.iep === 0)
      .map((s) => s.total)
  );
  const leftoverIep = count(students, (s) => s.iep) - allocatedIep;

  // For AC and BIHS we try to allocate students with IEPs evenly.
  const iepAllocation = (total) => Math.round(total * (leftoverIep / (noAllocatedIep + leftoverStudents)));

  // For determining the expected gender breakdown we ignore gender X meaning we
  // get an expected M/F breakdown based on the total M/F proportions in the
  // population with 0 expected X gender kids. But then when we check how the
  // constraints are balanced we count X students against whatever gender yields
  // the better balance. E.g. if we expect a 50/50 M/F split, and we get 32/31/1
  // M/F/X, that is considered balanced. Likewise 31/32/1 or 30/32/2 or 31/31/2.

  const g = breakdown(students, 'gender', new Set('x'));
  const z = breakdown(students, 'category');

  return mapValues(schools, (s) => {
    // AC gets all the leftover students.
    const total = s.total !== 0 ? s.total : leftoverStudents;
    const scale = (p) => p * total;
    return {
      total,
      genders: mapValues(g, scale),
      categories: mapValues(z, scale),
      iep: s.iep !== 0 ? s.iep : iepAllocation(total),
    };
  });
};

/*
 * Get the proportional breakown within the set of students of values of the
 * given property based on the total population of students. Optionally ignore
 * certain values but record the ignored value with an expected value of 0. This
 * is used for the gender breakdown where we want to balance based on the global
 * M/F population, counting gender x students as whatever makes things balance
 * since otherwise the small schools would have 0 expected gender X kids.
 */
const breakdown = (students, property, ignore = new Set()) => {
  const s = {};
  let count = 0;
  students.forEach((x) => {
    const value = x[property];
    if (!ignore.has(value)) {
      if (!(value in s)) {
        s[value] = 0;
      }
      s[value]++;
      count++;
    }
  });
  return mapValues(s, (v) => v / count);
};

const perSlotMutationRates = (limits, dna) => {
  return Object.fromEntries(slots(limits, fillSchools(dna)).map(slotRateEntry));
};

const slotRateEntry = ({slot, filled, limit}) => [ slot, Math.max(0, (limit - filled) / limit) ];

/*
 * For a given set of assignments, count how many students go into all the
 * different slots. These are the raw slots without any adjustmets for, e.g. x
 * gender students.
 */
const fillSchools = (dna) => {
  const schools = {};
  dna.forEach((g) => {
    g.students.forEach(s => {
      const assignment = s.choices[g.rank];
      const school = ensureSchool(schools, assignment);
      school.total++;
      school.genders[s.gender]++;
      school.categories[s.category]++;
      if (s.iep) school.iep++;
    });
  });
  return schools;
};

const ensureSchool = (schools, assignedTo) => {
  if (!(assignedTo in schools)) {
    schools[assignedTo] = { total: 0, genders: { m: 0, f: 0, x: 0 }, categories: { 1: 0, 2: 0, 3: 0 }, iep: 0 };
  }
  return schools[assignedTo];
};

/*
 * Make an array of { slot, filled, limit } objects.
 */
const slots = (limits, filled) => {
  const all = [];
  simpleSlots(limits, filled, 'total').forEach((s) => all.push(s));
  genderSlots(limits, filled).forEach((s) => all.push(s));
  categorySlots(limits, filled).forEach((s) => all.push(s));
  simpleSlots(limits, filled, 'iep').forEach((s) => all.push(s));
  return all;
};

/*
 * Put the slots list back into tree form.
 */
const slotTree = (slots) => {
  return unflattenKeys(slots.map(s => {
    const { slot, filled, limit } = s;
    const d = filled - limit;
    const delta = wholeDifference(d);
    return [ slot, { filled, limit, delta } ];
  }));
};

const wholeDifference = (d) => Math.sign(d) * Math.floor(Math.abs(d));

const slot = (slot, filled, limit) => ({ slot, filled, limit });

const genderSlots = (limits, filled) => {
  return Object.keys(limits).flatMap((school) => {
    return slotsWithIgnoredValues(school, 'genders', limits[school].genders, filled[school].genders);
  });
};

const categorySlots = (limits, filled) =>
  Object.keys(limits).flatMap((school) =>
    Object.entries(limits[school].categories).map(([ category ]) =>
      slot(`${school}.categories.${category}`, filled[school].categories[category], limits[school].categories[category])
    )
  );

const simpleSlots = (limits, filled, property) => {
  return Object.keys(limits).map((school) => {
    checkForTotal('limits', limits, limits);
    checkForTotal('filled', limits, filled);
    return slot(`${school}.${property}`, filled[school][property], limits[school][property])
  });
};

const checkForTotal = (label, limits, thing) => {
  return Object.keys(limits).map((school) => {
    if (!thing[school]) throw new Error(`No school ${school} in ${label}`);
    if (!thing[school]?.total) throw new Error(`No total in ${label}.${school}`);
  });
};

const slotsWithIgnoredValues = (school, property, limits, filled) => {

  // Start with actual counts of limited slots
  const effective = mapValues(limits, (_, k) => filled[k]);

  // Then divvy up the wildcards (keys that do not have a specified limit)
  // wherever they will balance things the most.
  Object.entries(filled).forEach(([k, v]) => {
    if (!(k in limits)) {
      for (let i = 0; i < v; i++) {
        let where = null;
        let mostRoom = -Infinity;
        Object.entries(limits).forEach(([k, limit]) => {
          const room = (limit - effective[k]) / limit;
          if (room > mostRoom) {
            mostRoom = room;
            where = k;
          }
        });
        effective[where]++;
      }
    }
  });

  return Object.keys(limits).map(k => slot(`${school}.${property}.${k}`, effective[k], limits[k]));
};

const fromSchoolsAndStudents = (schools, students) => {
  students.forEach(s => s.ranks = rankLimit(s));
  const lims = limits(schools, students);
  console.log(JSON.stringify(lims, null, 2));
  return new SchoolAssignment(lims, groupTwins(students));
};

const fromLimitsAndGroups = (limits, grouped) => new SchoolAssignment(limits, grouped)

export { fromSchoolsAndStudents, fromLimitsAndGroups };

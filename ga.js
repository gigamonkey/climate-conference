import { randomizer, choose } from './random.js';

// Specific to a given problem:
//
//   - Genetic encoding of solutions.
//   - How to generate a random gene sequence.
//   - The fitness function.
//   - Crossing strategy.
//   - Mutation strategy.
//
// Some parts of the crossing and mutation strategies may be general (e.g. cross
// by split at a random point and swap the two parts or mutate by changing one
// gene to a random element of the genetic alphabet) but which ones should be
// used is still dependent on the particular genetic encoding. Likewise the
// algorithm for choosing parents for the next generation though this code
// provides implementations of two common strategies.

// General to all genetic algorithms: The basic structure
//
//   - Create initial population
//   - Loop scoring fitness, choosing parents, making new population.
//   - Deciding how to stop: max number of generations or fitness threshold.
//

class GA {
  constructor(problem, logger = () => {}, isDone = (c) => c.fitness === 1.0) {
    this.problem = problem;
    this.logger = logger;
    this.isDone = isDone;
  }

  randomPopulation(size) {
    return Array(size)
      .fill()
      .map(() => this.problem.randomDNA());
  }

  seededPopulation(dna, size, p) {
    return Array.from({length: size}, (_, i) => this.problem.mutatedDNA(dna, i === 0 ? 0 : p));
  }

  withFitness(population) {
    console.log(`Scoring population of ${population.length} critters.`);
    return population.map((c) => ({ dna: c, fitness: this.problem.fitness(c) }));
  }

  run(populationSize, maxGenerations) {
    console.log('Making initial population.');
    const population = this.withFitness(this.randomPopulation(populationSize));

    console.log('Starting generations.');
    this.runFromPopulation(population, maxGenerations);
  }

  runFromDNA(dna, populationSize, maxGenerations, mutationRate) {
    console.log(`Making seeded population with mutation rate ${mutationRate}.`);
    const population = this.withFitness(this.seededPopulation(dna, populationSize, mutationRate));

    console.log('Starting generations.');
    this.runFromPopulation(population, maxGenerations);
  }

  runFromPopulation(initialPopulation, maxGenerations) {
    let population = initialPopulation;
    for (let g = 0; g < maxGenerations; g++) {
      population.sort((a, b) => b.fitness - a.fitness);
      this.logger(g, population);
      if (this.isDone(population[0])) break;
      population = this.withFitness(this.problem.nextGeneration(population, population.length));
    }
    this.logger(maxGenerations, population);
  }

  summarize(generation, scored) {
    let min = Infinity;
    let max = -Infinity;
    let total = 0;
    let best = null;

    for (const c of scored) {
      if (c.fitness > max) {
        best = c;
      }
      min = Math.min(min, c.fitness);
      max = Math.max(max, c.fitness);
      total += c.fitness;
    }

    return {
      generation,
      size: scored.length,
      unique: new Set(scored.map((x) => this.problem.key(x.dna))).size,
      min,
      max,
      avg: total / scored.length,
      best,
      bestSynopsis: this.problem.synopsisData(best),
      population: this.problem.summarizePopulation(scored),
    };
  }
}

// Possible parent selection algorithms.

/*
 * Single best organism.
 */
const fittest = (population) => population.reduce((best, o) => o.fitness > best.fitness ? o : best);

/*
 * Just take the top N members of the current generation by fitness.
 */
const topN = (scored, size) =>
  Array.from(scored)
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, size);

/*
 * Draw random parents weighted by their fitness.
 */
const fitnessWeighted = (scored, size) => Array(size).fill().map(randomizer(scored, 'fitness'));

/*
 * Pair off adjacent elements of the list.
 */
const adjacentPairs = (xs) =>
  Array(Math.floor(xs.length / 2))
    .fill()
    .map((_, i) => [ xs[i * 2], xs[i * 2 + 1] ]);

/*
 * Make n random pairs drawn from the list. Can pair an element with itself.
 */
const randomPairs = (xs, n) =>
  Array(n)
    .fill()
    .map(() => [ choose(xs), choose(xs) ]);

/*
 * Pair the first element of the list with each of the remaining elements.
 */
const haremPairing = (xs) => xs.slice(1).map((x) => [ xs[0], x ]);

/*
 * Pair the top n elements of the list with a subset of the remaining elements.
 */
const multiHaremPairing = (xs, n) => {
  const tops = xs.slice(0, n);
  const rest = xs.slice(n);
  return tops.flatMap((t, i) => rest.slice(i).flatMap((r, i) => (i % n === 0 ? [ [ t, r ] ] : [])));
};

export { GA, topN, fitnessWeighted, adjacentPairs, randomPairs, haremPairing, multiHaremPairing, fittest };

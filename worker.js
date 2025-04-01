import { fromSchoolsAndStudents } from './school-assignment.js';
import { GA } from './ga.js';

onmessage = (e) => {
  console.log('Running worker');
  const { schools, students, seed, population, generations } = e.data;
  console.log(e.data);
  const ga = new GA(fromSchoolsAndStudents(schools, students));
  ga.logger = (g, s) => postMessage(ga.summarize(g, s));
  if (seed) {
    ga.runFromDNA(seed.dna, population, generations, 0.1);
  } else {
    ga.run(population, generations);
  }
};

console.log('Loaded worker');

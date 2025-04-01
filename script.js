import { num } from './util.js';
import { schools } from './schools.js';
import { $, $$, text, html } from './dom.js';

const e = Object.fromEntries([...document.querySelectorAll('[id]')].map(e => [e.id, e]));

const grade = location.hash.slice(1);

const students = await fetch(`data/students-${grade}.json`).then((r) => r.json());
const seed = await fetch(`data/seed-${grade}.json`).then((r) => {
  if (r.ok) {
    console.log("Got seed");
    return r.json();
  } else if (r.status === 404) {
    console.log("No seed");
    return undefined;
  } else {
    throw new Error("Problem fetching seed: " + r);
  }
});

const logSummary = (s, config) => {
  e.history.prepend(statsRow(s, config));
  e.stats.replaceChildren(bestStatsRow(s.bestSynopsis));
  e.schools.replaceChildren(...schoolRows(s.bestSynopsis.slotsTree));
  console.log({ best: s.best, synopsis: s.bestSynopsis });
};

const statsRow = (s, config) => {
  const tr = $('<tr>');
  tr.append($('<td>', downloadLink(s.generation, s.best, config)));
  tr.append($('<td>', s.unique));
  tr.append($('<td>', num(s.population.diversity)));
  for (const a of s.population.counts) {
    tr.append($('<td>', a));
  }
  tr.append($('<td>', num(s.max)));
  tr.append($('<td>', num(s.avg)));
  tr.append($('<td>', num(s.min)));
  return tr;
};

const downloadLink = (generation, data, config) => {
  const { start, population } = config;
  const filename = `${start}-pop-${population}-gen-${generation}.json`;
  const blob = new Blob([JSON.stringify(data)], { type: "text/json" })
  const a = document.createElement("a");
  a.download = filename;
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
  a.innerText = generation;
  return a;
};

const bestStatsRow = (best) => {
  const tr = $('<tr>');
  tr.append($('<td>', num(best.fitness)));
  tr.append($('<td>', num(best.constraints)));
  tr.append($('<td>', num(best.aupcr)));
  best.ranks.forEach(rank => tr.append($('<td>', rank)));
  return tr;
};

const schoolRows = (slotsTree) => {
  return Object.entries(slotsTree).map(([school, data]) => {
    const tr = $('<tr>');
    tr.append($('<td>', school));
    tr.append($('<td>', data.total.delta));
    tr.append($('<td>', data.genders.m.delta));
    tr.append($('<td>', data.genders.f.delta));
    tr.append($('<td>', data.categories[1].delta));
    tr.append($('<td>', data.categories[2].delta));
    tr.append($('<td>', data.categories[3].delta));
    tr.append($('<td>', data.iep.delta));
    return tr;
  });
};

const studentStatsRow = (student) => {
  const stats = studentStats(students);
  const tr = $('<tr>');
  tr.append($('<th>', ""));
  tr.append($('<th>', stats.total));
  tr.append($('<th>', stats.genders.m));
  tr.append($('<th>', stats.genders.f));
  tr.append($('<th>', stats.categories[1]));
  tr.append($('<th>', stats.categories[2]));
  tr.append($('<th>', stats.categories[3]))
  tr.append($('<th>', stats.iep));
  return tr;
};

const studentStats = (students) => {
  const total = students.length;
  const genders = counts(students, 'gender');
  const categories = counts(students, 'category');
  const iep = counts(students, 'iep')[true];
  return { total, genders, categories, iep };
};

const counts = (students, field) => {
  const cs = {};
  students.forEach(s => {
    const value = s[field];
    if (!(value in cs)) {
      cs[value] = 0;
    }
    cs[value]++;
  });
  return cs;
};

const allelesRow = (population) => {
  const tr = $('<tr>');
  tr.append($('<td>', num(population.diversity)));
  for (const a of population.counts) {
    tr.append($('<td>', a));
  }
  return tr;
};

const config = {
  schools,
  students,
  seed, // this may be undefined.
  population: 50000,
  generations: 500,
  start: new Date().toISOString().replaceAll(/:/g, ''),
};

console.log(config);

e.schools.closest('table').querySelector('thead').lastElementChild.replaceWith(studentStatsRow(students));

const ga = new Worker('worker.js', { type: 'module' });
ga.onerror = (e) => {
  console.log(`Worker error: ${e}`);
  console.log(e);
};
ga.onmessage = (e) => logSummary(e.data, config);
ga.postMessage(config);

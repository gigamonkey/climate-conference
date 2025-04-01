#!/usr/bin/env node

import { sample, algorithmL, algorithmR, algorithmL2 } from './random.js';

const xs = Array(10).fill().map((_, i) => i);

function* generator() {
  for (let i = 0; i < 10; i++) {
    yield i;
  }
}

const data = {};

const ITERS = 1_000_000;

for (let i = 0; i < ITERS; i++) {
  const key = sample(generator(), 2).toSorted().join(',');
  if (!(key in data)) {
    data[key] = 0;
  }
  data[key]++;
}


Object.keys(data).toSorted().forEach(key => {
  console.log(`${key}: ${data[key]}`);
});

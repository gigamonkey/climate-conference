// Functions for getting various kinds of random values.

const { exp, floor, log, random } = Math;
const { isArray } = Array;

/*
 * Return a random integer in the range [0, n)
 */
const n = (n) => floor(random() * n);

/*
 * Return true with probability p
 */
const p = (p) => random() < p;

/*
 * Flip a coin.
 */
const flip = () => p(0.5);

/*
 * Choose a random element from elements which must be iterable.
 */
const choose = (elements) => {
  if (isArray(elements)) {
    return elements[n(elements.length)];
  } else {
    return sample(elements, 1)[0];
  }
};

/*
 * Return a random integer on half-open interval [start, end)
 */
const randomInt = (start, end) => start + n(end - start);

/*
 * Shuffle an array in place and return it.
 */
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = n(i + 1);
    [ array[i], array[j] ] = [ array[j], array[i] ];
  }
  return array;
};

/*
 * Return a shuffled version of an array without destroying the original.
 */
const shuffled = (orig) => shuffle([...orig]);

// FIXME: implement reservoir sample.
//const sample = (items, num) => (items.length <= num ? items : shuffled(items).slice(0, num));

/*
 * Sample an array of num random items taken items. Items can be an array or any
 * iterable thing. Note that the returned items are not shuffled: in particular
 * if any of the first k items are in the result they will be at their original
 * index. If you want the sample to be shuffled you can use
 * shuffled(sample(items, n)).
 */
const sample = (items, num) => {
  const fn = Array.isArray(items) ? algorithmL : algorithmL_iter;
  return fn(items, num);
};

/*
 * The naive reservoir sample. Generates N random numbers.
 */
const algorithmR = (xs, k) => {

  const r = xs.slice(0, k);
  for (let i = k; i < xs.length; i++) {
    let j = n(i + 1);
    if (j < k) {
      r[j] = xs[i];
    }
  }
  return r;
};

/*
 * The naive reservoir sample over an arbitrary iterable. Generates N random
 * numbers.
 */
const algorithmR_iter = (xs, k) => {
  const iterator = xs[Symbol.iterator]();

  const r = Array(k);

  let i = 0;
  let x = iterator.next();
  while (!x.done) {
    if (i < k) {
      r[i] = x.value;
    } else {
      let j = n(i + 1);
      if (j < k) {
        r[j] = x.value;
      }
    }
    i++;
    x = iterator.next();
  }
  return r;
};


/*
 * More efficient reservoir sample that generates fewier random numbers. This
 * version is for when xs is an array so we can index into it directly rather
 * than having to iterate to get to the next item.
 */
const algorithmL = (xs, k) => {
  const r = xs.slice(0, k);

  let i = k - 1;
  let w = exp(log(random())/k);

  while (i < xs.length) {
    i += floor(log(random())/log(1 - w)) + 1;
    if (i < xs.length) {
      r[n(r.length)] = xs[i];
      w *= exp(log(random())/k)
    }
  }
  return r;
};

/*
 * AlgorithmL for when xs is iterable but not an array. Slightly less efficient
 * than algorithmL because of the need to repeatedly call next() to skip items.
 */
const algorithmL_iter = (xs, k) => {
  const iterator = xs[Symbol.iterator]();

  const r = Array(n);

  let x;
  for (let i = 0; i < k; i++) {
    x = iterator.next();
    if (i < k) {
      r[i] = x.value;
    }
    if (x.done) return r;
  }

  let i = k - 1;
  let w = exp(log(random())/k);

  while (!x.done) {
    const toSkip = floor(log(random())/log(1 - w));
    i += toSkip;
    x = skip(iterator, toSkip);
    if (!x.done) {
      r[n(r.length)] = x.value;
      w *= exp(log(random())/k)
    }
  }
  return r;
};

/*
 * Skip n items in the iterator and return the next value. With n = 0 is
 * equivalent to iterator.next().
 */
const skip = (iterator, n) => {
  for (let i = 0; i < n; i++) {
    iterator.next();
  }
  return iterator.next();
};


/*
 * Return a thunk that returns a random element of scored weighted by the value
 * of the given property.
 */
const randomizer = (scored, property) => {
  const n = scored.length;
  const probs = Array(n).fill();
  const aliases = Array(n).fill();
  fillAliasTableFromScores(scored.map(c => c[property]), probs, aliases);
  const randomIndex = indexRandomizer(probs, aliases);
  return () => scored[randomIndex()];
};

const randomIndex = (values) => {
  const n = values.length;
  const probs = Array(n).fill();
  const aliases = Array(n).fill();
  fillAliasTableFromScores(values, probs, aliases);
  return indexRandomizer(probs, aliases);
};

/*
 * Use the two tables filled by fillAliasTable to make a thunk that returns a
 * random index based on the original weights.
 */
const indexRandomizer = (probs, aliases) => {
  return () => {
    const i = n(probs.length);
    return random() < probs[i] ? i : aliases[i];
  };
};

const fillAliasTableFromScores = (scores, probs, aliases) => {
  fillAliasTable(probabilities(scores), probs, aliases);
}

const fillAliasTable = (probabilities, probs, aliases) => {
  // Fill the probabilities and aliases tables based on the given probabilites.
  //
  // See https://www.keithschwarz.com/darts-dice-coins/
  const p = probabilities.map((x) => x * probabilities.length);
  const small = [];
  const large = [];
  for (let i = 0; i < probabilities.length; i++) {
    (p[i] < 1 ? small : large).push(i);
  }
  while (small.length > 0 && large.length > 0) {
    const l = small.pop();
    const g = large.pop();
    probs[l] = p[l];
    aliases[l] = g;
    p[g] = p[g] + p[l] - 1;
    (p[g] < 1 ? small : large).push(g);
  }
  while (large.length > 0) {
    probs[large.pop()] = 1;
  }
  while (small.length > 0) {
    probs[small.pop()] = 1;
  }
};

const probabilities = (scores) => {
  const total = scores.reduce((acc, s) => acc + s, 0);
  return scores.map((s) => s / total);
};


export { choose, randomInt, shuffle, shuffled, randomizer, flip, n, p, sample };

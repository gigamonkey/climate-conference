const sum = (ns) => ns.reduce((s, n) => s + n, 0);

const count = (xs, fn) => xs.reduce((c, x) => c + (fn(x) ? 1 : 0), 0);

const num = (n) => {
  if (n % 1 === 0) {
    return n.toString();
  } else {
    const b = Math.floor(Math.log10(n));
    const m = (n / 10 ** b);
    if (b > -2) {
      return n.toFixed(3);
    } else {
      return `${m.toFixed(2)}e${b}`;
    }
  }
}

const mapValues = (o, fn) => Object.fromEntries(Object.entries(o).map(([ k, v ]) => [ k, fn(v, k) ]));

const flattenKeys = (o) => {
  const helper = (o) => {
    if (typeof o !== 'object') {
      return o;
    } else {
      return Object.entries(o).flatMap(([ k, v ]) => {
        const f = helper(v);
        if (f === v) {
          return [ [ k, v ] ];
        } else {
          return f.map(([ k2, v2 ]) => [ `${k}.${k2}`, v2 ]);
        }
      });
    }
  };

  return Object.fromEntries(helper(o));
};


const unflattenKeys = (items) => {
  const d = {};
  for (const [k, v] of items) {
    unflattenKey(d, k, v);
  }
  return d;
};

const unflattenKey = (d, k, v) => {
  let current = d;
  const parts = k.split('.');
  for (const p of parts.slice(0, -1)) {
    if (!(p in current)) {
      current[p] = {};
    }
    current = current[p];
  }
  current[parts[parts.length - 1]] = v;
};

const maximum = (xs, key) => {
  const bestScore = -Infinity;
  const best = null;
  xs.forEach(x => {
    const score = key(x);
    if (score > bestScore) {
      bestScore = score;
      best = x;
    }
  });
  return best;
}

export { flattenKeys, unflattenKeys, mapValues, sum, count, num, maximum };

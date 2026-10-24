/*
 * CGPA Target Planner: calculation engine
 * Pure functions, whole-number arithmetic, no dependencies.
 * ES module: import * as E from './engine.js'.
 */

  // ---- Defaults (assumptions to confirm per school, see the requirements doc) ----
  const DEFAULTS = {
    scale: { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 },
    passFloor: 'E',
    thresholds: [
      { name: 'First Class', min: 4.5 },
      { name: 'Second Class Upper', min: 3.5 },
      { name: 'Second Class Lower', min: 2.4 },
      { name: 'Third Class', min: 1.5 },
      { name: 'Pass', min: 1.0 },
    ],
    rounding: 'strict', // 'strict' or 'rounded' (accept target minus 0.005)
    retake: 'add', // 'add' (old F stays) or 'replace'
    maxLoad: 24, // units per semester: warn, never block
  };
  const cfgOf = (c) => Object.assign({}, DEFAULTS, c || {});
  const maxGp = (c) => Math.max.apply(null, Object.values(c.scale));
  const floorGp = (c) => c.scale[c.passFloor];
  const hundredths = (x) => Math.round(x * 100);
  const round2 = (x) => Math.round(x * 100 + 1e-9) / 100;
  const fmt2 = (x) => round2(x).toFixed(2);
  const letterOf = (gp, c) => Object.keys(c.scale).find((k) => c.scale[k] === gp);

  // ---- Quality points from a rounded CGPA ----
  // True CGPA lies in [c - 0.5, c + 0.5) hundredths, and points are whole numbers.
  function inferPoints(units, cgpa, config) {
    const c = cfgOf(config);
    if (units === 0) return cgpa === 0 ? { candidates: [0], exact: true, conservative: 0 } : { candidates: [], exact: false, error: 'CGPA entered but no units' };
    const h = hundredths(cgpa);
    const out = [];
    const start = Math.max(0, Math.floor(((2 * h - 1) * units) / 200) - 1);
    const end = Math.ceil(((2 * h + 1) * units) / 200) + 1;
    for (let p = start; p <= end; p++) {
      if ((2 * h - 1) * units <= 200 * p && 200 * p < (2 * h + 1) * units && p <= maxGp(c) * units) out.push(p);
    }
    if (!out.length) return { candidates: [], exact: false, error: 'No whole-number points match this CGPA and units' };
    // Conservative = fewest points already earned, so the plan never asks for too little.
    return { candidates: out, exact: out.length === 1, conservative: out[0] };
  }

  // ---- Core maths ----
  function requiredPoints(P, Q, N, target, rounding) {
    const t = hundredths(target);
    if (rounding === 'rounded') return Math.ceil(((2 * t - 1) * (P + N) - 200 * Q) / 200);
    return Math.ceil((t * (P + N) - 100 * Q) / 100);
  }

  function classOf(cgpa, config) {
    const c = cfgOf(config);
    const slack = c.rounding === 'rounded' ? 0.005 : 1e-9;
    const sorted = c.thresholds.slice().sort((a, b) => b.min - a.min);
    const hit = sorted.find((t) => cgpa >= t.min - slack);
    return hit ? hit.name : 'Below pass';
  }

  // P previous units, Q previous points, N units still to be graded.
  function analyze(input) {
    const c = cfgOf(input.config);
    const { P, Q, N, target } = input;
    const max = maxGp(c), floor = floorGp(c);
    const R = requiredPoints(P, Q, N, target, c.rounding);
    let verdict;
    if (R <= N * floor) verdict = 'safe';
    else if (R > N * max) verdict = 'impossible';
    else if (R === N * max) verdict = 'straightAs';
    else verdict = 'achievable';
    const total = P + N;
    return {
      verdict, R,
      requiredAvg: N ? R / N : null,
      maxPoints: N * max,
      bestCgpa: total ? (Q + N * max) / total : null,
      lowestCgpa: total ? (Q + N * floor) / total : null,
      bestClass: total ? classOf((Q + N * max) / total, c) : null,
      lowestClass: total ? classOf((Q + N * floor) / total, c) : null,
    };
  }

  function classOverview(input) {
    const c = cfgOf(input.config);
    return c.thresholds.slice().sort((a, b) => b.min - a.min).map((t) => {
      const a = analyze(Object.assign({}, input, { target: t.min }));
      return { name: t.name, min: t.min, verdict: a.verdict, required: a.R, requiredAvg: a.requiredAvg };
    });
  }

  // ---- Grade plans (dynamic programming over reachable point totals) ----
  function ranges(courses, c) {
    const max = maxGp(c), floor = floorGp(c);
    return courses.map((x) => (x.locked != null ? [x.locked, x.locked] : [x.floor != null ? x.floor : floor, x.cap != null ? x.cap : max]));
  }

  function dpPlan(courses, R, costFn, c) {
    const rng = ranges(courses, c);
    let tot = 0;
    rng.forEach(([, hi], i) => { tot += courses[i].units * hi; });
    let dp = new Array(tot + 1).fill(Infinity);
    dp[0] = 0;
    const par = [];
    courses.forEach((course, i) => {
      const nd = new Array(tot + 1).fill(Infinity);
      const p = new Array(tot + 1).fill(null);
      const u = course.units;
      for (let s = 0; s <= tot; s++) {
        if (dp[s] === Infinity) continue;
        for (let g = rng[i][0]; g <= rng[i][1]; g++) {
          const ns = s + u * g;
          const cost = dp[s] + costFn(course, g);
          if (cost < nd[ns] - 1e-12) { nd[ns] = cost; p[ns] = [s, g]; }
        }
      }
      dp = nd;
      par.push(p);
    });
    let best = -1, bc = Infinity;
    for (let s = Math.max(0, R); s <= tot; s++) if (dp[s] < bc - 1e-12) { bc = dp[s]; best = s; }
    if (best < 0) return null;
    const grades = new Array(courses.length);
    let s = best;
    for (let i = courses.length - 1; i >= 0; i--) { const pr = par[i][s]; grades[i] = pr[1]; s = pr[0]; }
    return { grades, points: best };
  }

  function costFor(style, c) {
    const max = maxGp(c);
    if (style === 'balanced') return (x, g) => x.units * g * g;
    if (style === 'fewestA') return (x, g) => (g >= max ? 1e6 : g === max - 1 ? 1e3 : g === max - 2 ? 1 : 0) + 1e-4 * x.units * g;
    if (style === 'heavy') return (x, g) => (g * g) / x.units;
    if (style === 'strengths') return (x, g) => (x.difficulty || 3) * x.units * g * g;
    throw new Error('Unknown plan style: ' + style);
  }

  function planGrades(courses, R, style, config) {
    const c = cfgOf(config);
    return dpPlan(courses, R, costFor(style, c), c);
  }

  function summarise(gps, c) {
    const n = {};
    gps.forEach((g) => { const l = letterOf(g, c); n[l] = (n[l] || 0) + 1; });
    return Object.keys(n).sort((a, b) => c.scale[b] - c.scale[a]).map((l) => n[l] + ' ' + l).join(', ');
  }

  // Courses with equal units are interchangeable, so show counts per unit size.
  function groupPlan(courses, grades, config) {
    const c = cfgOf(config);
    const by = {};
    courses.forEach((x, i) => { (by[x.units] = by[x.units] || []).push(grades[i]); });
    return Object.keys(by).map(Number).sort((a, b) => b - a).map((u) => ({ units: u, count: by[u].length, mix: summarise(by[u], c) }));
  }

  const STYLES = [
    { style: 'balanced', label: 'Balanced' },
    { style: 'fewestA', label: 'Fewest As' },
    { style: 'heavy', label: 'Heavy first' },
    { style: 'strengths', label: 'My strengths' },
  ];

  function planAll(courses, R, config) {
    const c = cfgOf(config);
    const seen = new Set();
    const plans = [];
    STYLES.forEach(({ style, label }) => {
      const r = planGrades(courses, R, style, c);
      if (!r) return;
      const groups = groupPlan(courses, r.grades, c);
      const sig = JSON.stringify(groups);
      if (seen.has(sig)) return;
      seen.add(sig);
      plans.push({ style, label, grades: r.grades, points: r.points, groups });
    });
    return plans;
  }

  // Lowest grade a course can take if every other course gets its best allowed grade.
  function lowestAffordable(courses, R, config) {
    const c = cfgOf(config);
    const rng = ranges(courses, c);
    const total = courses.reduce((s, x, i) => s + x.units * rng[i][1], 0);
    return courses.map((x, i) => {
      if (x.locked != null) return x.locked;
      const others = total - x.units * rng[i][1];
      const g = Math.max(rng[i][0], Math.ceil((R - others) / x.units));
      return g > rng[i][1] ? null : g;
    });
  }

  // One grade for every course: the lowest that still meets the target.
  function safeFloor(R, N, config) {
    const c = cfgOf(config);
    if (!N) return null;
    const g = Math.max(floorGp(c), Math.ceil(R / N));
    return g > maxGp(c) ? null : g;
  }

  // ---- Results history ----
  function aggregateHistory(entries, opening, config) {
    const c = cfgOf(config);
    const dropped = new Set();
    if (c.retake === 'replace') entries.forEach((e) => { if (e.replaces != null) dropped.add(e.replaces); });
    let P = (opening && opening.units) || 0, Q = (opening && opening.points) || 0;
    entries.forEach((e) => {
      if (e.counts === false || dropped.has(e.id)) return;
      P += e.units;
      Q += e.units * c.scale[e.grade];
    });
    return { P, Q, cgpa: P ? Q / P : null };
  }

  // ---- What-if ----
  function whatIf(input) {
    const { P, Q, courses, grades, target } = input;
    const c = cfgOf(input.config);
    const N = courses.reduce((s, x) => s + x.units, 0);
    const points = courses.reduce((s, x, i) => s + x.units * grades[i], 0);
    const R = requiredPoints(P, Q, N, target, c.rounding);
    return { points, needed: R, short: Math.max(0, R - points), meetsTarget: points >= R, cgpa: (Q + points) / (P + N) };
  }

  // ---- Several semesters left ----
  function planSemesters(input) {
    const c = cfgOf(input.config);
    const { P, Q, semesters, target } = input; // semesters: units per remaining semester
    const N = semesters.reduce((s, u) => s + u, 0);
    const a = analyze({ P, Q, N, target, config: c });
    const avg = a.requiredAvg;
    return {
      verdict: a.verdict, R: a.R, requiredAvg: avg,
      perSemester: semesters.map((u) => ({ units: u, requiredAvg: avg, points: Math.ceil(avg * u - 1e-9) })),
      exceedsMax: avg > maxGp(c),
    };
  }

  // ---- Input checks (errors block, warnings do not) ----
  function validate(input, config) {
    const c = cfgOf(config);
    const errors = [], warnings = [];
    const max = maxGp(c);
    if (input.cgpa != null && (input.cgpa < 0 || input.cgpa > max)) errors.push('CGPA must be between 0 and ' + max.toFixed(2));
    if (input.units != null && (input.units < 0 || !Number.isInteger(input.units))) errors.push('Units must be a whole number, zero or more');
    if (input.cgpa > 0 && input.units === 0) errors.push('CGPA is above 0 but units are 0');
    if (input.target != null && (input.target < 0 || input.target > max)) errors.push('Target must be between 0 and ' + max.toFixed(2));
    if (input.maxLoad != null && (!Number.isInteger(input.maxLoad) || input.maxLoad < 1)) errors.push('Maximum units must be a whole number, at least 1');
    if (input.semesterUnits != null && input.semesterUnits > (input.maxLoad != null ? input.maxLoad : c.maxLoad)) warnings.push('That is above the usual maximum of ' + c.maxLoad + ' units for a semester');
    return { errors, warnings, ok: errors.length === 0 };
  }


  // ---- Extra units: would a few more units (up to the school maximum) make the target possible? ----
  // Extra units are assumed to be new courses that can reach `extraCap` (default: top grade).
  function extraUnitsAdvice(input) {
    const c = cfgOf(input.config);
    const { P, Q, courses, target } = input;
    const maxLoad = input.maxLoad != null ? input.maxLoad : c.maxLoad;
    const rng = ranges(courses, c);
    const N = courses.reduce((s, x) => s + x.units, 0);
    const curMax = courses.reduce((s, x, i) => s + x.units * rng[i][1], 0);
    const curMin = courses.reduce((s, x, i) => s + x.units * rng[i][0], 0);
    const extraCap = input.extraCap != null ? input.extraCap : maxGp(c);
    const headroom = Math.max(0, maxLoad - N);
    const options = [];
    for (let e = 0; e <= headroom; e++) {
      const n = N + e;
      const R = requiredPoints(P, Q, n, target, c.rounding);
      const hi = curMax + e * extraCap, lo = curMin + e * floorGp(c);
      const verdict = R <= lo ? 'safe' : R > hi ? 'impossible' : R === hi ? 'straightAs' : 'achievable';
      options.push({ extra: e, units: n, R, requiredAvg: n ? R / n : null, verdict });
    }
    const first = options.find((o) => o.verdict !== 'impossible');
    const current = P ? Q / P : 0;
    return {
      currentUnits: N, maxLoad, headroom, overloaded: N > maxLoad,
      options,
      minExtraToMakePossible: first ? first.extra : null,
      unlocksTarget: !!first && first.extra > 0,
      // Extra units at a high grade only help when the target is above the current CGPA.
      helps: target > current,
      bestCgpaAtMaxLoad: (Q + curMax + headroom * extraCap) / (P + N + headroom),
    };
  }

  // ---- Cross-check: your own CGPA from entered results, compared with the school's ----
  function countedEntries(entries, c) {
    const dropped = new Set();
    if (c.retake === 'replace') entries.forEach((e) => { if (e.replaces != null) dropped.add(e.replaces); });
    return entries.filter((e) => e.counts !== false && !dropped.has(e.id));
  }

  function crossCheck(input) {
    const c = cfgOf(input.config);
    const { entries, opening, school } = input;
    const base = aggregateHistory(entries, opening, c);

    // Semester by semester (entries may carry a `semester` label; grouping never changes the total).
    const order = [], by = {};
    countedEntries(entries, c).forEach((e) => {
      const k = e.semester || 'All courses';
      if (!by[k]) { by[k] = []; order.push(k); }
      by[k].push(e);
    });
    let cu = (opening && opening.units) || 0, cq = (opening && opening.points) || 0;
    const semesters = order.map((k) => {
      let u = 0, q = 0;
      by[k].forEach((e) => { u += e.units; q += e.units * c.scale[e.grade]; });
      cu += u; cq += q;
      return { name: k, units: u, points: q, gpa: u ? q / u : null, cumulativeCgpa: cu ? cq / cu : null };
    });

    const exact = school.units != null && school.points != null;
    const ok = (agg) => (exact ? agg.P === school.units && agg.Q === school.points : agg.cgpa != null && fmt2(agg.cgpa) === fmt2(school.cgpa));
    let status;
    if (ok(base)) status = 'match';
    else if (!exact && school.cgpa != null && Math.abs(base.cgpa - school.cgpa) <= 0.015) status = 'close';
    else status = 'mismatch';

    const hypotheses = [];
    if (status !== 'match') {
      const add = (h) => { if (hypotheses.filter((x) => x.kind === h.kind).length < 6) hypotheses.push(h); };
      const agg = (list, cc) => aggregateHistory(list, opening, cc || c);
      if (!exact && school.cgpa != null && (Math.floor(base.cgpa * 100 + 1e-9) / 100).toFixed(2) === Number(school.cgpa).toFixed(2)) add({ kind: 'truncation' });
      if (entries.some((e) => e.replaces != null)) {
        const flipped = Object.assign({}, c, { retake: c.retake === 'add' ? 'replace' : 'add' });
        if (ok(agg(entries, flipped))) add({ kind: 'retake', policy: flipped.retake });
      }
      if (entries.some((e) => e.counts === false) && ok(agg(entries.map((e) => Object.assign({}, e, { counts: true }))))) add({ kind: 'zeroUnit' });
      entries.forEach((e) => {
        if (e.counts === false) return;
        Object.keys(c.scale).forEach((L) => {
          if (L === e.grade) return;
          if (ok(agg(entries.map((x) => (x === e ? Object.assign({}, x, { grade: L }) : x))))) add({ kind: 'grade', id: e.id, units: e.units, from: e.grade, to: L });
        });
        if (ok(agg(entries.filter((x) => x !== e)))) add({ kind: 'extra', id: e.id, units: e.units, grade: e.grade });
      });
      for (let u = 1; u <= 6; u++) {
        Object.keys(c.scale).forEach((L) => {
          if (ok(agg(entries.concat([{ id: '__missing', units: u, grade: L }])))) add({ kind: 'missing', units: u, grade: L });
        });
      }
    }
    return {
      computed: { units: base.P, points: base.Q, cgpa: base.cgpa, cgpa2: base.cgpa == null ? null : fmt2(base.cgpa) },
      school, status,
      difference: !exact && school.cgpa != null && base.cgpa != null ? round2(base.cgpa - school.cgpa) : null,
      unitsDiff: school.units != null ? base.P - school.units : null,
      pointsDiff: school.points != null ? base.Q - school.points : null,
      semesters, hypotheses,
    };
  }

export {
    DEFAULTS, inferPoints, requiredPoints, classOf, analyze, classOverview,
    planGrades, planAll, groupPlan, lowestAffordable, safeFloor,
    aggregateHistory, whatIf, planSemesters, validate, extraUnitsAdvice, crossCheck, fmt2, letterOf,
};

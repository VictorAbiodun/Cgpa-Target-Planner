// Turns the raw screen state into the numbers the engine needs.
import * as E from './engine/engine.js';

export const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];
export const MAX_GP = Math.max(...Object.values(E.DEFAULTS.scale));
export const num = (v) => (v === '' || v == null ? NaN : Number(v));

// Previous results as units (P) and quality points (Q).
export function previous(state) {
  if (state.stage === 'fresh') return { ok: true, P: 0, Q: 0, fresh: true };
  if (state.method === 'summary') {
    const units = num(state.summary.units), cgpa = num(state.summary.cgpa);
    if (Number.isNaN(units) || Number.isNaN(cgpa)) return { ok: false };
    const v = E.validate({ units, cgpa });
    if (!v.ok) return { ok: false, errors: v.errors };
    const r = E.inferPoints(units, cgpa);
    if (r.error) return { ok: false, errors: [r.error] };
    return { ok: true, P: units, Q: r.conservative, exact: r.exact, candidates: r.candidates };
  }
  if (state.method === 'points') {
    const units = num(state.points.units), pts = num(state.points.points);
    if (Number.isNaN(units) || Number.isNaN(pts)) return { ok: false };
    const errors = [];
    if (!Number.isInteger(units) || units < 0) errors.push('Units must be a whole number, zero or more');
    if (!Number.isInteger(pts) || pts < 0) errors.push('Points must be a whole number, zero or more');
    if (!errors.length && pts > MAX_GP * units) errors.push('Points cannot be more than ' + MAX_GP + ' × your units');
    if (errors.length) return { ok: false, errors };
    return { ok: true, P: units, Q: pts, exact: true, cgpa: units ? pts / units : null };
  }
  const h = E.aggregateHistory(state.entries);
  return { ok: state.entries.length > 0, P: h.P, Q: h.Q, exact: true, cgpa: h.cgpa };
}

// Pending courses from the unit-size counts (heaviest first), enriched with per-course options.
export function courseList(state) {
  const out = [];
  let k = 0;
  for (let u = 6; u >= 1; u--) {
    for (let j = 0; j < (state.counts[u] || 0); j++) {
      const opts = (state.courseOptions && state.courseOptions[k]) || {};
      const c = { units: u };
      if (opts.locked != null) c.locked = opts.locked;
      if (opts.cap != null) c.cap = opts.cap;
      if (opts.floor != null) c.floor = opts.floor;
      if (opts.difficulty != null) c.difficulty = opts.difficulty;
      out.push(c);
      k++;
    }
  }
  return out;
}

// The CGPA the student is aiming for, or null for "best I can do".
export function targetOf(state) {
  const t = state.target;
  if (t.mode === 'class') {
    const c = E.DEFAULTS.thresholds.find((x) => x.name === t.className);
    return c ? c.min : NaN;
  }
  if (t.mode === 'cgpa') return num(t.cgpa);
  return null;
}

export function targetLabel(state) {
  const t = state.target;
  if (t.mode === 'class') return t.className;
  if (t.mode === 'cgpa') return 'a CGPA of ' + Number(t.cgpa).toFixed(2);
  return 'your best result';
}

export function describeHypothesis(h, entries) {
  const nth = (id) => {
    const i = entries.findIndex((e) => e.id === id);
    return i >= 0 ? 'Course ' + (i + 1) : 'A course';
  };
  switch (h.kind) {
    case 'truncation': return 'Your school may cut the CGPA off after two decimals instead of rounding it.';
    case 'retake': return h.policy === 'replace' ? 'Your school may replace the old grade when a course is retaken.' : 'Your school may keep the old grade in the total when a course is retaken.';
    case 'zeroUnit': return 'Your school may count courses you marked as not counting.';
    case 'grade': return nth(h.id) + ' (' + h.units + ' units) may be a ' + h.to + ' on your result slip, not a ' + h.from + '.';
    case 'missing': return 'Your result slip may include one more ' + h.units + '-unit course graded ' + h.grade + '.';
    case 'extra': return nth(h.id) + ' (' + h.units + ' units, grade ' + h.grade + ') may not be counted by your school.';
    default: return '';
  }
}

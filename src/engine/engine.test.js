import assert from 'node:assert';
import * as E from './engine.js';

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

const units = [4, 3, 3, 3, 3, 2, 2];
const mk = (extra) => units.map((u, i) => Object.assign({ units: u }, extra && extra[i]));
const gp = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const countOf = (grades, g) => grades.filter((x) => x === g).length;

console.log('Requirements document: worked examples');
t('T1 fresh 100L: P=0, N=20, target 4.50', () => {
  const a = E.analyze({ P: 0, Q: 0, N: 20, target: 4.5 });
  assert.strictEqual(a.R, 90); assert.strictEqual(a.requiredAvg, 4.5); assert.strictEqual(a.verdict, 'achievable');
});
t('T2 mid-degree: 90 units at 3.80, N=20, target 4.00', () => {
  const q = E.inferPoints(90, 3.8).conservative;
  const a = E.analyze({ P: 90, Q: q, N: 20, target: 4.0 });
  assert.strictEqual(q, 342); assert.strictEqual(a.R, 98); assert.strictEqual(a.requiredAvg, 4.9);
});
t('T3 final semester impossible: best CGPA 4.25, Second Class Upper', () => {
  const a = E.analyze({ P: 100, Q: 410, N: 20, target: 4.5 });
  assert.strictEqual(a.R, 130); assert.strictEqual(a.verdict, 'impossible');
  assert.strictEqual(a.bestCgpa, 4.25); assert.strictEqual(a.bestClass, 'Second Class Upper');
});
t('T4 straight As only at target 4.25', () => {
  const a = E.analyze({ P: 100, Q: 410, N: 20, target: 4.25 });
  assert.strictEqual(a.R, 100); assert.strictEqual(a.verdict, 'straightAs');
});
t('T5 already safe at target 3.50', () => {
  const a = E.analyze({ P: 100, Q: 410, N: 20, target: 3.5 });
  assert.strictEqual(a.R, 10); assert.strictEqual(a.verdict, 'safe');
});
t('T6 rounded CGPA: 90 units at 3.80 gives exactly 342 points', () => {
  const r = E.inferPoints(90, 3.8);
  assert.deepStrictEqual(r.candidates, [342]); assert.strictEqual(r.exact, true);
});
t('T7 fewest As: exactly 3 As (4-unit and two 3-unit), rest B, 90 points', () => {
  const r = E.planGrades(mk(), 90, 'fewestA');
  assert.strictEqual(countOf(r.grades, 5), 3); assert.strictEqual(countOf(r.grades, 4), 4);
  assert.strictEqual(r.grades[0], 5); assert.strictEqual(r.points, 90);
  assert.deepStrictEqual(E.groupPlan(mk(), r.grades).map((g) => g.units + ':' + g.mix), ['4:1 A', '3:2 A, 2 B', '2:2 B']);
});
t('T8 locked course: 4-unit already B, plan covers the rest', () => {
  const courses = mk([{ locked: 4 }]);
  const r = E.planGrades(courses, 90, 'fewestA');
  assert.strictEqual(r.grades[0], 4);
  const pts = courses.reduce((s, x, i) => s + x.units * r.grades[i], 0);
  assert.ok(pts >= 90); assert.strictEqual(countOf(r.grades, 5), 4);
});
t('T9 cap: a 3-unit course capped at B never gets an A', () => {
  const r = E.planGrades(mk([null, { cap: 4 }]), 90, 'fewestA');
  assert.ok(r.grades[1] <= 4);
  assert.ok(r.points >= 90);
});
t('T10 retake policy: add keeps the F, replace removes it', () => {
  const entries = [{ id: 1, units: 3, grade: 'F' }, { id: 2, units: 3, grade: 'B', replaces: 1 }];
  const add = E.aggregateHistory(entries, null, { retake: 'add' });
  const rep = E.aggregateHistory(entries, null, { retake: 'replace' });
  assert.deepStrictEqual([add.P, add.Q], [6, 12]); assert.deepStrictEqual([rep.P, rep.Q], [3, 12]);
});
t('T11 multi-semester: P=60, two semesters of 20 units, target 4.00', () => {
  const r = E.planSemesters({ P: 60, Q: 240, semesters: [20, 20], target: 4.0 });
  assert.strictEqual(r.R, 160); assert.strictEqual(r.requiredAvg, 4); assert.strictEqual(r.perSemester[0].requiredAvg, 4);
});
t('T12 invalid input: CGPA 5.2 on a 5-point scale is blocked', () => {
  const v = E.validate({ cgpa: 5.2, units: 90 });
  assert.strictEqual(v.ok, false); assert.ok(v.errors.length >= 1);
});
t('T13 lowest affordable grade: C, D, E for 4, 3 and 2 unit courses', () => {
  const lo = E.lowestAffordable(mk(), 90);
  assert.strictEqual(lo[0], gp.C); assert.strictEqual(lo[1], gp.D); assert.strictEqual(lo[5], gp.E);
});
t('T14 course-by-course history: P=14, Q=61, CGPA 4.36', () => {
  const h = E.aggregateHistory([[3, 'A'], [3, 'B'], [2, 'C'], [4, 'A'], [2, 'B']].map(([units, grade], id) => ({ id, units, grade })));
  assert.deepStrictEqual([h.P, h.Q], [14, 61]); assert.strictEqual(E.fmt2(h.cgpa), '4.36');
});
t('T15 opening balance plus courses: P=95, Q=365, CGPA 3.84', () => {
  const h = E.aggregateHistory([{ id: 1, units: 3, grade: 'A' }, { id: 2, units: 2, grade: 'B' }], { units: 90, points: 342 });
  assert.deepStrictEqual([h.P, h.Q], [95, 365]); assert.strictEqual(E.fmt2(h.cgpa), '3.84');
});
t('T16 unit-only grouping shown as counts per unit size', () => {
  const r = E.planGrades(mk(), 90, 'fewestA');
  assert.strictEqual(E.groupPlan(mk(), r.grades).length, 3);
});

console.log('Extra checks');
t('Final semester overview (100 units at 3.80, 20 left)', () => {
  const o = E.classOverview({ P: 100, Q: 380, N: 20 });
  const by = Object.fromEntries(o.map((x) => [x.name, x]));
  assert.strictEqual(by['First Class'].verdict, 'impossible');
  assert.strictEqual(by['Second Class Upper'].verdict, 'achievable'); assert.strictEqual(by['Second Class Upper'].requiredAvg, 2);
  assert.strictEqual(by['Second Class Lower'].verdict, 'safe');
  const a = E.analyze({ P: 100, Q: 380, N: 20, target: 3.5 });
  assert.strictEqual(E.fmt2(a.bestCgpa), '4.00'); assert.strictEqual(E.fmt2(a.lowestCgpa), '3.33');
});
t('Walkthrough example: 14 units at 4.36, 20 new units, First Class', () => {
  const a = E.analyze({ P: 14, Q: 61, N: 20, target: 4.5 });
  assert.strictEqual(a.R, 92); assert.strictEqual(E.fmt2(a.requiredAvg), '4.60'); assert.strictEqual(E.fmt2(a.bestCgpa), '4.74');
  const plan = E.planGrades(mk(), a.R, 'fewestA');
  assert.strictEqual(countOf(plan.grades, 5), 4);
});
t('What-if: one 3-unit B dropped to C gives 89 points and 4.41', () => {
  const grades = [5, 5, 5, 4, 3, 5, 4];
  const w = E.whatIf({ P: 14, Q: 61, courses: mk(), grades, target: 4.5 });
  assert.strictEqual(w.points, 89); assert.strictEqual(w.short, 3); assert.strictEqual(E.fmt2(w.cgpa), '4.41'); assert.strictEqual(w.meetsTarget, false);
});
t('Rounded target policy accepts target minus 0.005', () => {
  assert.strictEqual(E.requiredPoints(0, 0, 200, 4.5, 'strict'), 900);
  assert.strictEqual(E.requiredPoints(0, 0, 200, 4.5, 'rounded'), 899);
});
t('Ambiguous rounded CGPA offers several candidates and a cautious value', () => {
  const r = E.inferPoints(250, 3.8);
  assert.strictEqual(r.exact, false); assert.ok(r.candidates.length > 1); assert.strictEqual(r.conservative, r.candidates[0]);
});
t('Impossible target returns no plan', () => {
  assert.strictEqual(E.planGrades(mk(), 101, 'balanced'), null);
});
t('Safe floor: required average 4.5 means no single-grade floor below A', () => {
  assert.strictEqual(E.safeFloor(90, 20), 5);
  assert.strictEqual(E.safeFloor(60, 20), 3);
  assert.strictEqual(E.safeFloor(101, 20), null);
});
t('All four plan styles meet the target and duplicates are removed', () => {
  const plans = E.planAll(mk([{ difficulty: 5 }, null, null, null, null, { difficulty: 1 }]), 92);
  assert.ok(plans.length >= 2);
  plans.forEach((p) => assert.ok(p.points >= 92));
  assert.strictEqual(new Set(plans.map((p) => JSON.stringify(p.groups))).size, plans.length);
});
t('Unit load above 24 warns but does not block', () => {
  const v = E.validate({ semesterUnits: 27 });
  assert.strictEqual(v.ok, true); assert.strictEqual(v.warnings.length, 1);
});
t('Final semester with nothing graded: only a fresh student with no units', () => {
  const a = E.analyze({ P: 0, Q: 0, N: 15, target: 3.0 });
  assert.strictEqual(a.R, 45); assert.strictEqual(a.verdict, 'achievable');
});


console.log('New: school maximum units and extra-units advice');
const eu = (target, extra) => E.extraUnitsAdvice(Object.assign({ P: 100, Q: 410, courses: mk(), target, maxLoad: 24 }, extra));
t('Target 4.26 is impossible now but possible with 2 extra units (straight As), easier with 3', () => {
  const a = eu(4.26);
  assert.strictEqual(a.options[0].verdict, 'impossible');
  assert.strictEqual(a.minExtraToMakePossible, 2); assert.strictEqual(a.unlocksTarget, true);
  assert.strictEqual(a.options[2].verdict, 'straightAs'); assert.strictEqual(a.options[3].verdict, 'achievable');
  assert.strictEqual(a.helps, true);
});
t('Target 4.30 stays impossible even at the maximum load', () => {
  const a = eu(4.3);
  assert.strictEqual(a.minExtraToMakePossible, null); assert.strictEqual(a.unlocksTarget, false);
  assert.strictEqual(a.options.length, 5);
});
t('Target below the current CGPA: extra units do not help', () => {
  const a = eu(3.5);
  assert.strictEqual(a.helps, false); assert.strictEqual(a.options[0].verdict, 'safe'); assert.strictEqual(a.unlocksTarget, false);
});
t('No headroom when the load already equals the maximum', () => {
  const a = eu(4.26, { maxLoad: 20 });
  assert.strictEqual(a.headroom, 0); assert.strictEqual(a.options.length, 1);
});
t('Overloaded semester (27 units, maximum 24) is flagged with no extra room', () => {
  const big = mk().concat([{ units: 7 }]);
  const a = E.extraUnitsAdvice({ P: 100, Q: 410, courses: big, target: 4.2, maxLoad: 24 });
  assert.strictEqual(a.currentUnits, 27); assert.strictEqual(a.overloaded, true); assert.strictEqual(a.headroom, 0);
});
t('Extra courses capped at B can unlock less than straight As would', () => {
  const a = eu(4.26, { extraCap: 4 });
  assert.ok(a.minExtraToMakePossible === null || a.minExtraToMakePossible > 2);
  assert.ok(a.bestCgpaAtMaxLoad < eu(4.26).bestCgpaAtMaxLoad);
});
t('Maximum units must be a whole number of at least 1', () => {
  assert.strictEqual(E.validate({ maxLoad: 0 }).ok, false);
  assert.strictEqual(E.validate({ maxLoad: 24 }).ok, true);
});

console.log('New: cross-check against the school CGPA');
const hist = (list, sem) => list.map(([units, grade], id) => ({ id, units, grade, semester: sem && sem[id] }));
const T14 = [[3, 'A'], [3, 'B'], [2, 'C'], [4, 'A'], [2, 'B']];
t('Matching result: 14 units, 61 points, school says 4.36', () => {
  const r = E.crossCheck({ entries: hist(T14), school: { cgpa: 4.36 } });
  assert.strictEqual(r.status, 'match'); assert.strictEqual(r.computed.cgpa2, '4.36'); assert.strictEqual(r.hypotheses.length, 0);
});
t('Exact units and points compare: match, then a one-point gap', () => {
  assert.strictEqual(E.crossCheck({ entries: hist(T14), school: { units: 14, points: 61 } }).status, 'match');
  const r = E.crossCheck({ entries: hist(T14), school: { units: 14, points: 62 } });
  assert.strictEqual(r.status, 'mismatch'); assert.strictEqual(r.pointsDiff, -1); assert.strictEqual(r.unitsDiff, 0);
});
t('School cuts off instead of rounding: 4.357 shown as 4.35', () => {
  const r = E.crossCheck({ entries: hist(T14), school: { cgpa: 4.35 } });
  assert.strictEqual(r.status, 'close'); assert.ok(r.hypotheses.some((h) => h.kind === 'truncation'));
});
t('A missing course explains the gap: school 4.19 equals one extra 2-unit C', () => {
  const r = E.crossCheck({ entries: hist(T14), school: { cgpa: 4.19 } });
  assert.strictEqual(r.status, 'mismatch');
  assert.ok(r.hypotheses.some((h) => h.kind === 'missing' && h.units === 2 && h.grade === 'C'));
});
t('A wrong grade explains the gap: 3-unit B recorded where the school has C (4.14)', () => {
  const r = E.crossCheck({ entries: hist(T14), school: { cgpa: 4.14 } });
  assert.ok(r.hypotheses.some((h) => h.kind === 'grade' && h.id === 1 && h.from === 'B' && h.to === 'C'));
});
t('An extra course counted only by the student: removing the 2-unit C gives 4.58', () => {
  const r = E.crossCheck({ entries: hist(T14), school: { cgpa: 4.58 } });
  assert.ok(r.hypotheses.some((h) => h.kind === 'extra' && h.id === 2));
});
t('Retake policy flip explains the gap', () => {
  const entries = [{ id: 1, units: 3, grade: 'F' }, { id: 2, units: 3, grade: 'B', replaces: 1 }];
  const r = E.crossCheck({ entries, school: { cgpa: 4.0 }, config: { retake: 'add' } });
  assert.strictEqual(r.status, 'mismatch'); assert.ok(r.hypotheses.some((h) => h.kind === 'retake' && h.policy === 'replace'));
});
t('Semester summary: GPA per semester and the running CGPA', () => {
  const sem = ['100L 1st', '100L 1st', '100L 2nd', '100L 2nd', '100L 2nd'];
  const r = E.crossCheck({ entries: hist(T14, sem), school: { cgpa: 4.36 } });
  assert.strictEqual(r.semesters.length, 2);
  assert.strictEqual(E.fmt2(r.semesters[0].gpa), '4.50'); assert.strictEqual(r.semesters[0].units, 6);
  assert.strictEqual(E.fmt2(r.semesters[1].gpa), '4.25'); assert.strictEqual(E.fmt2(r.semesters[1].cumulativeCgpa), '4.36');
});
t('Opening balance counts toward the cross-check', () => {
  const r = E.crossCheck({ entries: [{ id: 1, units: 3, grade: 'A' }, { id: 2, units: 2, grade: 'B' }], opening: { units: 90, points: 342 }, school: { cgpa: 3.84 } });
  assert.strictEqual(r.status, 'match'); assert.strictEqual(r.computed.units, 95);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);

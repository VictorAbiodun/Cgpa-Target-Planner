// Renders every screen in realistic states and checks for crashes and key text.
import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert';

const out = fileURLToPath(new URL('./.smoke-bundle.mjs', import.meta.url));
await build({
  entryPoints: [fileURLToPath(new URL('./smoke-entry.jsx', import.meta.url))],
  bundle: true, platform: 'node', format: 'esm', outfile: out, jsx: 'automatic', logLevel: 'error',
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
const { render, cases } = await import(pathToFileURL(out).href);

const expect = {
  welcome: ['CGPA Target Planner', 'Continue without signing in', 'cross-check'],
  setup: ['Most units your school allows'],
  stage: ['Where are you in your degree?'],
  results_courses: ['4.36', '14'],
  results_summary: ['342 points'],
  results_summary_bad: ['CGPA must be between'],
  results_points: ['3.80'],
  courses: ['20 units across 7 courses'],
  courses_with_opts: ['Set grade limits', 'Cap: B', 'Floor: C'],
  courseoptions_empty: ['Course options', 'To be graded'],
  courseoptions_locked: ['Course options', 'Save course'],
  target_class: ['First Class'],
  target_cgpa: ['Quick picks'],
  target_best: ['No target needed'],
  result_achievable: ['Achievable', '4.6 average', 'Aim:'],
  result_impossible: ['Impossible', 'Could a few extra units help?', '2 more units'],
  result_extra_none: ['best possible CGPA is <b>4.27</b>'],
  result_straight: ['Straight As only'],
  result_safe: ['Already safe'],
  result_final: ['Your last courses', '4.00', '3.33', 'Impossible'],
  result_best: ['Your best result', '4.00 CGPA'],
  result_fresh: ['Achievable'],
  result_missing: ['Missing details'],
  crosscheck_empty: ['Cross-check your CGPA'],
  crosscheck_match: ['Match'],
  crosscheck_missing: ['Does not match', '2-unit course graded C'],
  crosscheck_points: ['Points differ by 1'],
};
let ok = 0;
for (const name of Object.keys(cases)) {
  const html = render(name).replace(/<!-- -->/g, '');
  for (const text of expect[name] || []) assert.ok(html.includes(text), name + ' should contain: ' + text);
  ok++;
}
console.log('smoke: ' + ok + ' screens rendered, all expectations met');

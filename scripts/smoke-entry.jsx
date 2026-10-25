import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';
import { StoreProvider } from '../src/state/store.jsx';

const e = (list) => list.map(([units, grade], i) => ({ id: i + 1, units, grade, semester: 'Semester 1' }));
const T14 = e([[3, 'A'], [3, 'B'], [2, 'C'], [4, 'A'], [2, 'B']]);
const counts = { 1: 0, 2: 2, 3: 4, 4: 1, 5: 0, 6: 0 };
const base = { counts, maxLoad: 24 };

export const cases = {
  welcome: { screen: 'welcome' },
  setup: { screen: 'setup' },
  stage: { screen: 'stage' },
  results_courses: { screen: 'results', stage: 'has', method: 'courses', entries: T14 },
  results_summary: { screen: 'results', stage: 'has', method: 'summary', summary: { units: '90', cgpa: '3.80' } },
  results_summary_bad: { screen: 'results', stage: 'has', method: 'summary', summary: { units: '90', cgpa: '5.2' } },
  results_points: { screen: 'results', stage: 'has', method: 'points', points: { units: '90', points: '342' } },
  courses: { screen: 'courses', stage: 'has', ...base },
  courses_with_opts: { screen: 'courses', stage: 'has', ...base, courseOptions: { 0: { cap: 4, floor: 3, difficulty: 2 } } },
  courseoptions_empty: { screen: 'courseoptions', ...base, editingCourseIdx: 0 },
  courseoptions_locked: { screen: 'courseoptions', ...base, editingCourseIdx: 0, courseOptions: { 0: { status: 'locked', locked: 5 } } },
  target_class: { screen: 'target', target: { mode: 'class', className: 'First Class', cgpa: '' } },
  target_cgpa: { screen: 'target', target: { mode: 'cgpa', className: '', cgpa: '4.26' } },
  target_best: { screen: 'target', target: { mode: 'best', className: '', cgpa: '' } },
  result_achievable: { screen: 'result', stage: 'has', method: 'courses', entries: T14, ...base },
  result_impossible: { screen: 'result', stage: 'has', method: 'points', points: { units: '100', points: '410' }, ...base, target: { mode: 'cgpa', className: '', cgpa: '4.26' } },
  result_extra_none: { screen: 'result', stage: 'has', method: 'points', points: { units: '100', points: '410' }, ...base, target: { mode: 'cgpa', className: '', cgpa: '4.30' } },
  result_straight: { screen: 'result', stage: 'has', method: 'points', points: { units: '100', points: '410' }, ...base, target: { mode: 'cgpa', className: '', cgpa: '4.25' } },
  result_safe: { screen: 'result', stage: 'has', method: 'points', points: { units: '100', points: '410' }, ...base, target: { mode: 'cgpa', className: '', cgpa: '3.50' } },
  result_final: { screen: 'result', stage: 'final', method: 'points', points: { units: '100', points: '380' }, ...base },
  result_best: { screen: 'result', stage: 'has', method: 'points', points: { units: '100', points: '380' }, ...base, target: { mode: 'best', className: '', cgpa: '' } },
  result_fresh: { screen: 'result', stage: 'fresh', ...base, target: { mode: 'cgpa', className: '', cgpa: '4.50' } },
  result_missing: { screen: 'result', stage: 'has', method: 'courses', entries: [] , ...base },
  crosscheck_empty: { screen: 'crosscheck' },
  crosscheck_match: { screen: 'crosscheck', entries: T14, school: { mode: 'cgpa', cgpa: '4.36', units: '', points: '' } },
  crosscheck_missing: { screen: 'crosscheck', entries: T14, school: { mode: 'cgpa', cgpa: '4.19', units: '', points: '' } },
  crosscheck_points: { screen: 'crosscheck', entries: T14, school: { mode: 'points', cgpa: '', units: '14', points: '62' } },
  whatif_ontarget: { screen: 'whatif', stage: 'has', method: 'courses', entries: T14, ...base, target: { mode: 'class', className: 'First Class', cgpa: '' }, whatIfGrades: [5, 5, 5, 5, 5, 5, 5] },
  whatif_short: { screen: 'whatif', stage: 'has', method: 'courses', entries: T14, ...base, target: { mode: 'class', className: 'First Class', cgpa: '' }, whatIfGrades: [4, 4, 4, 4, 4, 4, 4] },
};

export function render(name) {
  return renderToString(<StoreProvider initial={cases[name]}><App /></StoreProvider>);
}

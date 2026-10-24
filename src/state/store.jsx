import { createContext, useContext, useMemo, useReducer } from 'react';

// Guest mode saves nothing: this state lives in memory only (see AGENTS.md).
export const initialState = {
  screen: 'welcome',
  stack: [],
  maxLoad: 24, // school maximum units per semester
  stage: null, // 'fresh' | 'has' | 'final'
  method: 'courses', // results entry: 'summary' | 'points' | 'courses'
  summary: { units: '', cgpa: '' },
  points: { units: '', points: '' },
  entries: [], // { id, units, grade, semester }
  nextId: 1,
  semesterNo: 1,
  counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, // pending courses by unit size
  courseOptions: {}, // per-course options keyed by flat index: { cap, floor, locked, difficulty, status }
  editingCourseIdx: null, // index of the course being edited in CourseOptions
  target: { mode: 'class', className: 'First Class', cgpa: '4.50' }, // mode: 'class' | 'cgpa' | 'best'
  school: { mode: 'cgpa', cgpa: '', units: '', points: '' }, // cross-check: the school's own figure
};

function reducer(s, a) {
  switch (a.type) {
    case 'set':
      return { ...s, ...a.patch };
    case 'go':
      return { ...s, stack: [...s.stack, s.screen], screen: a.screen };
    case 'back': {
      if (!s.stack.length) return s;
      return { ...s, stack: s.stack.slice(0, -1), screen: s.stack[s.stack.length - 1] };
    }
    case 'addEntry':
      return { ...s, entries: [...s.entries, { id: s.nextId, units: a.units, grade: a.grade, semester: 'Semester ' + s.semesterNo }], nextId: s.nextId + 1 };
    case 'removeEntry':
      return { ...s, entries: s.entries.filter((e) => e.id !== a.id) };
    case 'undoEntry':
      return { ...s, entries: s.entries.slice(0, -1) };
    case 'newSemester':
      return { ...s, semesterNo: s.semesterNo + 1 };
    case 'setCount': {
      const nc = { ...s.counts, [a.units]: Math.max(0, a.count) };
      // Prune courseOptions beyond the new total count
      let total = 0;
      for (let u = 6; u >= 1; u--) total += nc[u] || 0;
      const co = { ...s.courseOptions };
      Object.keys(co).forEach((k) => { if (Number(k) >= total) delete co[k]; });
      return { ...s, counts: nc, courseOptions: co };
    }
    case 'setCourseOption': {
      const co = { ...s.courseOptions };
      if (a.opts == null) delete co[a.idx]; else co[a.idx] = a.opts;
      return { ...s, courseOptions: co };
    }
    case 'useCrossCheckResults':
      return { ...s, stage: 'has', method: 'courses', stack: [...s.stack, s.screen], screen: 'courses' };
    case 'reset':
      return { ...initialState };
    default:
      return s;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children, initial }) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...(initial || {}) });
  const value = useMemo(
    () => ({ state, dispatch, go: (screen) => dispatch({ type: 'go', screen }), set: (patch) => dispatch({ type: 'set', patch }) }),
    [state]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

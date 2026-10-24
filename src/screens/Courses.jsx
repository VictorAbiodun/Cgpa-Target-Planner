import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn } from '../components/ui.jsx';
import { courseList } from '../derive.js';
import * as E from '../engine/engine.js';

export default function Courses() {
  const { state, dispatch, go, set } = useStore();
  const list = courseList(state);
  const N = list.reduce((s, c) => s + c.units, 0);
  const over = N > state.maxLoad;
  const hasOptions = state.courseOptions && Object.keys(state.courseOptions).length > 0;

  // Count how many courses have options set
  const optCount = state.courseOptions ? Object.keys(state.courseOptions).length : 0;

  // Build a flat index → label map for course picker
  const courseLabels = (() => {
    const labels = [];
    let k = 0;
    for (let u = 6; u >= 1; u--) {
      for (let j = 0; j < (state.counts[u] || 0); j++) {
        const opts = state.courseOptions && state.courseOptions[k];
        labels.push({ idx: k, units: u, num: j + 1, label: 'Course ' + (k + 1), opts });
        k++;
      }
    }
    return labels;
  })();

  const openOptions = (idx) => {
    set({ editingCourseIdx: idx });
    go('courseoptions');
  };

  return (
    <Screen step={3} footer={<Btn disabled={N === 0} onClick={() => go('target')}>Continue</Btn>}>
      <Title title="Courses to plan for" sub={state.stage === 'fresh' ? 'Add the courses you are registered for this semester. Names are optional.' : 'Add by unit size. Names are optional.'} />
      <div>
        {[1, 2, 3, 4, 5, 6].map((u) => {
          const n = state.counts[u];
          return (
            <div className="stepper" key={u}>
              <b>{u}-unit courses</b>
              <div className="ctl">
                <button type="button" className="sq" aria-label={'Remove one ' + u + '-unit course'} disabled={n === 0} onClick={() => dispatch({ type: 'setCount', units: u, count: n - 1 })}>−</button>
                <span className="count" aria-live="polite">{n}</span>
                <button type="button" className="sq plus" aria-label={'Add one ' + u + '-unit course'} onClick={() => dispatch({ type: 'setCount', units: u, count: n + 1 })}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className={'total-box' + (over ? ' warn' : '')} aria-live="polite">
        {N} units across {list.length} {list.length === 1 ? 'course' : 'courses'}
        {over && <p className="note" style={{ color: 'inherit', fontWeight: 400 }}>That is above the {state.maxLoad}-unit maximum you entered. You can still continue.</p>}
      </div>

      {list.length > 0 && (
        <div className="course-opts-section">
          <button type="button" className="btn link" onClick={() => openOptions(0)} style={{ justifyContent: 'flex-start', paddingLeft: 0 }}>
            Set grade limits for a course ›
          </button>
          {hasOptions && (
            <div className="course-tags">
              {courseLabels.filter((c) => c.opts).map((c) => {
                const o = c.opts;
                const desc = [];
                if (o.locked != null) desc.push('Locked: ' + E.letterOf(o.locked, E.DEFAULTS));
                else {
                  if (o.cap != null) desc.push('Cap: ' + E.letterOf(o.cap, E.DEFAULTS));
                  if (o.floor != null) desc.push('Floor: ' + E.letterOf(o.floor, E.DEFAULTS));
                }
                if (o.difficulty != null) desc.push('Diff: ' + o.difficulty);
                return (
                  <button key={c.idx} type="button" className="course-tag" onClick={() => openOptions(c.idx)}>
                    <b>{c.label}</b> · {c.units}u · {desc.join(', ')}
                  </button>
                );
              })}
            </div>
          )}
          {list.length > 1 && hasOptions && (
            <div className="course-picker">
              {courseLabels.filter((c) => !c.opts).slice(0, 8).map((c) => (
                <button key={c.idx} type="button" className="course-pick-btn" onClick={() => openOptions(c.idx)}>
                  {c.label} · {c.units}u
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}

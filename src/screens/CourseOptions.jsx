import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Seg, ChipRow, Card } from '../components/ui.jsx';
import { GRADES } from '../derive.js';
import * as E from '../engine/engine.js';

const DIFF = ['1', '2', '3', '4', '5'];
const gradeGp = (letter) => E.DEFAULTS.scale[letter];

export default function CourseOptions() {
  const { state, dispatch } = useStore();
  const idx = state.editingCourseIdx ?? 0;
  // Decode which unit-size + offset this index maps to
  const courseInfo = (() => {
    let k = 0;
    for (let u = 6; u >= 1; u--) {
      const n = state.counts[u] || 0;
      for (let j = 0; j < n; j++) {
        if (k === idx) return { units: u, num: j + 1, label: 'Course ' + (k + 1) + ' · ' + u + ' units' };
        k++;
      }
    }
    return { units: 0, num: 1, label: 'Course' };
  })();

  // Load existing options or defaults
  const existing = (state.courseOptions && state.courseOptions[idx]) || {};
  const [status, setStatus] = useState(existing.status || 'toBeGraded');
  const [cap, setCap] = useState(existing.cap != null ? E.letterOf(existing.cap, E.DEFAULTS) : null);
  const [floor, setFloor] = useState(existing.floor != null ? E.letterOf(existing.floor, E.DEFAULTS) : null);
  const [locked, setLocked] = useState(existing.locked != null ? E.letterOf(existing.locked, E.DEFAULTS) : null);
  const [difficulty, setDifficulty] = useState(existing.difficulty != null ? String(existing.difficulty) : null);

  const save = () => {
    const opts = { status };
    if (status === 'locked' && locked != null) {
      opts.locked = gradeGp(locked);
    } else {
      if (cap != null) opts.cap = gradeGp(cap);
      if (floor != null) opts.floor = gradeGp(floor);
    }
    if (difficulty != null) opts.difficulty = Number(difficulty);
    dispatch({ type: 'setCourseOption', idx, opts });
    dispatch({ type: 'back' });
  };

  const clear = () => {
    dispatch({ type: 'setCourseOption', idx, opts: null });
    dispatch({ type: 'back' });
  };

  // Build the hint text
  const hint = (() => {
    if (status === 'locked' && locked) return 'This course is locked at ' + locked + '.';
    if (cap && floor) {
      if (gradeGp(floor) > gradeGp(cap)) return 'Floor is higher than cap – swap them or adjust.';
      return 'Plans will keep this course between ' + floor + ' and ' + cap + '.';
    }
    if (cap) return 'Plans will not go above ' + cap + ' for this course.';
    if (floor) return 'Plans will not go below ' + floor + ' for this course.';
    return null;
  })();

  const hasWarning = cap && floor && gradeGp(floor) > gradeGp(cap);

  return (
    <Screen step={3} footer={
      <>
        <Btn onClick={save} disabled={status === 'locked' && !locked}>Save course</Btn>
        {existing.status != null && <Btn variant="link danger" onClick={clear}>Clear options</Btn>}
      </>
    }>
      <Title title="Course options" sub="Optional. Set limits for one course." />

      <Card>
        <h2>{courseInfo.label}</h2>
        <Seg
          items={[['toBeGraded', 'To be graded'], ['locked', 'Already graded'], ['retake', 'Retake']]}
          value={status}
          onChange={setStatus}
          label="Course status"
        />

        {status === 'locked' ? (
          <>
            <p className="lbl">Grade received</p>
            <ChipRow options={GRADES} value={locked} onPick={setLocked} label="Grade received" />
          </>
        ) : (
          <>
            <p className="lbl">Highest grade I can realistically get</p>
            <ChipRow options={GRADES} value={cap} onPick={(v) => setCap(v === cap ? null : v)} label="Highest grade" />
            <p className="lbl">Lowest grade I will accept</p>
            <ChipRow options={GRADES} value={floor} onPick={(v) => setFloor(v === floor ? null : v)} label="Lowest grade" />
          </>
        )}

        <p className="lbl">How hard is it for me? (1 easy, 5 hard)</p>
        <ChipRow options={DIFF} value={difficulty} onPick={(v) => setDifficulty(v === difficulty ? null : v)} label="Difficulty" />
      </Card>

      {hint && (
        <Card tone={hasWarning ? 'warn' : 'tint'}>
          <p style={{ margin: 0, fontWeight: 600 }}>{hint}</p>
        </Card>
      )}
    </Screen>
  );
}

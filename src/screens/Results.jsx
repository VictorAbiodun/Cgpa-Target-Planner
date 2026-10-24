import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Seg, Field, Card, ChipRow } from '../components/ui.jsx';
import { previous, GRADES } from '../derive.js';
import * as E from '../engine/engine.js';

export default function Results() {
  const { state, set, go, dispatch } = useStore();
  const prev = previous(state);
  const [u, setU] = useState('3');
  const [g, setG] = useState('A');
  const err = prev.errors && prev.errors[0];

  return (
    <Screen step={2} footer={<Btn disabled={!prev.ok} onClick={() => go('courses')}>Continue</Btn>}>
      <Title title="Your results so far" sub={state.method === 'courses' ? 'Pick the units, then the grade you got. No course names needed.' : 'Enter the totals from your result slip or transcript.'} />
      <Seg label="How to enter results" value={state.method} onChange={(method) => set({ method })}
        items={[['summary', 'Summary'], ['points', 'Exact points'], ['courses', 'Course by course']]} />

      {state.method === 'summary' && (
        <Card>
          <Field label="Total units so far" type="number" inputMode="numeric" min="0" step="1" value={state.summary.units}
            onChange={(e) => set({ summary: { ...state.summary, units: e.target.value } })} />
          <Field label="CGPA" type="number" inputMode="decimal" min="0" step="0.01" value={state.summary.cgpa}
            onChange={(e) => set({ summary: { ...state.summary, cgpa: e.target.value } })} error={err} />
          {prev.ok && (
            <div className="total-box">
              {prev.Q} points
              <p className="note" style={{ color: 'inherit', fontWeight: 400 }}>
                {prev.exact ? 'Worked out from your units and CGPA.' : 'Several totals fit your CGPA, so we use the cautious one. Use Exact points for a precise plan.'}
              </p>
            </div>
          )}
        </Card>
      )}

      {state.method === 'points' && (
        <Card>
          <Field label="Total units so far (TNU)" type="number" inputMode="numeric" min="0" step="1" value={state.points.units}
            onChange={(e) => set({ points: { ...state.points, units: e.target.value } })} />
          <Field label="Total quality points (TCP)" type="number" inputMode="numeric" min="0" step="1" value={state.points.points}
            onChange={(e) => set({ points: { ...state.points, points: e.target.value } })} error={err}
            hint="Many transcripts print this next to your CGPA." />
          {prev.ok && prev.cgpa != null && <div className="total-box">CGPA {E.fmt2(prev.cgpa)}</div>}
        </Card>
      )}

      {state.method === 'courses' && (
        <>
          <Card>
            <div className="lbl">Units</div>
            <ChipRow label="Units" options={['1', '2', '3', '4', '5', '6']} value={u} onPick={setU} />
            <div className="lbl">Grade</div>
            <ChipRow label="Grade" options={GRADES} value={g} onPick={setG} />
            <Btn className="sm" onClick={() => dispatch({ type: 'addEntry', units: Number(u), grade: g })}>Add course</Btn>
          </Card>
          <div className="pills" aria-label="Added courses">
            {state.entries.map((e) => (
              <span className="entry" key={e.id}>
                {e.units} units · {e.grade}
                <button type="button" aria-label={'Remove ' + e.units + ' units grade ' + e.grade} onClick={() => dispatch({ type: 'removeEntry', id: e.id })}>✕</button>
              </span>
            ))}
          </div>
          <div className="totals" aria-live="polite">
            <div><small>Units</small><b>{prev.P}</b></div>
            <div><small>Points</small><b>{prev.Q}</b></div>
            <div><small>CGPA so far</small><b className="g">{prev.cgpa == null ? '0.00' : E.fmt2(prev.cgpa)}</b></div>
          </div>
        </>
      )}
    </Screen>
  );
}

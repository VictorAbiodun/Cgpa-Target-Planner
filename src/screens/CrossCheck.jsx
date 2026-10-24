import { useMemo, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Card, Seg, Field, ChipRow, Pill } from '../components/ui.jsx';
import { GRADES, num, describeHypothesis } from '../derive.js';
import * as E from '../engine/engine.js';

const STATUS = {
  match: ['ok', 'Match', 'Your CGPA matches the school’s figure.'],
  close: ['warn', 'Close', 'Very close. This is usually rounding versus cutting off.'],
  mismatch: ['bad', 'Does not match', 'Your figure and the school’s are different.'],
};

export default function CrossCheck() {
  const { state, set, dispatch } = useStore();
  const [u, setU] = useState('3');
  const [g, setG] = useState('A');
  const sc = state.school;

  const school = useMemo(() => {
    if (sc.mode === 'cgpa') {
      const c = num(sc.cgpa);
      return Number.isNaN(c) || c < 0 || c > 5 ? null : { cgpa: c };
    }
    const un = num(sc.units), pt = num(sc.points);
    return Number.isInteger(un) && Number.isInteger(pt) && un >= 0 && pt >= 0 ? { units: un, points: pt } : null;
  }, [sc]);

  const result = useMemo(() => {
    if (!state.entries.length) return null;
    return school ? E.crossCheck({ entries: state.entries, school }) : null;
  }, [state.entries, school]);
  const own = useMemo(() => E.aggregateHistory(state.entries), [state.entries]);

  // Group entries by semester for display
  const semesters = useMemo(() => {
    const order = [], by = {};
    state.entries.forEach((e) => { if (!by[e.semester]) { by[e.semester] = []; order.push(e.semester); } by[e.semester].push(e); });
    return order.map((k) => ({ name: k, items: by[k] }));
  }, [state.entries]);

  return (
    <Screen footer={result ? <Btn onClick={() => dispatch({ type: 'useCrossCheckResults' })}>Use these results for my plan</Btn> : null}>
      <Title title="Cross-check your CGPA" sub="Enter your results and compare the CGPA we calculate with your school’s." />

      <Card>
        <div className="lbl">Units</div>
        <ChipRow label="Units" options={['1', '2', '3', '4', '5', '6']} value={u} onPick={setU} />
        <div className="lbl">Grade</div>
        <ChipRow label="Grade" options={GRADES} value={g} onPick={setG} />
        <Btn className="sm" onClick={() => dispatch({ type: 'addEntry', units: Number(u), grade: g })}>Add course</Btn>
        <div className="chip-row">
          <Btn variant="secondary" className="sm" disabled={!state.entries.length} onClick={() => dispatch({ type: 'undoEntry' })}>Undo last</Btn>
          <Btn variant="secondary" className="sm" onClick={() => dispatch({ type: 'newSemester' })}>Start new semester</Btn>
        </div>
      </Card>

      {semesters.map((s) => (
        <div key={s.name}>
          <h3>{s.name}</h3>
          <div className="pills" style={{ marginTop: 8 }}>
            {s.items.map((e) => (
              <span className="entry" key={e.id}>{e.units} units · {e.grade}
                <button type="button" aria-label={'Remove ' + e.units + ' units grade ' + e.grade} onClick={() => dispatch({ type: 'removeEntry', id: e.id })}>✕</button>
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="totals" aria-live="polite">
        <div><small>Units</small><b>{own.P}</b></div>
        <div><small>Points</small><b>{own.Q}</b></div>
        <div><small>Our CGPA</small><b className="g">{own.cgpa == null ? '0.00' : E.fmt2(own.cgpa)}</b></div>
      </div>

      <h2>Your school’s figure</h2>
      <Seg label="School figure type" value={sc.mode} onChange={(mode) => set({ school: { ...sc, mode } })} items={[['cgpa', 'CGPA'], ['points', 'Units and points']]} />
      {sc.mode === 'cgpa' ? (
        <Field label="School CGPA" type="number" inputMode="decimal" min="0" max="5" step="0.01" value={sc.cgpa} onChange={(e) => set({ school: { ...sc, cgpa: e.target.value } })} />
      ) : (
        <>
          <Field label="School total units" type="number" inputMode="numeric" min="0" step="1" value={sc.units} onChange={(e) => set({ school: { ...sc, units: e.target.value } })} />
          <Field label="School total points" type="number" inputMode="numeric" min="0" step="1" value={sc.points} onChange={(e) => set({ school: { ...sc, points: e.target.value } })} hint="Most precise: units and points leave no room for rounding." />
        </>
      )}

      {result && (
        <Card tone={result.status === 'match' ? 'tint' : result.status === 'close' ? 'warn' : 'bad'}>
          <Pill kind={STATUS[result.status][0]}>{STATUS[result.status][1]}</Pill>
          <p style={{ margin: 0, fontWeight: 600 }}>{STATUS[result.status][2]}</p>
          <p className="note">
            We calculate {result.computed.cgpa2}{result.difference != null ? ' (difference ' + (result.difference > 0 ? '+' : '') + result.difference.toFixed(2) + ')' : ''}
            {result.unitsDiff != null && result.unitsDiff !== 0 ? '. Units differ by ' + Math.abs(result.unitsDiff) : ''}
            {result.pointsDiff != null && result.pointsDiff !== 0 ? '. Points differ by ' + Math.abs(result.pointsDiff) : ''}.
          </p>
          {result.hypotheses.length > 0 && (
            <>
              <h3>Possible reasons</h3>
              <ul className="why">{result.hypotheses.map((h, i) => <li key={i}>{describeHypothesis(h, state.entries)}</li>)}</ul>
              <p className="note">These are possibilities, not certainties. Check your result slip.</p>
            </>
          )}
          {result.hypotheses.length === 0 && result.status !== 'match' && <p className="note">We could not find a simple explanation. Check that every course and grade is entered, and compare with your result slip.</p>}
        </Card>
      )}

      {result && result.semesters.length > 1 && (
        <Card>
          <table className="sem">
            <thead><tr><th>Semester</th><th>GPA</th><th>Running CGPA</th></tr></thead>
            <tbody>{result.semesters.map((s) => <tr key={s.name}><td>{s.name}</td><td>{E.fmt2(s.gpa)}</td><td>{E.fmt2(s.cumulativeCgpa)}</td></tr>)}</tbody>
          </table>
        </Card>
      )}
      <p className="note">Guest mode: nothing is saved.</p>
    </Screen>
  );
}

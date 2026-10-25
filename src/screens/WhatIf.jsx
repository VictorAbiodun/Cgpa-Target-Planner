import { useState, useMemo } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Card, Pill } from '../components/ui.jsx';
import { previous, courseList, targetOf, targetLabel, GRADES } from '../derive.js';
import * as E from '../engine/engine.js';

export default function WhatIf() {
  const { state, dispatch } = useStore();
  const prev = previous(state);
  const courses = useMemo(() => courseList(state), [state.counts, state.courseOptions]);
  const N = courses.reduce((s, c) => s + c.units, 0);
  const isBest = state.target.mode === 'best';
  const target = isBest ? null : targetOf(state);
  const label = targetLabel(state);
  const { P, Q } = prev;

  // The plan grades passed from Result screen via state.whatIfGrades
  const planGrades = state.whatIfGrades || courses.map(() => 5);
  const [grades, setGrades] = useState(() => [...planGrades]);

  const setGrade = (i, gp) => {
    const ng = [...grades];
    ng[i] = gp;
    setGrades(ng);
  };

  const wi = E.whatIf({ P, Q, courses, grades, target: target || 0 });
  const projectedClass = E.classOf(wi.cgpa);
  const meetsTarget = target != null && wi.meetsTarget;
  const pct = target != null && wi.needed > 0 ? Math.min(100, Math.round((wi.points / wi.needed) * 100)) : meetsTarget ? 100 : 0;

  const reset = () => setGrades([...planGrades]);
  const isChanged = (i) => grades[i] !== planGrades[i];
  const anyChanged = grades.some((g, i) => g !== planGrades[i]);

  return (
    <Screen step={5} footer={
      <>
        {anyChanged && <Btn variant="secondary" onClick={reset}>Reset to plan</Btn>}
        <Btn variant="link" onClick={() => dispatch({ type: 'back' })}>‹ Back to result</Btn>
      </>
    }>
      <Title title="What if?" sub="Change a grade and watch your CGPA update." />

      {/* Projected CGPA card */}
      <Card tone="grey">
        <div className="whatif-header">
          <div>
            <small className="whatif-label">Projected CGPA</small>
            <p className="whatif-cgpa">{E.fmt2(wi.cgpa)}</p>
          </div>
          {target != null && (
            <Pill kind={meetsTarget ? 'ok' : 'bad'}>
              {meetsTarget ? 'Meets ' + label : 'Below ' + label}
            </Pill>
          )}
        </div>
        {/* Progress bar */}
        <div className="whatif-track" aria-label={'Progress: ' + pct + '%'}>
          <div
            className={'whatif-fill' + (meetsTarget ? '' : ' short')}
            style={{ width: Math.max(2, pct) + '%' }}
          />
        </div>
        <p className="whatif-points">
          {target != null ? (
            <>
              <b>{wi.points} of {wi.needed} points needed.</b>
              {wi.short > 0 ? ' ' + wi.short + ' point' + (wi.short === 1 ? '' : 's') + ' short.' : ' On target.'}
            </>
          ) : (
            <b>{wi.points} points from {N} units. {projectedClass}.</b>
          )}
        </p>
      </Card>

      {/* Per-course grade rows */}
      <div className="whatif-courses">
        {courses.map((c, i) => {
          const letter = E.letterOf(grades[i], E.DEFAULTS) || '?';
          const changed = isChanged(i);
          // Grade options for this course
          const maxGp = c.cap != null ? c.cap : 5;
          const minGp = c.floor != null ? c.floor : (c.locked != null ? c.locked : 0);
          return (
            <div className="whatif-row" key={i}>
              <span className="whatif-course">
                <b>Course {i + 1}</b> · {c.units} unit{c.units > 1 ? 's' : ''}
              </span>
              <select
                className={'whatif-grade-select' + (changed ? ' changed' : '')}
                value={grades[i]}
                onChange={(e) => setGrade(i, Number(e.target.value))}
                aria-label={'Grade for course ' + (i + 1)}
              >
                {GRADES.map((g) => {
                  const gp = E.DEFAULTS.scale[g];
                  if (c.locked != null && gp !== c.locked) return null;
                  return <option key={g} value={gp}>{g}</option>;
                })}
              </select>
            </div>
          );
        })}
      </div>

      <p className="note">Amber means you changed it from the plan. Spare points are shared across courses.</p>
    </Screen>
  );
}

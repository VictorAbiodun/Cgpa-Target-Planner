import { useMemo, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Card, Pill } from '../components/ui.jsx';
import { previous, courseList, targetOf, targetLabel, MAX_GP } from '../derive.js';
import * as E from '../engine/engine.js';

const f1 = (x) => (Math.round(x * 10 + 1e-9) / 10).toFixed(1);

function rowText(o, N, max) {
  if (o.verdict === 'impossible') return 'Needs ' + o.required + ' points, only ' + N * max + ' available';
  if (o.verdict === 'straightAs') return 'Needs an A in every course';
  if (o.verdict === 'safe') return 'Met if every course is passed';
  return 'Needs an average of ' + f1(o.requiredAvg) + ' across ' + N + ' units';
}
const PILL = { impossible: ['bad', 'Impossible'], straightAs: ['warn', 'Straight As only'], achievable: ['ok', 'Achievable'], safe: ['safe', 'Already safe'] };

function ClassRows({ rows, N, onPick }) {
  return (
    <div className="rows">
      {rows.map((o) => {
        const [kind, text] = PILL[o.verdict];
        const inner = (
          <>
            <span><b>{o.name} · {E.fmt2(o.min)}</b><small>{rowText(o, N, MAX_GP)}</small></span>
            <Pill kind={kind}>{text}</Pill>
          </>
        );
        return onPick && o.verdict !== 'impossible'
          ? <button type="button" key={o.name} className="row" onClick={() => onPick(o.name)}>{inner}</button>
          : <div key={o.name} className="row">{inner}</div>;
      })}
    </div>
  );
}

function ExtraTip({ extra, current, N }) {
  const easier = extra.options.find((o) => o.extra > 0 && (current === 'straightAs' ? o.verdict === 'achievable' || o.verdict === 'safe' : o.verdict !== 'impossible'));
  return (
    <Card tone="tint" className="tip">
      <h2>Could a few extra units help?</h2>
      {easier ? (
        <>
          <p>
            {current === 'impossible' ? 'Your target is out of reach with ' : 'Your target needs straight As with '}{N} units. With <b>{easier.extra} more {easier.extra === 1 ? 'unit' : 'units'}</b> ({N + easier.extra} of a {extra.maxLoad}-unit maximum) it becomes{' '}
            {easier.verdict === 'safe' ? 'safe' : 'achievable, needing an average of ' + f1(easier.requiredAvg)}.
          </p>
          <ul>
            {extra.options.filter((o) => o.extra >= easier.extra).slice(0, 4).map((o) => (
              <li key={o.extra}>+{o.extra} units: {o.verdict === 'straightAs' ? 'straight As' : o.verdict === 'impossible' ? 'still out of reach' : 'average ' + f1(o.requiredAvg)}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>Even at the school maximum of {extra.maxLoad} units, the best possible CGPA is <b>{E.fmt2(extra.bestCgpaAtMaxLoad)}</b>, so this target stays out of reach.</p>
      )}
      <p className="note">Extra units are an estimate: you would need real courses where you can score high. Some schools need approval for extra courses, so check with your department.</p>
    </Card>
  );
}

export default function Result() {
  const { state, set, dispatch } = useStore();
  const prev = previous(state);
  const courses = useMemo(() => courseList(state), [state.counts, state.courseOptions]);
  const N = courses.reduce((s, c) => s + c.units, 0);
  const isBest = state.target.mode === 'best';
  const [view, setView] = useState(state.stage === 'final' && !isBest ? 'overview' : 'plan');
  const [planIdx, setPlanIdx] = useState(0);

  if (!prev.ok || N === 0) {
    return (
      <Screen step={5} footer={<Btn onClick={() => dispatch({ type: 'back' })}>Go back</Btn>}>
        <Title title="Missing details" sub="Add your results and courses first, then come back." />
      </Screen>
    );
  }

  const { P, Q } = prev;
  const target = isBest ? 1 : targetOf(state);
  const a = E.analyze({ P, Q, N, target });
  const label = targetLabel(state);
  const banner = <div className="banner"><span>Guest mode: nothing is saved.</span></div>;
  const startOver = <Btn variant="link" onClick={() => dispatch({ type: 'reset' })}>Start over</Btn>;

  // Final semester overview: every class of degree at once
  if (view === 'overview') {
    const rows = E.classOverview({ P, Q, N });
    return (
      <Screen step={5} footer={<>{banner}{startOver}</>}>
        <span className="pill safe" style={{ alignSelf: 'flex-start' }}>Final semester mode</span>
        <Title title="Your last courses" sub={'Every class of degree and what it takes with your ' + N + ' remaining units.'} />
        <div className="two">
          <div className="best"><small>Best possible</small><b className="g">{E.fmt2(a.bestCgpa)}</b><span>{a.bestClass}</span></div>
          <div><small>Lowest if you pass all</small><b>{E.fmt2(a.lowestCgpa)}</b><span>{a.lowestClass}</span></div>
        </div>
        <ClassRows rows={rows} N={N} onPick={(name) => { set({ target: { ...state.target, mode: 'class', className: name } }); setView('plan'); }} />
        <p className="note">Tap a class to see the grades it needs.{rows.find((r) => r.verdict === 'impossible') ? ' Classes marked Impossible can no longer be reached.' : ''}</p>
      </Screen>
    );
  }

  // Best-I-can-do
  if (isBest) {
    return (
      <Screen step={5} footer={<>{banner}<Btn variant="secondary" onClick={() => dispatch({ type: 'back' })}>Try a target instead</Btn></>}>
        <Card tone="tint" className="verdict">
          <span className="badge">Your best result</span>
          <p className="big">{E.fmt2(a.bestCgpa)} CGPA</p>
          <p>{a.bestClass}. You get there with an A in every course ({N} units).</p>
        </Card>
        <div className="two">
          <div className="best"><small>Best possible</small><b className="g">{E.fmt2(a.bestCgpa)}</b><span>{a.bestClass}</span></div>
          <div><small>Lowest if you pass all</small><b>{E.fmt2(a.lowestCgpa)}</b><span>{a.lowestClass}</span></div>
        </div>
      </Screen>
    );
  }

  const planable = a.verdict === 'achievable' || a.verdict === 'straightAs';
  const plans = planable ? E.planAll(courses, a.R) : [];
  const plan = plans[Math.min(planIdx, plans.length - 1)];
  const floors = planable ? E.lowestAffordable(courses, a.R) : [];
  const floorFor = (u) => {
    const i = courses.findIndex((c) => c.units === u);
    const g = floors[i];
    return g == null ? '–' : E.letterOf(g, E.DEFAULTS);
  };
  const safe = planable ? E.safeFloor(a.R, N) : null;
  const extra = a.verdict === 'impossible' || a.verdict === 'straightAs' ? E.extraUnitsAdvice({ P, Q, courses, target, maxLoad: state.maxLoad }) : null;
  const showExtra = extra && extra.headroom > 0 && extra.helps;

  const overview = E.classOverview({ P, Q, N }).filter((o) => o.verdict !== 'impossible').slice(0, 3);

  let card;
  if (a.verdict === 'impossible') {
    card = (
      <Card tone="bad" className="verdict">
        <span className="badge bad">Impossible</span>
        <p className="big">{label} is out of reach</p>
        <p>You would need an average of {f1(a.requiredAvg)} across your {N} units, and the maximum is {MAX_GP.toFixed(1)}. Your best possible CGPA is {E.fmt2(a.bestCgpa)}, which is {a.bestClass}.</p>
      </Card>
    );
  } else if (a.verdict === 'straightAs') {
    card = (
      <Card tone="warn" className="verdict">
        <span className="badge warn">Straight As only</span>
        <p className="big">An A in every course</p>
        <p>That is the only way to reach {label} with {N} units. Best possible CGPA: {E.fmt2(a.bestCgpa)}.</p>
      </Card>
    );
  } else if (a.verdict === 'safe') {
    card = (
      <Card tone="tint" className="verdict">
        <span className="badge">Already safe</span>
        <p className="big">You are on track</p>
        <p>You reach {label} as long as every course is passed. Lowest possible CGPA: {E.fmt2(a.lowestCgpa)}. Best: {E.fmt2(a.bestCgpa)}.</p>
      </Card>
    );
  } else {
    card = (
      <Card tone="tint" className="verdict">
        <span className="badge">Achievable</span>
        <p className="big">{f1(a.requiredAvg)} average</p>
        <p>needed across your {N} units to reach {label}. That is {a.R} of {a.maxPoints} possible points. Best possible CGPA: {E.fmt2(a.bestCgpa)}.</p>
      </Card>
    );
  }

  return (
    <Screen step={5} footer={<>{banner}<Btn variant="secondary" onClick={() => dispatch({ type: 'back' })}>Try a different target</Btn>{startOver}</>}>
      {card}

      {plan && (
        <>
          {plans.length > 1 && (
            <div className="tabs" role="group" aria-label="Plan style">
              {plans.map((p, i) => <button key={p.style} type="button" className={i === planIdx ? 'on' : ''} aria-pressed={i === planIdx} onClick={() => setPlanIdx(i)}>{p.label}</button>)}
            </div>
          )}
          {plan.groups.map((g, i) => (
            <div className="grp" key={g.units} style={{ animationDelay: i * 80 + 'ms' }}>
              <div>
                <b>{g.count} {g.count === 1 ? 'course' : 'courses'} · {g.units} units</b>
                <small>Aim: <span className="aim">{g.mix}</span></small>
              </div>
              <div className="floor"><small>Floor</small><b>{floorFor(g.units)}</b></div>
            </div>
          ))}
          <p className="note">Floor is the lowest grade in one course if you get A in the rest. Spare points are shared.</p>
          {safe != null && safe < MAX_GP && <p className="note">Or aim for at least a {E.letterOf(safe, E.DEFAULTS)} in every course.</p>}
        </>
      )}

      {a.verdict === 'impossible' && overview.length > 0 && (
        <>
          <h2>What you can still reach</h2>
          <ClassRows rows={overview} N={N} />
        </>
      )}

      {showExtra && <ExtraTip extra={extra} current={a.verdict} N={N} />}
      {extra && extra.overloaded && <Card tone="warn"><p className="note">Your courses are already above the {state.maxLoad}-unit maximum, so there is no room for extra units.</p></Card>}
    </Screen>
  );
}

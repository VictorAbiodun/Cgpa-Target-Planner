import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Seg, Opt, Field, Card, Chip } from '../components/ui.jsx';
import { num, MAX_GP } from '../derive.js';
import * as E from '../engine/engine.js';

const QUICK = ['4.50', '4.00', '3.50', '3.00'];

export default function Target() {
  const { state, set, go } = useStore();
  const t = state.target;
  const setT = (patch) => set({ target: { ...t, ...patch } });
  const cg = num(t.cgpa);
  const cgOk = !Number.isNaN(cg) && cg >= 0 && cg <= MAX_GP;
  const valid = t.mode === 'best' || t.mode === 'class' || cgOk;
  return (
    <Screen step={4} footer={<Btn disabled={!valid} onClick={() => go('result')}>{t.mode === 'best' ? 'Show my best result' : 'See my plan'}</Btn>}>
      <Title title="Your target" sub="Pick a class of degree, a CGPA, or the best you can do." />
      <Seg label="Target type" value={t.mode} onChange={(mode) => setT({ mode })}
        items={[['cgpa', 'CGPA'], ['class', 'Class of degree'], ['best', 'Best I can do']]} />
      {t.mode === 'class' && E.DEFAULTS.thresholds.slice(0, 3).map((c) => (
        <Opt key={c.name} selected={t.className === c.name} onClick={() => setT({ className: c.name })}
          title={c.name} sub={E.fmt2(c.min) + ' and above'} />
      ))}
      {t.mode === 'cgpa' && (
        <Card>
          <Field label="Target CGPA" type="number" inputMode="decimal" min="0" max={MAX_GP} step="0.01" value={t.cgpa}
            onChange={(e) => setT({ cgpa: e.target.value })}
            error={t.cgpa !== '' && !cgOk ? 'Enter a number from 0 to ' + MAX_GP.toFixed(2) : undefined}
            hint="On a 5.0 scale. First Class starts at 4.50." />
          <div className="lbl">Quick picks</div>
          <div className="chip-row">{QUICK.map((q) => <Chip key={q} selected={t.cgpa === q} onClick={() => setT({ cgpa: q })}>{q}</Chip>)}</div>
        </Card>
      )}
      {t.mode === 'best' && (
        <Card tone="tint">
          <h2 className="g">No target needed</h2>
          <p className="note">We skip the target and show the highest CGPA you can still reach, with the grades that get you there.</p>
        </Card>
      )}
    </Screen>
  );
}

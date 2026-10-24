import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Field, Card } from '../components/ui.jsx';

export default function Setup() {
  const { state, set, go } = useStore();
  const [val, setVal] = useState(String(state.maxLoad));
  const n = Number(val);
  const valid = val !== '' && Number.isInteger(n) && n >= 1 && n <= 60;
  const onChange = (e) => {
    setVal(e.target.value);
    const v = Number(e.target.value);
    if (e.target.value !== '' && Number.isInteger(v) && v >= 1 && v <= 60) set({ maxLoad: v });
  };
  return (
    <Screen footer={<Btn disabled={!valid} onClick={() => go('stage')}>Continue</Btn>}>
      <Title title="Your school" sub="One quick question so the advice fits your school." />
      <Field
        label="Most units your school allows in one semester"
        type="number" inputMode="numeric" min="1" max="60" step="1"
        value={val} onChange={onChange}
        hint="Most schools allow around 24. We use this to tell you if a few extra units could put your target within reach."
        error={val !== '' && !valid ? 'Enter a whole number from 1 to 60' : undefined}
      />
      <Card tone="grey">
        <p className="note">Grades use the usual 5-point scale (A = 5 down to F = 0) with E as the lowest pass. Other scales are coming later.</p>
      </Card>
    </Screen>
  );
}

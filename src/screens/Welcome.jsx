import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Logo, Title, Btn, Grow } from '../components/ui.jsx';

export default function Welcome() {
  const { go } = useStore();
  const [note, setNote] = useState(false);
  return (
    <Screen back={false}>
      <Grow />
      <Logo />
      <Title big title="CGPA Target Planner" sub="Know the grade you need in every course." />
      <div className="field">
        <label htmlFor="email">School email</label>
        <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="name@yourschool.edu.ng" />
      </div>
      <Btn onClick={() => setNote(true)}>Send me a code</Btn>
      <p className="note" role="status">
        {note ? 'Sign-in is coming soon. You can continue as a guest for now.' : 'We email a one-time code. No password needed.'}
      </p>
      <div className="divider">or</div>
      <Btn variant="secondary" onClick={() => go('setup')}>Continue without signing in</Btn>
      <p className="note">Guest mode: nothing is saved.</p>
      <Btn variant="link" onClick={() => go('crosscheck')}>Just cross-check my CGPA</Btn>
      <Grow />
    </Screen>
  );
}

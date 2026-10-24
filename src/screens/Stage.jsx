import { useStore } from '../state/store.jsx';
import { Screen, Title, Btn, Opt, Grow } from '../components/ui.jsx';

export default function Stage() {
  const { state, set, go } = useStore();
  const pick = (stage) => set({ stage });
  const next = () => go(state.stage === 'fresh' ? 'courses' : 'results');
  return (
    <Screen step={1} footer={<Btn disabled={!state.stage} onClick={next}>Continue</Btn>}>
      <Title title="Where are you in your degree?" sub="This decides what we ask next." />
      <Opt selected={state.stage === 'fresh'} onClick={() => pick('fresh')} title="I have no results yet" sub="Fresh 100 level, nothing graded" />
      <Opt selected={state.stage === 'has'} onClick={() => pick('has')} title="I have results from earlier semesters" sub="Add them by CGPA, points, or course by course" />
      <Opt selected={state.stage === 'final'} onClick={() => pick('final')} title="This is my final semester" sub="Only these courses are left" />
      <Grow />
    </Screen>
  );
}

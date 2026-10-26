
import { useStore } from './state/store.jsx';
import Welcome from './screens/Welcome.jsx';
import Setup from './screens/Setup.jsx';
import Stage from './screens/Stage.jsx';
import Results from './screens/Results.jsx';
import Courses from './screens/Courses.jsx';
import Target from './screens/Target.jsx';
import Result from './screens/Result.jsx';
import CrossCheck from './screens/CrossCheck.jsx';
import CourseOptions from './screens/CourseOptions.jsx';
import WhatIf from './screens/WhatIf.jsx';
import { Analytics } from '@vercel/analytics/react';

const SCREENS = {
  welcome: Welcome,
  setup: Setup,
  stage: Stage,
  results: Results,
  courses: Courses,
  target: Target,
  result: Result,
  crosscheck: CrossCheck,
  courseoptions: CourseOptions,
  whatif: WhatIf,
};

export default function App() {
  const { state } = useStore();
  const Current = SCREENS[state.screen] || Welcome;

  return (
    <div className="app">
      <Current />
      <Analytics />
    </div>
  );
}

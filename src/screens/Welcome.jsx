import { useState, useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Logo, Title, Btn, Grow } from '../components/ui.jsx';

export default function Welcome() {
  const { go } = useStore();
  const [note, setNote] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Capture the browser's install prompt so we can show an install button
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <Screen back={false}>
      <Grow />
      <Logo />
      <Title big title="CGPA Target Planner" sub="Know the grade you need in every course." />

      {/* Coming soon banner */}
      <div className="coming-soon-bar" role="status">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Sign-in is coming soon – for now, use guest mode below.
      </div>

      <div className="field">
        <label htmlFor="email">School email</label>
        <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="name@yourschool.edu.ng" disabled />
      </div>
      <Btn disabled onClick={() => setNote(true)}>Send me a code</Btn>
      <p className="note" role="status">
        {note ? 'Sign-in is coming soon. You can continue as a guest for now.' : 'We email a one-time code. No password needed.'}
      </p>
      <div className="divider">or</div>
      <Btn variant="secondary" onClick={() => go('setup')}>Continue without signing in</Btn>
      <p className="note">Guest mode: nothing is saved.</p>
      <Btn variant="link" onClick={() => go('crosscheck')}>Just cross-check my CGPA</Btn>

      {/* PWA install banner */}
      {installPrompt && !installed && (
        <button type="button" className="install-banner" onClick={handleInstall}>
          <span className="install-icon" aria-hidden="true">+</span>
          <span className="install-text">
            <b>Install this app</b>
            <small>Add to your home screen for quick access, even offline.</small>
          </span>
        </button>
      )}

      <Grow />
    </Screen>
  );
}

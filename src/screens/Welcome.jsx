import { useState, useEffect } from 'react';
import { useStore } from '../state/store.jsx';
import { Screen, Logo, Title, Btn, Grow, Field, Seg } from '../components/ui.jsx';
import {
  signInWithGoogle,
  sendMagicSignInLink,
  checkIsSignInWithEmailLink,
  completeMagicSignIn,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  sendPasswordReset,
  signOutStudent,
  getAuthErrorMessage,
} from '../storage/auth.js';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function Welcome() {
  const { state, dispatch, go } = useStore();
  const [authMode, setAuthMode] = useState('magic'); // 'magic' | 'password'
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'err', text: '' }
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  // Check for email magic link arrival
  useEffect(() => {
    if (typeof window !== 'undefined' && checkIsSignInWithEmailLink()) {
      setLoading(true);
      completeMagicSignIn()
        .then(() => {
          setMessage({ type: 'ok', text: 'Successfully signed in! Welcome back.' });
        })
        .catch((err) => {
          setMessage({ type: 'err', text: getAuthErrorMessage(err) });
        })
        .finally(() => setLoading(false));
    }
  }, []);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

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

  const handleGoogleSignIn = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      setMessage({ type: 'ok', text: 'Successfully signed in with Google!' });
    } catch (err) {
      setMessage({ type: 'err', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'err', text: 'Please enter your email address.' });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      await sendMagicSignInLink(email.trim());
      setMessage({
        type: 'ok',
        text: 'Sign-in link sent! Please check your inbox (and spam folder) to sign in.',
      });
    } catch (err) {
      setMessage({ type: 'err', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password) {
      setMessage({ type: 'err', text: 'Please enter both your email and password.' });
      return;
    }
    if (isSignUp) {
      if (!confirmPassword) {
        setMessage({ type: 'err', text: 'Please confirm your password.' });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'err', text: 'Passwords do not match. Please re-enter your password.' });
        return;
      }
      if (password.length < 6) {
        setMessage({ type: 'err', text: 'Password should be at least 6 characters.' });
        return;
      }
    }
    setMessage(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmailPassword(email.trim(), password);
        setMessage({ type: 'ok', text: 'Account created! Welcome to CGPA Target Planner.' });
      } else {
        await signInWithEmailPassword(email.trim(), password);
        setMessage({ type: 'ok', text: 'Signed in successfully! Welcome back.' });
      }
    } catch (err) {
      setMessage({ type: 'err', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setMessage({ type: 'err', text: 'Enter your email above first, then click forgot password.' });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setMessage({ type: 'ok', text: 'Password reset link sent to your email.' });
    } catch (err) {
      setMessage({ type: 'err', text: getAuthErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen back={false}>
      <Grow />
      <Logo />
      <Title big title="CGPA Target Planner" sub="Know the grade you need in every course." />

      {state.user ? (
        <div className="auth-box">
          <div className="account-badge">
            <div className="account-badge-info">
              <b>Signed in</b>
              <small>{state.user.email || 'Student'}</small>
            </div>
            <button
              type="button"
              className="btn sm link"
              onClick={() => {
                signOutStudent(state.user?.uid);
                dispatch({ type: 'reset' });
                setMessage(null);
              }}
            >
              Sign out
            </button>
          </div>
          <Btn onClick={() => go(state.stage ? 'courses' : 'setup')}>
            Continue your plan ›
          </Btn>
        </div>
      ) : (
        <div className="auth-box">
          {/* Method 1: Google Sign-in */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="divider">or with email</div>

          {/* Switcher for Method 2 (Magic Link) & Method 3 (Password) */}
          <Seg
            items={[
              ['magic', 'Magic link'],
              ['password', 'Password'],
            ]}
            value={authMode}
            onChange={(m) => {
              setAuthMode(m);
              setMessage(null);
            }}
            label="Sign-in method"
          />

          {authMode === 'magic' ? (
            <form className="auth-form" onSubmit={handleSendMagicLink}>
              <Field
                label="School email"
                id="magic-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@yourschool.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Btn onClick={handleSendMagicLink} disabled={loading || !email.trim()}>
                {loading ? 'Sending link…' : 'Send sign-in link'}
              </Btn>
              <p className="hint">We’ll email a one-time sign-in link. No password needed.</p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handlePasswordAuth}>
              <Field
                label="School email"
                id="pwd-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@yourschool.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Field
                label="Password"
                id="pwd-password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {isSignUp && (
                <Field
                  label="Confirm password"
                  id="pwd-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              )}
              <Btn
                onClick={handlePasswordAuth}
                disabled={loading || !email.trim() || !password || (isSignUp && !confirmPassword)}
              >
                {loading
                  ? 'Please wait…'
                  : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
              </Btn>
              <div className="auth-sub-actions">
                <button
                  type="button"
                  className="auth-toggle-btn"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setConfirmPassword('');
                    setMessage(null);
                  }}
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
                {!isSignUp && (
                  <button
                    type="button"
                    className="auth-toggle-btn"
                    onClick={handleForgotPassword}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          )}

          {message && (
            <div
              className={`auth-msg ${message.type}`}
              role={message.type === 'err' ? 'alert' : 'status'}
            >
              {message.text}
            </div>
          )}
        </div>
      )}

      <div className="divider">or</div>
      <Btn variant="secondary" onClick={() => go('setup')}>
        Continue without signing in
      </Btn>
      <p className="note">Guest mode: nothing is saved.</p>
      <Btn variant="link" onClick={() => go('crosscheck')}>
        Just cross-check my CGPA
      </Btn>

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

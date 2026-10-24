import { useStore } from '../state/store.jsx';

export function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="var(--g)" strokeWidth="3" />
      <circle cx="20" cy="20" r="8" fill="var(--g)" />
    </svg>
  );
}

// Page frame: optional header (back + step bars), scrolling body, pinned footer buttons.
export function Screen({ step, back = true, children, footer }) {
  const { state, dispatch } = useStore();
  const canBack = back && state.stack.length > 0;
  return (
    <main className="screen">
      {(canBack || step) && (
        <header className="head">
          <div className="head-row">
            {canBack ? (
              <button type="button" className="back" onClick={() => dispatch({ type: 'back' })} aria-label="Go back">‹ Back</button>
            ) : (
              <span />
            )}
            {step ? <span className="step">Step {step} of 5</span> : null}
          </div>
          {step ? (
            <div className="bars" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}
            </div>
          ) : null}
        </header>
      )}
      <div className="body">{children}</div>
      {footer ? <div className="foot">{footer}</div> : null}
    </main>
  );
}

export function Title({ title, sub, big }) {
  return (
    <div className="title">
      <h1 className={big ? 'h1 big' : 'h1'}>{title}</h1>
      {sub ? <p className={big ? 'sub lg' : 'sub'}>{sub}</p> : null}
    </div>
  );
}

export function Btn({ variant = 'primary', className = '', children, ...p }) {
  return <button type="button" className={('btn ' + variant + ' ' + className).trim()} {...p}>{children}</button>;
}

export function Chip({ selected, children, ...p }) {
  return <button type="button" className={'chip' + (selected ? ' sel' : '')} aria-pressed={!!selected} {...p}>{children}</button>;
}

export function ChipRow({ options, value, onPick, label }) {
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {options.map((o) => <Chip key={o} selected={o === value} onClick={() => onPick(o)}>{o}</Chip>)}
    </div>
  );
}

export function Opt({ selected, title, sub, ...p }) {
  return (
    <button type="button" className={'opt' + (selected ? ' sel' : '')} aria-pressed={!!selected} {...p}>
      <b>{title}</b>
      {sub ? <span>{sub}</span> : null}
    </button>
  );
}

export function Seg({ items, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([v, t]) => (
        <button key={v} type="button" className={v === value ? 'on' : ''} aria-pressed={v === value} onClick={() => onChange(v)}>{t}</button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, id, ...p }) {
  const fid = id || 'f-' + label.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      <input id={fid} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? fid + '-e' : hint ? fid + '-h' : undefined} {...p} />
      {hint && !error ? <p id={fid + '-h'} className="hint">{hint}</p> : null}
      {error ? <p id={fid + '-e'} className="err" role="alert">{error}</p> : null}
    </div>
  );
}

export function Card({ children, tone, className = '' }) {
  return <section className={'card' + (tone ? ' ' + tone : '') + ' ' + className}>{children}</section>;
}

export function Pill({ kind = 'safe', children }) {
  return <span className={'pill ' + kind}>{children}</span>;
}

export const Grow = () => <div className="grow" />;

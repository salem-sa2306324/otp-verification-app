import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import './OtpAuth.css';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

const COUNTRIES = [
  { label: 'QA +974', code: '+974' },
  { label: 'US +1', code: '+1' },
  { label: 'UK +44', code: '+44' },
  { label: 'AE +971', code: '+971' },
  { label: 'SA +966', code: '+966' },
  { label: 'EG +20', code: '+20' },
  { label: 'IN +91', code: '+91' },
  { label: 'DE +49', code: '+49' },
  { label: 'FR +33', code: '+33' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function maskTarget(mode, value) {
  if (mode === 'email') {
    const [name, domain] = value.split('@');
    return `${name[0]}${'•'.repeat(Math.max(name.length - 1, 2))}@${domain}`;
  }
  return value.slice(0, 4) + '•'.repeat(Math.max(value.length - 8, 2)) + value.slice(-4);
}

/**
 * Email + phone OTP sign-in backed by Supabase Auth.
 * Props:
 *   onVerified(session, user)  optional; called after a successful verification.
 *                              The session is also stored by Supabase automatically.
 */
export default function OtpAuth({ onVerified }) {
  const [step, setStep] = useState('request'); // request | verify
  const [mode, setMode] = useState('email');   // email | phone
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('+974');
  const [phone, setPhone] = useState('');
  const [target, setTarget] = useState('');    // normalized email or E.164 phone
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const boxes = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function normalize() {
    if (mode === 'email') {
      const v = email.trim().toLowerCase();
      if (!EMAIL_RE.test(v)) return { error: 'Enter a valid email address.' };
      return { value: v };
    }
    const national = phone.replace(/[\s\-()]/g, '').replace(/^0+/, '');
    if (!/^\d{6,14}$/.test(national)) return { error: 'Enter a valid phone number (digits only).' };
    return { value: country + national };
  }

  async function sendCode(value) {
    const payload = mode === 'email' ? { email: value } : { phone: value };
    const { error } = await supabase.auth.signInWithOtp(payload);
    return error;
  }

  async function handleSend(e) {
    e?.preventDefault();
    setError('');
    const n = normalize();
    if (n.error) return setError(n.error);

    setBusy(true);
    const err = await sendCode(n.value);
    setBusy(false);
    if (err) return setError(err.message);

    setTarget(n.value);
    setDigits(Array(CODE_LENGTH).fill(''));
    setCooldown(RESEND_SECONDS);
    setStep('verify');
    setTimeout(() => boxes.current[0]?.focus(), 0);
  }

  async function handleResend() {
    setError('');
    setBusy(true);
    const err = await sendCode(target);
    setBusy(false);
    if (err) return setError(err.message);
    setDigits(Array(CODE_LENGTH).fill(''));
    setCooldown(RESEND_SECONDS);
    boxes.current[0]?.focus();
  }

  async function handleVerify(e) {
    e?.preventDefault();
    const token = digits.join('');
    if (token.length < CODE_LENGTH) return setError(`Enter all ${CODE_LENGTH} digits.`);

    setError('');
    setBusy(true);
    const params =
      mode === 'email'
        ? { email: target, token, type: 'email' }
        : { phone: target, token, type: 'sms' };
    const { data, error: err } = await supabase.auth.verifyOtp(params);
    setBusy(false);

    if (err) {
      setError(err.message || 'That code is incorrect or has expired.');
      return;
    }
    onVerified?.(data.session, data.user);
  }

  function setDigit(i, raw) {
    const v = raw.replace(/\D/g, '').slice(-1);
    setDigits((d) => d.map((x, k) => (k === i ? v : x)));
    if (v && i < CODE_LENGTH - 1) boxes.current[i + 1]?.focus();
  }

  function onKeyDown(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
  }

  function onPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: CODE_LENGTH }, (_, k) => text[k] ?? ''));
    boxes.current[Math.min(text.length, CODE_LENGTH - 1)]?.focus();
  }

  if (step === 'verify') {
    return (
      <main className="otp-card">
        <h1>Enter the code</h1>
        <p className="otp-sub">Sent to <b>{maskTarget(mode, target)}</b></p>

        <form onSubmit={handleVerify}>
          <div className="otp-boxes" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (boxes.current[i] = el)}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <div className="otp-error" role="alert">{error}</div>
          <button className="otp-btn" type="submit" disabled={busy}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <div className="otp-meta">
          <button className="otp-link" type="button" onClick={() => { setStep('request'); setError(''); }}>
            ← Change {mode === 'email' ? 'email' : 'number'}
          </button>
          <button
            className="otp-link"
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || busy}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="otp-card">
      <h1>Verify your identity</h1>
      <p className="otp-sub">We’ll send a {CODE_LENGTH}-digit code to your email or phone.</p>

      <div className="otp-tabs" role="tablist">
        {['email', 'phone'].map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={mode === m ? 'on' : ''}
            onClick={() => { setMode(m); setError(''); }}
          >
            {m === 'email' ? 'Email' : 'Phone'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend}>
        {mode === 'email' ? (
          <>
            <label htmlFor="otp-email">Email address</label>
            <input
              id="otp-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        ) : (
          <>
            <label htmlFor="otp-phone">Phone number</label>
            <div className="otp-row">
              <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country code">
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <input
                id="otp-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="5512 3456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="otp-error" role="alert">{error}</div>
        <button className="otp-btn" type="submit" disabled={busy}>
          {busy ? 'Sending…' : 'Send code'}
        </button>
      </form>
    </main>
  );
}

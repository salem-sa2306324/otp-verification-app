import { useEffect, useState } from 'react';
import OtpAuth from './OtpAuth';
import { supabase, isConfigured } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    // Restore a previous sign-in (Supabase keeps the session in localStorage).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    // Stay in sync with sign-in, sign-out and token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isConfigured) {
    return (
      <div className="page">
        <section className="panel">
          <h1>Supabase isn’t connected</h1>
          <p>
            Copy <code>.env.example</code> to <code>.env</code>, add your project URL and anon key,
            then restart <code>npm run dev</code>.
          </p>
        </section>
      </div>
    );
  }

  if (loading) return <div className="page" aria-busy="true" />;

  if (session) {
    const { user } = session;
    return (
      <div className="page">
        <section className="panel">
          <h1>You’re signed in</h1>
          <p>This is the page your users see after verifying a code.</p>
          <dl>
            {user.email && (<><dt>Email</dt><dd>{user.email}</dd></>)}
            {user.phone && (<><dt>Phone</dt><dd>+{user.phone}</dd></>)}
            <dt>User ID</dt><dd>{user.id}</dd>
          </dl>
          <button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <OtpAuth />
    </div>
  );
}

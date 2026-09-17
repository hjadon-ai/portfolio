import { useEffect, useState } from 'react';

const emptyForm = { name: '', email: '', password: '' };

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Something went wrong.');
  return body;
}

function AuthPanel({ mode, onModeChange, onAuthenticated }) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const body = isSignup
        ? form
        : { email: form.email, password: form.password };
      const result = await apiRequest(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (isSignup) {
        setMessage(result.message);
        setForm({ ...emptyForm, email: form.email });
        onModeChange('login');
      } else {
        onAuthenticated(result.user);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-tabs" aria-label="Account options">
        <button
          className={!isSignup ? 'active' : ''}
          type="button"
          onClick={() => onModeChange('login')}
        >
          Login
        </button>
        <button
          className={isSignup ? 'active' : ''}
          type="button"
          onClick={() => onModeChange('signup')}
        >
          Sign up
        </button>
      </div>

      <p className="eyebrow">Local account</p>
      <h2 id="auth-title">{isSignup ? 'Create your profile.' : 'Welcome back.'}</h2>
      <form onSubmit={submit}>
        {isSignup && (
          <label>
            Name
            <input name="name" value={form.name} onChange={updateField} required maxLength="80" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            required
            minLength="8"
          />
        </label>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Login'}
        </button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
    </aside>
  );
}

function VerificationResult({ token }) {
  const [state, setState] = useState({ status: 'loading', message: 'Checking your verification link…' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'This verification link is missing its token.' });
      return;
    }

    apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
      .then((result) => setState({ status: 'success', message: result.message }))
      .catch((error) => setState({ status: 'error', message: error.message }));
  }, [token]);

  return (
    <main className="verification-shell">
      <section className="verification-card">
        <p className="eyebrow">Email verification</p>
        <h1>{state.status === 'success' ? 'Email verified.' : state.status === 'error' ? 'Link not accepted.' : 'One moment.'}</h1>
        <p>{state.message}</p>
        {state.status !== 'loading' && (
          <a className="button primary link-button" href="/">Continue</a>
        )}
      </section>
    </main>
  );
}

function VerificationRequired({ user, onLogout }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    setMessage('');
    try {
      const result = await apiRequest('/api/auth/resend-verification', { method: 'POST' });
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="verification-shell">
      <section className="verification-card">
        <p className="eyebrow">Verification required</p>
        <h1>Check your email, {user.name}.</h1>
        <p>
          We sent a verification link to <strong>{user.email}</strong>. Verifying confirms that
          you own this address and helps protect account recovery. Your profile will open after
          verification.
        </p>
        <div className="verification-actions">
          <button className="button primary" type="button" onClick={resend} disabled={busy}>
            {busy ? 'Sending…' : 'Resend verification email'}
          </button>
          <button className="button quiet" type="button" onClick={onLogout}>Log out</button>
        </div>
        {message && <p className="form-message" role="status">{message}</p>}
      </section>
    </main>
  );
}

function PublicHome({ onAuthenticated }) {
  const [mode, setMode] = useState('login');

  return (
    <>
      <header className="site-header shell">
        <a className="brand" href="#top">Astitva<span>.</span></a>
        <nav aria-label="Main navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <button className="button quiet" type="button" onClick={() => setMode('login')}>Login</button>
        </nav>
      </header>

      <main id="top" className="shell">
        <section className="hero">
          <div>
            <p className="eyebrow">Portfolio & personal workspace</p>
            <h1>Making room for <em>possibility.</em></h1>
            <p className="lede">A local space for projects, ideas, and the work that shapes what comes next.</p>
          </div>
          <AuthPanel mode={mode} onModeChange={setMode} onAuthenticated={onAuthenticated} />
        </section>

        <section id="work" className="content-section">
          <div className="section-heading">
            <p className="eyebrow">Selected work</p>
            <h2>Projects will live here.</h2>
          </div>
          <div className="project-grid">
            <article><span>01</span><h3>Project one</h3><p>Project details will be added in a later step.</p></article>
            <article><span>02</span><h3>Project two</h3><p>Project details will be added in a later step.</p></article>
          </div>
        </section>

        <section id="about" className="content-section about">
          <div><p className="eyebrow">About</p><h2>A place to introduce your story.</h2></div>
          <p>Your biography, experience, and interests can be added after the authenticated flow is reviewed.</p>
        </section>
      </main>
    </>
  );
}

function Profile({ user, onLogout }) {
  return (
    <main className="profile-shell">
      <aside className="profile-sidebar">
        <a className="brand light" href="#profile">Astitva<span>.</span></a>
        <nav aria-label="Profile navigation">
          <a className="active" href="#profile">Overview</a>
          <a href="#projects">Projects</a>
          <a href="#notes">Notes</a>
        </nav>
        <button className="button sidebar-logout" type="button" onClick={onLogout}>Log out</button>
      </aside>

      <section className="profile-content" id="profile">
        <header className="profile-header">
          <div><p className="eyebrow">Local profile</p><h1>Good to see you, {user.name}.</h1></div>
          <div className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
        </header>

        <section className="profile-card">
          <div>
            <p className="eyebrow">Your account</p>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
          <span className="status"><i></i> Local session active</span>
        </section>

        <section className="profile-grid" id="projects">
          <article><p className="eyebrow">Projects</p><strong>2</strong><span>Sample placeholders</span></article>
          <article><p className="eyebrow">Profile</p><strong>25%</strong><span>Ready for your content</span></article>
          <article><p className="eyebrow">Database</p><strong>Local</strong><span>MongoDB connection</span></article>
        </section>

        <section className="workspace-card" id="notes">
          <p className="eyebrow">Workspace</p>
          <h2>Your private area starts here.</h2>
          <p>This is a sample layout. We can decide what real profile content belongs here next.</p>
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  const location = new URL(window.location.href);
  if (location.pathname === '/verify-email') {
    return <VerificationResult token={location.searchParams.get('token')} />;
  }

  if (loading) return <div className="loading">Loading Astitva…</div>;
  if (!user) return <PublicHome onAuthenticated={setUser} />;
  if (!user.emailVerified) return <VerificationRequired user={user} onLogout={logout} />;
  return <Profile user={user} onLogout={logout} />;
}

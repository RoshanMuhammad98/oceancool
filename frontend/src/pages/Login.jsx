import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { ApiError } from '../lib/api.js';
import { Field } from '../ui/Field.jsx';
import { BrandMark } from '../ui/Icons.jsx';
import { ButtonSpinner } from '../ui/States.jsx';

/**
 * Sign in. One card, two fields, a large button — the whole screen is reachable with a
 * thumb and readable in a van.
 */
export default function Login() {
  const { signedIn, signIn } = useAuth();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  if (signedIn) {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const next = {};
    if (!username.trim()) next.username = 'Username is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    setFailure('');
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      await signIn(username.trim(), password);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) setErrors(error.fieldErrors);
      setFailure(error.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <span className="mark">
            <BrandMark />
          </span>
          <h1>OceanCool</h1>
          <p>Customer, service and payment records</p>
        </div>

        <form className="form" onSubmit={submit} noValidate>
          <Field label="Username" required error={errors.username}>
            {(props) => (
              <input
                {...props}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                autoFocus
              />
            )}
          </Field>

          <Field label="Password" required error={errors.password}>
            {(props) => (
              <input
                {...props}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            )}
          </Field>

          {failure ? (
            <div className="errorbox" role="alert">
              <span>{failure}</span>
            </div>
          ) : null}

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? <ButtonSpinner /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

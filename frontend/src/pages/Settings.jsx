import { useState } from 'react';
import { TopBar } from '../components/AppShell.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useInstallPrompt } from '../hooks/useInstallPrompt.js';
import { useTheme } from '../hooks/useTheme.js';
import { Segmented } from '../ui/Field.jsx';
import { IconInstall, IconLogout } from '../ui/Icons.jsx';
import { Confirm } from '../ui/Confirm.jsx';

const THEMES = [
  { value: 'system', label: 'Phone' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Account, appearance, and getting the app onto the home screen. */
export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, choose } = useTheme();
  const install = useInstallPrompt();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  return (
    <>
      <TopBar eyebrow="OceanCool" title="Settings" />

      <div className="page">
        <div className="panel">
          <div className="panel__head">
            <h3>Account</h3>
          </div>
          <div className="panel__body">
            <dl className="kv">
              <dt>Signed in</dt>
              <dd>{user?.displayName || user?.username}</dd>
              <dt>Username</dt>
              <dd className="mono">{user?.username}</dd>
            </dl>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => setConfirmingSignOut(true)}
              style={{ alignSelf: 'flex-start' }}
            >
              <IconLogout />
              Sign out
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h3>Appearance</h3>
          </div>
          <div className="panel__body">
            <Segmented
              ariaLabel="Colour theme"
              options={THEMES}
              value={theme}
              onChange={choose}
            />
            <p className="hint">
              &ldquo;Phone&rdquo; follows whatever light or dark setting the device is on.
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h3>Install on this device</h3>
          </div>
          <div className="panel__body">
            {install.installed ? (
              <p className="hint">
                OceanCool is installed on this device and opens in its own window.
              </p>
            ) : install.canInstall ? (
              <>
                <p className="hint">
                  Install it to get an app icon, a full screen without browser bars, and an
                  app that still opens when the signal drops.
                </p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={install.promptInstall}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <IconInstall />
                  Install OceanCool
                </button>
              </>
            ) : install.iosHint ? (
              <p className="hint">
                On iPhone and iPad: tap the <strong>Share</strong> button in Safari, then
                <strong> Add to Home Screen</strong>. OceanCool then opens like any other app.
              </p>
            ) : (
              <p className="hint">
                Open this page in Chrome, Edge or Safari on a phone to install it to the home
                screen. Your browser will offer the option in its menu.
              </p>
            )}
          </div>
        </div>
      </div>

      {confirmingSignOut ? (
        <Confirm
          title="Sign out of OceanCool?"
          body="You will need your username and password to get back in."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          onConfirm={() => signOut()}
          onClose={() => setConfirmingSignOut(false)}
        />
      ) : null}
    </>
  );
}

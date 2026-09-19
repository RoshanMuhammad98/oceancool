import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * Gate in front of every signed-in screen. Remembers where the user was heading so
 * signing in drops them there instead of on the dashboard.
 */
export function RequireAuth() {
  const { signedIn } = useAuth();
  const location = useLocation();

  if (!signedIn) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
    );
  }

  return <Outlet />;
}

import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { RequireAuth } from './auth/RequireAuth.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Customers from './pages/Customers.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Reports from './pages/Reports.jsx';
import Services from './pages/Services.jsx';
import Settings from './pages/Settings.jsx';

/**
 * Five sections behind a login. Everything inside <AppShell> gets the same navigation
 * and header treatment; /services/new exists so the installed app's "Add service"
 * shortcut lands straight on the form.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="services" element={<Services />} />
          <Route path="services/new" element={<Services openNew />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

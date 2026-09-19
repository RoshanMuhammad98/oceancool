import { Link } from 'react-router-dom';
import { TopBar } from '../components/AppShell.jsx';
import { EmptyState } from '../ui/States.jsx';
import { IconDashboard } from '../ui/Icons.jsx';

export default function NotFound() {
  return (
    <>
      <TopBar eyebrow="OceanCool" title="Page not found" />
      <div className="page">
        <EmptyState
          icon={<IconDashboard />}
          title="That page does not exist"
          action={
            <Link className="btn btn--primary btn--sm" to="/">
              Go to the dashboard
            </Link>
          }
        >
          The link may be out of date, or the record it pointed to has been deleted.
        </EmptyState>
      </div>
    </>
  );
}

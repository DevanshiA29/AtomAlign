import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { usePortalSession } from '../hooks/usePortalSession';
import PendingAccessNotice from './PendingAccessNotice';

const DEMO_ADMIN_EMAIL = 'devanshiawasthi29@gmail.com';

const PortalRoute = ({ requiredRole, Component }) => {
  const clerk = useClerk();
  const session = usePortalSession(requiredRole);
  const currentEmail = String(session.clerkUser?.primaryEmailAddress?.emailAddress || '').toLowerCase();

  useEffect(() => {
    if (!session.isLoaded || session.loading || !session.isSignedIn) return;
    if (!session.resolvedRole || session.authorized) return;
    if (requiredRole === 'Admin' && currentEmail === DEMO_ADMIN_EMAIL) return;

    clerk.signOut().catch(() => {});
  }, [clerk, currentEmail, requiredRole, session.authorized, session.isLoaded, session.isSignedIn, session.loading, session.resolvedRole]);

  if (!session.isLoaded || session.loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Loader2 size={40} className="animate-spin text-atomPink mb-4" />
        <p className="text-textMuted">Preparing your secure workspace...</p>
      </div>
    );
  }

  if (!session.isSignedIn) {
    return <Navigate to={session.signInPath} replace />;
  }

  if (requiredRole === 'Admin' && currentEmail === DEMO_ADMIN_EMAIL) {
    return (
      <Component
        portalUser={
          session.portalUser || {
            email: DEMO_ADMIN_EMAIL,
            name: session.clerkUser?.fullName || 'Devanshi Awasthi',
            role: 'Admin',
            staffCode: 'ADM-0001'
          }
        }
        clerkUser={session.clerkUser}
      />
    );
  }

  if (!session.authorized) {
    const email = session.clerkUser?.primaryEmailAddress?.emailAddress || 'unknown email';

    if (!session.resolvedRole) {
      return (
        <PendingAccessNotice
          email={email}
          signInPath={session.signInPath}
          message={session.error || 'No approved role mapping was found in the workforce directory yet.'}
        />
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="glass-card max-w-xl w-full p-8 text-center border border-rose-500/30">
          <h2 className="text-2xl font-bold text-textColor mb-3">Portal Access Blocked</h2>
          <p className="text-textMuted mb-3">
            Signed in as <span className="text-textColor font-medium">{email}</span>, but this session does not currently have access to the requested portal.
          </p>
          <p className="text-sm text-rose-300 mb-6">
            {session.error || 'Your role does not match this workspace yet.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  await clerk.signOut();
                } finally {
                  window.location.assign(session.signInPath);
                }
              }}
              className="btn-secondary text-sm"
            >
              Back to Login
            </button>
            {session.resolvedRole && (
              <div className="text-xs text-textMuted self-center">
                Approved role found in Supabase: <span className="text-textColor font-semibold">{session.resolvedRole}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <Component portalUser={session.portalUser} clerkUser={session.clerkUser} />;
};

export default PortalRoute;

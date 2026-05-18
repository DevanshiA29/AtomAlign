import { Navigate, Link } from 'react-router-dom';
import { Loader2, LogOut, Shield } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { usePortalSession } from '../hooks/usePortalSession';
import PendingAccessNotice from './PendingAccessNotice';
import { DEFAULT_PORTAL_BY_ROLE } from '../lib/portals';

const AdminAccessShell = ({ children, onLogout }) => (
  <div className="min-h-screen bg-[#F4F6F8] text-slate-900">
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[300px] flex-col px-6 py-8 bg-[#0F292F] text-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white">
            AQ
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AtomQuest</h1>
            <p className="text-sm text-slate-300">Goal tracking portal</p>
          </div>
        </div>

        <div className="mt-8 rounded-[22px] border border-white/10 bg-white/5 p-4">
          <p className="text-lg font-bold text-white">HR Admin</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            ADMIN - Human Resources
          </p>
        </div>

        <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Session</p>
          <p className="mt-3 text-sm text-slate-300">This account can sign out or switch lanes, but admin features stay hidden until approval.</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <LogOut size={16} />
            Switch Account
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  </div>
);

const PortalRoute = ({ requiredRole, Component }) => {
  const clerk = useClerk();
  const session = usePortalSession(requiredRole);

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

  if (!session.authorized) {
    const email = session.clerkUser?.primaryEmailAddress?.emailAddress || 'unknown email';
    const approvedPortalPath = session.resolvedRole ? DEFAULT_PORTAL_BY_ROLE[session.resolvedRole] : null;
    const approvedPortalLabel = session.resolvedRole ? `${session.resolvedRole} Portal` : null;

    if (!session.resolvedRole) {
      if (requiredRole === 'Admin') {
        return (
          <AdminAccessShell
            onLogout={async () => {
              try {
                await clerk.signOut({ redirectUrl: session.signInPath });
              } finally {
                window.location.assign(session.signInPath);
              }
            }}
          >
            <div className="mx-auto max-w-4xl">
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Access Pending Approval</h2>
                    <p className="mt-1 text-sm text-slate-500">The admin sidebar remains available while this account waits for approval.</p>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-sm text-slate-700">
                    Signed in as <span className="font-semibold text-slate-900">{email}</span>.
                  </p>
                  <p className="mt-3 text-sm text-amber-800">
                    {session.error || 'No approved role mapping was found in the workforce directory yet.'}
                  </p>
                </div>
              </div>
            </div>
          </AdminAccessShell>
        );
      }

      return (
        <PendingAccessNotice
          email={email}
          signInPath={session.signInPath}
          message={session.error || 'No approved role mapping was found in the workforce directory yet.'}
        />
      );
    }

    return (
      requiredRole === 'Admin' ? (
        <AdminAccessShell
          onLogout={async () => {
            try {
              await clerk.signOut({ redirectUrl: session.signInPath });
            } finally {
              window.location.assign(session.signInPath);
            }
          }}
        >
          <div className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Portal Access Blocked</h2>
            <p className="mt-3 text-slate-600">
              Signed in as <span className="font-medium text-slate-900">{email}</span>, but this account does not currently have access to the requested portal.
            </p>
            <p className="mt-3 text-sm text-rose-700">{session.error || 'Your role does not match this workspace yet.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {approvedPortalPath && (
                <Link to={approvedPortalPath} className="inline-flex items-center rounded-xl bg-[#245C63] px-4 py-2.5 text-sm font-semibold text-white">
                  Open {approvedPortalLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await clerk.signOut({ redirectUrl: session.signInPath });
                  } finally {
                    window.location.assign(session.signInPath);
                  }
                }}
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Switch Account
              </button>
            </div>
          </div>
        </AdminAccessShell>
      ) : (
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
              {approvedPortalPath && (
                <Link to={approvedPortalPath} className="btn-primary text-sm">
                  Open {approvedPortalLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await clerk.signOut({ redirectUrl: session.signInPath });
                  } finally {
                    window.location.assign(session.signInPath);
                  }
                }}
                className="btn-secondary text-sm"
              >
                Switch Account
              </button>
              {session.resolvedRole && (
                <div className="text-xs text-textMuted self-center">
                  Approved role found in Supabase: <span className="text-textColor font-semibold">{session.resolvedRole}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    );
  }

  return <Component portalUser={session.portalUser} clerkUser={session.clerkUser} />;
};

export default PortalRoute;

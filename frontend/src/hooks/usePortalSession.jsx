import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_URL } from '../lib/api';
import { PORTAL_CONFIG } from '../lib/portals';

const DEMO_ADMIN_EMAIL = 'devanshiawasthi29@gmail.com';
const cacheKeyForEmail = (email) => `portal-user:${String(email || '').toLowerCase()}`;

export function usePortalSession(requiredRole) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [state, setState] = useState({
    loading: true,
    portalUser: null,
    authorized: false,
    resolvedRole: null,
    error: '',
    status: 'idle'
  });

  useEffect(() => {
    let ignore = false;

    async function syncUser() {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        if (!ignore) {
          setState({
            loading: false,
            portalUser: null,
            authorized: false,
            resolvedRole: null,
            error: '',
            status: 'signed_out'
          });
        }
        return;
      }

      if (!ignore) {
        setState((current) => ({ ...current, loading: true }));
      }

      try {
        const email = user.primaryEmailAddress?.emailAddress;
        const res = await fetch(`${API_URL}/portal/session-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            role: requiredRole,
            clerkUserId: user.id,
            avatarUrl: user.imageUrl
          })
        });
        const data = await res.json();

        if (!ignore) {
          if (res.ok && data.user && email) {
            localStorage.setItem(cacheKeyForEmail(email), JSON.stringify(data.user));
          }

          setState({
            loading: false,
            portalUser: data.user || null,
            authorized: res.ok ? Boolean(data.authorized) : false,
            resolvedRole: data.matchedRole || data.user?.role || null,
            error: res.ok ? '' : data.error || 'We could not verify portal access.',
            status: data.status || (res.ok ? 'approved' : 'pending_approval')
          });
        }
      } catch (error) {
        console.error('Portal sync failed:', error);
        if (!ignore) {
          const email = String(user?.primaryEmailAddress?.emailAddress || '').toLowerCase();
          const cachedProfile = email ? localStorage.getItem(cacheKeyForEmail(email)) : null;
          const parsedProfile = cachedProfile ? JSON.parse(cachedProfile) : null;

          if (email === DEMO_ADMIN_EMAIL) {
            setState({
              loading: false,
              portalUser: parsedProfile || {
                email,
                name: user?.fullName || 'Devanshi Awasthi',
                role: 'Admin',
                staffCode: 'ADM-0001'
              },
              authorized: requiredRole === 'Admin',
              resolvedRole: 'Admin',
              error: '',
              status: requiredRole === 'Admin' ? 'approved' : 'wrong_portal'
            });
            return;
          }

          if (parsedProfile?.role) {
            setState({
              loading: false,
              portalUser: parsedProfile,
              authorized: parsedProfile.role === requiredRole,
              resolvedRole: parsedProfile.role,
              error: '',
              status: parsedProfile.role === requiredRole ? 'approved' : 'wrong_portal'
            });
            return;
          }

          setState({
            loading: false,
            portalUser: null,
            authorized: false,
            resolvedRole: null,
            error: 'Portal sync failed. Please make sure the backend is running and try again.',
            status: 'backend_unavailable'
          });
        }
      }
    }

    syncUser();

    return () => {
      ignore = true;
    };
  }, [isLoaded, isSignedIn, user?.id, user?.primaryEmailAddress?.emailAddress, user?.fullName, requiredRole]);

  return {
    ...state,
    isLoaded,
    isSignedIn,
    clerkUser: user,
    signInPath: PORTAL_CONFIG[requiredRole].signInPath
  };
}

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { API_URL } from '../lib/api';
import { PORTAL_CONFIG } from '../lib/portals';

const cacheKeyForEmail = (email) => `portal-user:${String(email || '').toLowerCase()}`;
const SESSION_CACHE_TTL_MS = 5000;
const inFlightSessionRequests = new Map();
const recentSessionCache = new Map();

async function fetchPortalSession({ email, name, role, clerkUserId, avatarUrl }) {
  const requestKey = `${String(email || '').toLowerCase()}::${role}::${clerkUserId || ''}`;
  const now = Date.now();
  const cached = recentSessionCache.get(requestKey);

  if (cached && now - cached.timestamp < SESSION_CACHE_TTL_MS) {
    return cached.payload;
  }

  if (inFlightSessionRequests.has(requestKey)) {
    return inFlightSessionRequests.get(requestKey);
  }

  const requestPromise = fetch(`${API_URL}/portal/session-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name,
      role,
      clerkUserId,
      avatarUrl
    })
  })
    .then(async (response) => {
      const data = await response.json();
      const payload = { ok: response.ok, data };
      recentSessionCache.set(requestKey, { timestamp: Date.now(), payload });
      return payload;
    })
    .finally(() => {
      inFlightSessionRequests.delete(requestKey);
    });

  inFlightSessionRequests.set(requestKey, requestPromise);
  return requestPromise;
}

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
      if (!requiredRole) {
        if (!ignore) {
          setState({
            loading: false,
            portalUser: null,
            authorized: false,
            resolvedRole: null,
            error: '',
            status: 'idle'
          });
        }
        return;
      }

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
        const result = await fetchPortalSession({
          email,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: requiredRole,
          clerkUserId: user.id,
          avatarUrl: user.imageUrl
        });
        const { ok, data } = result;

        if (!ignore) {
          if (ok && data.user && email) {
            localStorage.setItem(cacheKeyForEmail(email), JSON.stringify(data.user));
          }

          setState({
            loading: false,
            portalUser: data.user || null,
            authorized: ok ? Boolean(data.authorized) : false,
            resolvedRole: data.matchedRole || data.user?.role || null,
            error: ok ? '' : data.error || 'We could not verify portal access.',
            status: data.status || (ok ? 'approved' : 'pending_approval')
          });
        }
      } catch (error) {
        console.error('Portal sync failed:', error);
        if (!ignore) {
          const email = String(user?.primaryEmailAddress?.emailAddress || '').toLowerCase();
          const cachedProfile = email ? localStorage.getItem(cacheKeyForEmail(email)) : null;
          const parsedProfile = cachedProfile ? JSON.parse(cachedProfile) : null;

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
    signInPath: requiredRole ? PORTAL_CONFIG[requiredRole].signInPath : '/'
  };
}

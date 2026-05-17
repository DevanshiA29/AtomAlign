import { SignIn, SignUp, useClerk } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PORTAL_CONFIG } from '../lib/portals';
import { usePortalSession } from '../hooks/usePortalSession';

const DEMO_ADMIN_EMAIL = 'devanshiawasthi29@gmail.com';
const ROLE_STYLES = {
  Employee: {
    panel: 'from-purple-500 to-violet-600',
    title: 'text-purple-300',
    button: 'from-purple-500 to-violet-600',
    heading: 'font-extrabold tracking-tight text-purple-200',
    subtitle: 'text-purple-100/80',
    label: 'text-purple-200',
    link: 'text-purple-300 hover:text-white',
    input: 'border-purple-400/20 focus:border-purple-400 focus:ring-purple-400/30',
    card: 'border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent'
  },
  Manager: {
    panel: 'from-pink-500 to-rose-600',
    title: 'text-pink-300',
    button: 'from-pink-500 to-rose-600',
    heading: 'font-extrabold tracking-tight text-pink-200',
    subtitle: 'text-pink-100/80',
    label: 'text-pink-200',
    link: 'text-pink-300 hover:text-white',
    input: 'border-pink-400/20 focus:border-pink-400 focus:ring-pink-400/30',
    card: 'border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent'
  },
  Admin: {
    panel: 'from-indigo-500 to-cyan-500',
    title: 'text-cyan-300',
    button: 'from-indigo-500 to-cyan-500',
    heading: 'font-extrabold tracking-tight text-cyan-100',
    subtitle: 'text-cyan-100/80',
    label: 'text-cyan-200',
    link: 'text-cyan-300 hover:text-white',
    input: 'border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400/30',
    card: 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent'
  }
};

const PortalSignIn = ({ role, mode = 'sign-in' }) => {
  const config = PORTAL_CONFIG[role];
  const clerk = useClerk();
  const session = usePortalSession(role);
  const currentEmail = String(session.clerkUser?.primaryEmailAddress?.emailAddress || '').toLowerCase();
  const roleStyle = ROLE_STYLES[role];
  const [isResettingLane, setIsResettingLane] = useState(false);

  useEffect(() => {
    let active = true;

    const resetWrongLaneSession = async () => {
      if (!session.isLoaded || session.loading || !session.isSignedIn) return;
      if (!session.resolvedRole || session.authorized) return;

      setIsResettingLane(true);
      try {
        await clerk.signOut();
      } finally {
        if (active) {
          setIsResettingLane(false);
        }
      }
    };

    resetWrongLaneSession();

    return () => {
      active = false;
    };
  }, [clerk, session.authorized, session.isLoaded, session.isSignedIn, session.loading, session.resolvedRole]);

  const commonAppearance = {
    elements: {
      card: `shadow-none bg-transparent border ${roleStyle.card}`,
      rootBox: 'w-full',
      headerTitle: `${roleStyle.heading}`,
      headerSubtitle: `${roleStyle.subtitle}`,
      socialButtonsBlockButtonText: `${roleStyle.label}`,
      formFieldLabel: `${roleStyle.label} text-xs uppercase tracking-[0.2em]`,
      formFieldInput: `bg-darkBg/70 ${roleStyle.input} text-textColor`,
      formButtonPrimary: `bg-gradient-to-r ${roleStyle.button} hover:opacity-95`,
      footerActionLink: `${roleStyle.link}`,
      footerActionText: 'text-textMuted',
      identityPreviewText: 'text-textColor',
      identityPreviewEditButton: `${roleStyle.link}`,
      formResendCodeLink: `${roleStyle.link}`,
      otpCodeFieldInput: `bg-darkBg/70 ${roleStyle.input} text-textColor`
    }
  };

  if (role === 'Admin' && session.isSignedIn && currentEmail === DEMO_ADMIN_EMAIL) {
    return <Navigate to={config.path} replace />;
  }

  if (!session.loading && session.isSignedIn && session.authorized) {
    return <Navigate to={config.path} replace />;
  }

  if (!session.isLoaded || session.loading || isResettingLane) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg">
        <div className="glass-card px-8 py-6 text-center">
          <p className="text-textMuted">{isResettingLane ? 'Resetting previous portal session...' : 'Checking your workspace access...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-14 bg-darkBg">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1fr,430px] gap-10 items-center">
        <div className="glass-card p-10 border border-borderColor overflow-hidden relative">
          <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${config.accent}`} />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <p className={`text-xs uppercase tracking-[0.35em] mb-3 ${roleStyle.title}`}>{role} Access</p>
            <h1 className="text-4xl font-bold text-textColor mb-4">
              {mode === 'sign-up' ? `Create ${config.label} Account` : config.label}
            </h1>
            <p className="text-textMuted max-w-xl leading-relaxed">
              {role === 'Admin'
                ? 'Use the authorized admin email to enter governance mode. The demo admin allowlist includes devanshiawasthi29@gmail.com.'
                : `Use the ${mode === 'sign-up' ? 'sign-up' : 'sign-in'} flow to enter the ${role.toLowerCase()} workspace securely.`}
            </p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-6 flex justify-center">
          {mode === 'sign-up' ? (
            <SignUp
              path={config.signUpPath}
              routing="path"
              signInUrl={config.signInPath}
              forceRedirectUrl={config.signInPath}
              fallbackRedirectUrl={config.signInPath}
              appearance={commonAppearance}
            />
          ) : (
            <SignIn
              path={config.signInPath}
              routing="path"
              signUpUrl={config.signUpPath}
              forceRedirectUrl={config.path}
              fallbackRedirectUrl={config.path}
              appearance={commonAppearance}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalSignIn;

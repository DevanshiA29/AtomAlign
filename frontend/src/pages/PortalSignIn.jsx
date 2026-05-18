import { useMemo, useState } from 'react';
import { useClerk, useSessionList, useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { PORTAL_CONFIG } from '../lib/portals';

const ROLE_STYLES = {
  Employee: {
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

const getClerkMessage = (error) => (
  error?.errors?.[0]?.longMessage ||
  error?.errors?.[0]?.message ||
  error?.message ||
  'Authentication failed. Please check the details and try again.'
);

const getSessionEmail = (session) => (
  session?.user?.primaryEmailAddress?.emailAddress ||
  session?.user?.emailAddresses?.[0]?.emailAddress ||
  session?.publicUserData?.identifier ||
  'Signed-in account'
);

const PortalSignIn = ({ role, mode = 'sign-in' }) => {
  const config = PORTAL_CONFIG[role];
  const clerk = useClerk();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isLoaded: sessionsLoaded, sessions, setActive: setSessionActive } = useSessionList();
  const roleStyle = ROLE_STYLES[role];
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    code: ''
  });
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const authReady = userLoaded && sessionsLoaded && (mode === 'sign-up' ? signUpLoaded : signInLoaded);
  const currentEmail = user?.primaryEmailAddress?.emailAddress || '';
  const knownSessions = useMemo(() => sessions || [], [sessions]);
  const authTitle = mode === 'sign-up' ? `Create ${config.label} Account` : config.label;
  const isSignUp = mode === 'sign-up';

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const activateSession = async (sessionId, activeSetter) => {
    const setActive = activeSetter || setSessionActive;
    if (!sessionId || !setActive) {
      throw new Error('Clerk did not return an active session for this account.');
    }

    await setActive({ session: sessionId });
    window.location.assign(config.path);
  };

  const handleSignIn = async () => {
    if (!signIn || !setSignInActive) return;

    const result = await signIn.create({
      identifier: form.email.trim(),
      password: form.password
    });

    if (result.status === 'complete') {
      await activateSession(result.createdSessionId, setSignInActive);
      return;
    }

    if (result.status === 'needs_second_factor') {
      setError('This account needs a second verification factor before it can enter the portal.');
      return;
    }

    setError('Additional verification is required before this account can enter the portal.');
  };

  const handleSignUp = async () => {
    if (!signUp || !setSignUpActive) return;

    if (pendingVerification) {
      const result = await signUp.attemptEmailAddressVerification({ code: form.code.trim() });

      if (result.status === 'complete') {
        await activateSession(result.createdSessionId, setSignUpActive);
        return;
      }

      setError('Verification is still incomplete. Please check the code and try again.');
      return;
    }

    const result = await signUp.create({
      emailAddress: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim()
    });

    if (result.status === 'complete') {
      await activateSession(result.createdSessionId, setSignUpActive);
      return;
    }

    if (result.unverifiedFields?.includes('email_address')) {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      return;
    }

    setError('Additional verification is required before this account can enter the portal.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (authError) {
      setError(getClerkMessage(authError));
    } finally {
      setSubmitting(false);
    }
  };

  const openClerkFallback = () => {
    const options = {
      redirectUrl: config.path,
      forceRedirectUrl: config.path,
      fallbackRedirectUrl: config.path,
      signInUrl: config.signInPath,
      signUpUrl: config.signUpPath
    };

    if (isSignUp) {
      clerk.openSignUp(options);
      return;
    }

    clerk.openSignIn(options);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg">
        <div className="glass-card px-8 py-6 text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-textMuted" size={22} />
          <p className="text-textMuted">Loading secure access...</p>
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
            <h1 className="text-4xl font-bold text-textColor mb-4">{authTitle}</h1>
            <p className="text-textMuted max-w-xl leading-relaxed">
              {role === 'Admin'
                ? 'Use an approved admin account to enter governance mode and oversee the platform.'
                : `Use a ${role.toLowerCase()} account to enter the role-specific workspace securely.`}
            </p>
            {isSignedIn && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-darkBg/60 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-textMuted">Current browser session</p>
                <p className="mt-2 text-sm text-textColor">{currentEmail}</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              {isSignUp ? <UserPlus className="text-white" size={21} /> : <KeyRound className="text-white" size={21} />}
            </div>
            <div>
              <p className={`text-xs uppercase tracking-[0.25em] ${roleStyle.title}`}>
                {isSignUp ? 'Create Account' : 'Independent Sign In'}
              </p>
              <h2 className="text-xl font-bold text-textColor">{config.label}</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !pendingVerification && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={`mb-2 block text-xs uppercase tracking-[0.18em] ${roleStyle.label}`}>First Name</span>
                  <input
                    value={form.firstName}
                    onChange={updateForm('firstName')}
                    className={`w-full rounded-xl border bg-darkBg/70 px-4 py-3 text-sm text-textColor outline-none ${roleStyle.input}`}
                    autoComplete="given-name"
                  />
                </label>
                <label className="block">
                  <span className={`mb-2 block text-xs uppercase tracking-[0.18em] ${roleStyle.label}`}>Last Name</span>
                  <input
                    value={form.lastName}
                    onChange={updateForm('lastName')}
                    className={`w-full rounded-xl border bg-darkBg/70 px-4 py-3 text-sm text-textColor outline-none ${roleStyle.input}`}
                    autoComplete="family-name"
                  />
                </label>
              </div>
            )}

            {!pendingVerification ? (
              <>
                <label className="block">
                  <span className={`mb-2 block text-xs uppercase tracking-[0.18em] ${roleStyle.label}`}>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={updateForm('email')}
                    className={`w-full rounded-xl border bg-darkBg/70 px-4 py-3 text-sm text-textColor outline-none ${roleStyle.input}`}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="block">
                  <span className={`mb-2 block text-xs uppercase tracking-[0.18em] ${roleStyle.label}`}>Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={updateForm('password')}
                    className={`w-full rounded-xl border bg-darkBg/70 px-4 py-3 text-sm text-textColor outline-none ${roleStyle.input}`}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className={`mb-2 block text-xs uppercase tracking-[0.18em] ${roleStyle.label}`}>Verification Code</span>
                <input
                  value={form.code}
                  onChange={updateForm('code')}
                  className={`w-full rounded-xl border bg-darkBg/70 px-4 py-3 text-sm text-textColor outline-none ${roleStyle.input}`}
                  autoComplete="one-time-code"
                  required
                />
              </label>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`btn-primary w-full justify-center bg-gradient-to-r ${roleStyle.button} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {pendingVerification ? 'Verify And Continue' : isSignUp ? 'Create Account' : `Sign In To ${role}`}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <Link to={isSignUp ? config.signInPath : config.signUpPath} className={roleStyle.link}>
              {isSignUp ? 'Already have an account?' : 'Create an account'}
            </Link>
            <button type="button" onClick={openClerkFallback} className={roleStyle.link}>
              Open Clerk
            </button>
          </div>

          {knownSessions.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-textMuted">Available Sessions</p>
              <div className="space-y-2">
                {knownSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => activateSession(session.id, setSessionActive)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-textColor hover:bg-white/[0.07]"
                  >
                    <span className="truncate">{getSessionEmail(session)}</span>
                    <ArrowRight size={15} className="shrink-0 text-textMuted" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalSignIn;

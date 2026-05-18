import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { Users, Shield, Target, Moon, Sun, Palette, LogIn, LogOut } from 'lucide-react';
import Home from './pages/Home';
import EmployeePortal from './pages/EmployeePortal';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminConsole from './pages/AdminConsole';
import PortalSignIn from './pages/PortalSignIn';
import PortalRoute from './components/PortalRoute';
import { AdminProvider } from './context/AdminContext';
import { PORTAL_CONFIG } from './lib/portals';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const clerk = useClerk();
  const { isSignedIn, user } = useUser();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('purple');
    else if (theme === 'purple') setTheme('light');
    else setTheme('dark');
  };

  const activePortal =
    location.pathname.startsWith('/employee')
      ? 'Employee'
      : location.pathname.startsWith('/manager')
        ? 'Manager'
        : location.pathname.startsWith('/admin')
          ? 'Admin'
          : null;
  const isHomeRoute = location.pathname === '/';
  const isAuthRoute = location.pathname.includes('/sign-in') || location.pathname.includes('/sign-up');

  const cachedPortalRole = useMemo(() => {
    const email = String(user?.primaryEmailAddress?.emailAddress || '').toLowerCase();
    if (!email) return null;

    try {
      const cached = localStorage.getItem(`portal-user:${email}`);
      const parsed = cached ? JSON.parse(cached) : null;
      return parsed?.role || null;
    } catch {
      return null;
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

  if (isHomeRoute) {
    return null;
  }

  const navItems = [
    { name: 'Employee Portal', path: PORTAL_CONFIG.Employee.path, icon: <Target size={20} /> },
    { name: 'Manager Queue', path: PORTAL_CONFIG.Manager.path, icon: <Users size={20} /> },
    { name: 'Admin Console', path: PORTAL_CONFIG.Admin.path, icon: <Shield size={20} /> }
  ];
  const visibleNavItems = activePortal
    ? navItems.filter((item) => item.path === PORTAL_CONFIG[activePortal].path)
    : navItems;
  const activeConfig = activePortal ? PORTAL_CONFIG[activePortal] : null;
  const showApprovedPortalNav = Boolean(
    activePortal &&
    !isAuthRoute &&
    isSignedIn &&
    cachedPortalRole === activePortal
  );
  const showAuthLinks = Boolean(activeConfig && isAuthRoute);
  const showOnlyLogout = Boolean(
    (isAuthRoute && isSignedIn) ||
    (activePortal && !isAuthRoute && isSignedIn && cachedPortalRole !== activePortal)
  );

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={18} />;
    if (theme === 'purple') return <Palette size={18} />;
    return <Sun size={18} />;
  };

  const handleLogout = async () => {
    try {
      localStorage.setItem('home-toast', 'Signed out successfully.');
      await clerk.signOut();
    } finally {
      navigate('/', { replace: true });
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 glass-card rounded-none border-y-0 border-l-0 bg-darkBg">
      <div className="flex h-full flex-col p-4">
      <Link to="/" className="flex items-center gap-3 mb-10 mt-4 px-2 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-atomPink to-atomPurple flex items-center justify-center shadow-lg shadow-atomPink/20">
          <Target className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-atomPink to-atomPurple bg-clip-text text-transparent">
          AtomAlign
        </h1>
      </Link>

      <nav className="flex-1 flex flex-col gap-2">
        {showApprovedPortalNav && visibleNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === item.path
                ? 'bg-gradient-to-r from-atomPink/10 to-atomPurple/10 text-atomPink border border-atomPink/20'
                : 'text-textMuted hover:text-textColor hover:bg-borderColor'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}

        {showAuthLinks && (
          <>
            <Link
              to={activeConfig.signInPath}
              className={`px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                location.pathname.includes('/sign-in')
                  ? 'bg-gradient-to-r from-atomPink/10 to-atomPurple/10 text-atomPink border border-atomPink/20'
                  : 'text-textMuted hover:text-textColor hover:bg-borderColor'
              }`}
            >
              Sign In
            </Link>
            <Link
              to={activeConfig.signUpPath}
              className={`px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                location.pathname.includes('/sign-up')
                  ? 'bg-gradient-to-r from-atomPink/10 to-atomPurple/10 text-atomPink border border-atomPink/20'
                  : 'text-textMuted hover:text-textColor hover:bg-borderColor'
              }`}
            >
              Sign Up
            </Link>
          </>
        )}

        {showOnlyLogout && (
          <div className="flex-1" />
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-4 pt-4">
        <button
          onClick={cycleTheme}
          className="flex items-center justify-between px-4 py-2 rounded-xl text-textMuted hover:bg-borderColor hover:text-textColor transition-all"
        >
          <span className="font-medium text-sm flex items-center gap-2">
            {getThemeIcon()}
            {theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
          </span>
        </button>

        {!showOnlyLogout && (
          <div className="p-4 rounded-xl bg-borderColor/50 border border-borderColor flex items-center gap-3">
            {isSignedIn ? (
              <>
                <UserButton afterSignOutUrl="/" />
                <div>
                  <p className="text-sm font-medium text-textColor">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
                  <p className="text-xs text-textMuted">Clerk authenticated</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <LogIn className="text-slate-300" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-textColor">Portal Sign-in</p>
                  <p className="text-xs text-textMuted">Choose a role-specific login</p>
                </div>
              </>
            )}
          </div>
        )}

        {isSignedIn && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-textColor border border-borderColor hover:bg-borderColor transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        )}
      </div>
      </div>
    </aside>
  );
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdminWorkspace = location.pathname.startsWith('/admin') && !location.pathname.includes('/sign-');
  const isManagerWorkspace = location.pathname.startsWith('/manager') && !location.pathname.includes('/sign-');

  return (
    <div className="flex min-h-screen bg-darkBg text-textColor transition-colors duration-300">
      {!isAdminWorkspace && !isManagerWorkspace && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${!isHome && !isAdminWorkspace && !isManagerWorkspace ? 'ml-64 p-8' : ''} w-full overflow-x-hidden min-h-screen`}>
        {children}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AdminProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/employee/sign-in/*" element={<PortalSignIn role="Employee" mode="sign-in" />} />
            <Route path="/employee/sign-up/*" element={<PortalSignIn role="Employee" mode="sign-up" />} />
            <Route path="/manager/sign-in/*" element={<PortalSignIn role="Manager" mode="sign-in" />} />
            <Route path="/manager/sign-up/*" element={<PortalSignIn role="Manager" mode="sign-up" />} />
            <Route path="/admin/sign-in/*" element={<PortalSignIn role="Admin" mode="sign-in" />} />
            <Route path="/admin/sign-up/*" element={<PortalSignIn role="Admin" mode="sign-up" />} />
            <Route path="/employee" element={<PortalRoute requiredRole="Employee" Component={EmployeePortal} />} />
            <Route path="/manager" element={<PortalRoute requiredRole="Manager" Component={ManagerDashboard} />} />
            <Route path="/admin" element={<PortalRoute requiredRole="Admin" Component={AdminConsole} />} />
          </Routes>
        </Layout>
      </AdminProvider>
    </Router>
  );
};

export default App;

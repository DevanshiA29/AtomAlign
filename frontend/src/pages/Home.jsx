import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Users, Shield, Target, 
  Sparkles, Diamond, Zap, ArrowUp, Moon, Sun, Palette
} from 'lucide-react';
import { PORTAL_CONFIG } from '../lib/portals';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState('dark');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'purple');
    if (theme === 'light') {
      // By default no class means light based on our index.css
      // But we can just remove dark/purple
    } else {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedToast = localStorage.getItem('home-toast');
    const stateToast = location.state?.toastMessage;
    const message = storedToast || stateToast || '';

    if (message) {
      setToastMessage(message);
      localStorage.removeItem('home-toast');
      const timeout = setTimeout(() => setToastMessage(''), 2500);
      return () => clearTimeout(timeout);
    }
  }, [location.state]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToIdentityGate = () => {
    const el = document.getElementById('identity-gate');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-textColor relative overflow-hidden transition-colors duration-500">
      
      {/* Abstract Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-atomPink/20 blur-[120px] animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-atomPurple/20 blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] animate-blob animation-delay-4000 pointer-events-none"></div>

      {/* Top Navigation / Theme Switcher */}
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 backdrop-blur-md bg-darkBg/50 border-b border-borderColor">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-atomPink to-atomPurple flex items-center justify-center shadow-lg shadow-atomPink/20">
            <Target className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-atomPink to-atomPurple bg-clip-text text-transparent">
            AtomAlign
          </h1>
        </div>
        <div className="flex items-center gap-2 glass-card p-1 rounded-full">
          <button 
            onClick={() => setTheme('light')}
            className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-borderColor text-atomPink shadow' : 'text-textMuted hover:text-textColor'}`}
          >
            <Sun size={18} />
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-borderColor text-atomPurple shadow' : 'text-textMuted hover:text-textColor'}`}
          >
            <Moon size={18} />
          </button>
          <button 
            onClick={() => setTheme('purple')}
            className={`p-2 rounded-full transition-all ${theme === 'purple' ? 'bg-borderColor text-fuchsia-400 shadow' : 'text-textMuted hover:text-textColor'}`}
          >
            <Palette size={18} />
          </button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10 min-h-[90vh]">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
            <span className="block text-textColor">Align Focus.</span>
            <span className="block text-textColor">Track Impact.</span>
            <span className="block bg-gradient-to-r from-atomPink via-purple-500 to-indigo-600 bg-clip-text text-transparent pb-2">
              Drive Growth.
            </span>
          </h1>
          <p className="text-lg text-textMuted max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            The ultimate intelligent performance ecosystem designed to align employee execution with organizational priorities.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button 
              onClick={scrollToIdentityGate}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-atomPink via-purple-500 to-indigo-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-105 transition-all duration-300"
            >
              Launch Portal
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('gamification');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-full border border-borderColor text-textColor font-bold text-lg hover:bg-borderColor hover:scale-105 transition-all duration-300"
            >
              Explore Badges
            </button>
          </div>
        </div>

        {/* Abstract UI Element (Progress Ring / Performance Matrix) */}
        <div className="flex-1 relative flex justify-center items-center">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96">
            <div className="absolute inset-0 rounded-full border border-borderColor border-dashed animate-[spin_60s_linear_infinite]"></div>
            <div className="absolute inset-4 rounded-full border-2 border-atomPurple/30 animate-[spin_40s_linear_infinite_reverse]"></div>
            <div className="absolute inset-10 rounded-full border-t-2 border-atomPink animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass-card w-48 h-48 rounded-full flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-atomPink/20 to-atomPurple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Target size={48} className="text-atomPink mb-2" />
                <span className="text-2xl font-bold">100%</span>
                <span className="text-xs text-textMuted uppercase tracking-wider">Alignment</span>
              </div>
            </div>
            
            {/* Floating Mini Cards */}
            <div className="absolute top-10 right-0 glass-card p-3 rounded-lg shadow-lg shadow-atomPurple/10 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-atomPurple" />
                <span className="text-sm font-medium">Goal Hit</span>
              </div>
            </div>
            <div className="absolute bottom-10 left-0 glass-card p-3 rounded-lg shadow-lg shadow-atomPink/10 animate-bounce" style={{animationDuration: '4s'}}>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-atomPink" />
                <span className="text-sm font-medium">Metric Updated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE IDENTITY GATE */}
      <section id="identity-gate" className="py-24 px-6 relative z-10 border-t border-borderColor/50 bg-darkBg/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Select Your Workspace</h2>
            <p className="text-textMuted">Role-based access to the AtomAlign ecosystem</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CARD A: Employee */}
            <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <User size={28} className="text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Employee Portal</h3>
              <p className="text-textMuted mb-8 flex-1 leading-relaxed">
                Draft goals, update quarterly actual milestones, and earn achievement rewards.
              </p>
              <button 
                onClick={() => navigate(PORTAL_CONFIG.Employee.signInPath)}
                className="w-full py-3 rounded-lg border border-borderColor font-medium group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-all duration-300"
              >
                Enter Contributor Workspace
              </button>
            </div>

            {/* CARD B: Manager */}
            <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={100} />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition-colors relative z-10">
                <Users size={28} className="text-pink-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3 relative z-10">Manager Portal</h3>
              <p className="text-textMuted mb-8 flex-1 leading-relaxed relative z-10">
                Conduct reviews, adjust metric weightages inline, and document check-in conversations.
              </p>
              <button 
                onClick={() => navigate(PORTAL_CONFIG.Manager.signInPath)}
                className="w-full py-3 rounded-lg border border-borderColor font-medium group-hover:bg-pink-500 group-hover:text-white group-hover:border-pink-500 transition-all duration-300 relative z-10"
              >
                Access Leadership Dashboard
              </button>
            </div>

            {/* CARD C: Admin */}
            <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <Shield size={28} className="text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin Console</h3>
              <p className="text-textMuted mb-8 flex-1 leading-relaxed">
                Configure fiscal windows, handle post-deadline exceptions, and manage immutable audit trails.
              </p>
              <button 
                onClick={() => navigate(PORTAL_CONFIG.Admin.signInPath)}
                className="w-full py-3 rounded-lg border border-borderColor font-medium group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all duration-300"
              >
                Open Admin Console
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. GAMIFICATION ZONE */}
      <section id="gamification" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Performance Milestones</h2>
              <p className="text-textMuted max-w-2xl">Unlock exclusive achievement badges by exceeding expectations and maintaining precise execution throughout the fiscal year.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Badge 1 */}
            <div className="glass-card p-6 flex flex-col items-center text-center group hover:-translate-y-2 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300">
                <Target size={32} className="text-purple-500" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-textColor group-hover:text-purple-500 transition-colors">Target Locked</h4>
              <p className="text-sm text-textMuted leading-relaxed">
                Submitted a complete goal sheet on time with a perfectly validated 100% weightage.
              </p>
            </div>

            {/* Badge 2 */}
            <div className="glass-card p-6 flex flex-col items-center text-center group hover:-translate-y-2 hover:border-pink-500/50 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)] transition-all duration-300 cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 group-hover:scale-110 transition-all duration-300">
                <Sparkles size={32} className="text-pink-500" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-textColor group-hover:text-pink-500 transition-colors">Century Club</h4>
              <p className="text-sm text-textMuted leading-relaxed">
                Achieved an absolute 100% or higher score on a high-impact financial or operational metric.
              </p>
            </div>

            {/* Badge 3 */}
            <div className="glass-card p-6 flex flex-col items-center text-center group hover:-translate-y-2 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300">
                <Diamond size={32} className="text-cyan-500" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-textColor group-hover:text-cyan-500 transition-colors">Absolute Zero</h4>
              <p className="text-sm text-textMuted leading-relaxed">
                Maintained a perfect zero-incident record on strict compliance or safety targets.
              </p>
            </div>

            {/* Badge 4 */}
            <div className="glass-card p-6 flex flex-col items-center text-center group hover:-translate-y-2 hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all duration-300 cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 group-hover:bg-rose-500/20 group-hover:scale-110 transition-all duration-300">
                <Zap size={32} className="text-rose-500" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-textColor group-hover:text-rose-500 transition-colors">Deadline Dynamo</h4>
              <p className="text-sm text-textMuted leading-relaxed">
                Logged completion metrics exactly ahead of schedule on timeline-driven objectives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SYSTEM PULSE STRIP (FOOTER) */}
      <footer className="border-t border-borderColor bg-darkBg py-4 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-4 text-xs font-medium text-textMuted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Microsoft Entra ID (SSO) Ready
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Teams Bot Integrated
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Immutable Audit Engine Active
          </div>
        </div>
      </footer>

      {/* GO TO TOP BUTTON */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-borderColor text-textColor shadow-lg border border-borderColor hover:bg-textColor hover:text-darkBg transition-all duration-300 z-50 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <ArrowUp size={20} />
      </button>

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default Home;

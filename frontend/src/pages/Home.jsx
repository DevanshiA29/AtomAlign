
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Users, Shield, Target, Sparkles, Diamond, Zap, ArrowUp,
  Moon, Sun, Palette, ChevronRight, CheckCircle2, TrendingUp, Bell,
  BarChart3, GitMerge, MessageSquare, Lock, ArrowRight, Star, Award, Activity, Play
} from 'lucide-react';
import { PORTAL_CONFIG } from '../lib/portals';

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Counter({ end, duration = 1600, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const TICKER_ITEMS = [
  '✦ Microsoft Entra SSO Active','✦ Teams Bot Integrated','✦ Immutable Audit Engine',
  '✦ Graph API Connected','✦ Adaptive Cards Enabled','✦ Role-Based Access Control',
  '✦ Real-Time Notifications','✦ Prisma ORM + PostgreSQL','✦ Automated Escalation Engine','✦ Fiscal Cycle Management',
];

const FEATURES = [
  { icon: <Target size={22}/>, color:'from-pink-500 to-rose-600', glow:'group-hover:shadow-pink-500/20', title:'Goal Authoring Studio', desc:'Employees draft weighted KPI sets with real-time 100% validation, guided by fiscal cycle windows set by admins.' },
  { icon: <BarChart3 size={22}/>, color:'from-purple-500 to-violet-600', glow:'group-hover:shadow-purple-500/20', title:'Manager Review Engine', desc:'Inline weightage adjustments, narrative check-in documentation, and cascading team performance views.' },
  { icon: <Bell size={22}/>, color:'from-indigo-500 to-blue-600', glow:'group-hover:shadow-indigo-500/20', title:'Escalation Dispatcher', desc:'Automated Microsoft Teams Adaptive Card alerts when goals are overdue, with deep-link workspace shortcuts.' },
  { icon: <GitMerge size={22}/>, color:'from-cyan-500 to-teal-600', glow:'group-hover:shadow-cyan-500/20', title:'Teams Tab Integration', desc:'Embed the full dashboard inside a Teams channel tab. Context-aware UI hides nav when inside the Teams iframe.' },
  { icon: <Lock size={22}/>, color:'from-amber-500 to-orange-600', glow:'group-hover:shadow-amber-500/20', title:'Immutable Audit Trail', desc:'Every score, edit, and admin override is cryptographically logged. Full compliance-grade history on demand.' },
  { icon: <MessageSquare size={22}/>, color:'from-emerald-500 to-green-600', glow:'group-hover:shadow-emerald-500/20', title:'Check-in Conversations', desc:'Structured 1:1 conversation logs attached to each employee cycle. Never lose context between reviews.' },
];

const BADGES = [
  { icon: <Target size={28}/>, color:'purple', name:'Target Locked', desc:'Perfect 100% weighted goal sheet submitted on time.', rarity:'Rare' },
  { icon: <Sparkles size={28}/>, color:'pink', name:'Century Club', desc:'Achieved 100%+ score on a high-impact financial metric.', rarity:'Epic' },
  { icon: <Diamond size={28}/>, color:'cyan', name:'Absolute Zero', desc:'Zero incidents on strict compliance or safety targets.', rarity:'Legendary' },
  { icon: <Zap size={28}/>, color:'rose', name:'Deadline Dynamo', desc:'Completed all timeline-driven objectives ahead of schedule.', rarity:'Rare' },
  { icon: <Award size={28}/>, color:'amber', name:'Trailblazer', desc:'First in team to complete a full fiscal cycle clean.', rarity:'Common' },
  { icon: <Star size={28}/>, color:'emerald', name:'Consistency Core', desc:'Three consecutive cycles with on-time, validated submissions.', rarity:'Epic' },
];

const RARITY_COLOR = { Common:'text-slate-400', Rare:'text-blue-400', Epic:'text-purple-400', Legendary:'text-amber-400' };

const ACCENT_MAP = {
  purple:{ bg:'bg-purple-500/10', border:'border-purple-500/30', text:'text-purple-400', hover:'group-hover:bg-purple-500/20 group-hover:border-purple-500/60' },
  pink:  { bg:'bg-pink-500/10',   border:'border-pink-500/30',   text:'text-pink-400',   hover:'group-hover:bg-pink-500/20 group-hover:border-pink-500/60' },
  cyan:  { bg:'bg-cyan-500/10',   border:'border-cyan-500/30',   text:'text-cyan-400',   hover:'group-hover:bg-cyan-500/20 group-hover:border-cyan-500/60' },
  rose:  { bg:'bg-rose-500/10',   border:'border-rose-500/30',   text:'text-rose-400',   hover:'group-hover:bg-rose-500/20 group-hover:border-rose-500/60' },
  amber: { bg:'bg-amber-500/10',  border:'border-amber-500/30',  text:'text-amber-400',  hover:'group-hover:bg-amber-500/20 group-hover:border-amber-500/60' },
  emerald:{ bg:'bg-emerald-500/10', border:'border-emerald-500/30', text:'text-emerald-400', hover:'group-hover:bg-emerald-500/20 group-hover:border-emerald-500/60' },
};

const STATS = [
  { label:'Goals Tracked', value:12400, suffix:'+', icon:<Target size={18}/>, color:'text-pink-400' },
  { label:'Teams Connected', value:340, suffix:'+', icon:<Users size={18}/>, color:'text-purple-400' },
  { label:'Cycles Completed', value:98, suffix:'%', icon:<Activity size={18}/>, color:'text-cyan-400' },
  { label:'Audit Events', value:1200000, suffix:'+', icon:<Lock size={18}/>, color:'text-amber-400' },
];

function PortalCard({ delay, visible, icon, gradient, glow, border, label, badge, desc, cta, perks, onClick, featured }) {
  return (
    <div onClick={onClick}
      className={`group relative rounded-2xl border border-white/8 p-7 cursor-pointer transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl ${glow} ${border}`}
      style={{ background: featured ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)', transitionDelay:`${delay}ms`, opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(24px)' }}>
      {featured && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6)'}}>Most Used</div>
      )}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
      <div className="text-xs font-medium text-textMuted uppercase tracking-widest mb-2">{badge}</div>
      <h3 className="text-xl font-bold text-textColor mb-3" style={{fontFamily:"'Syne',sans-serif"}}>{label}</h3>
      <p className="text-sm text-textMuted leading-relaxed mb-6">{desc}</p>
      <ul className="space-y-1.5 mb-7">
        {perks.map(p => (
          <li key={p} className="flex items-center gap-2 text-xs text-textMuted">
            <CheckCircle2 size={11} className="text-emerald-400 shrink-0"/> {p}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-all bg-gradient-to-r ${gradient} opacity-90 group-hover:opacity-100 group-hover:shadow-lg`}>{cta}</button>
    </div>
  );
}

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => { document.documentElement.className = theme; localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => {
    const msg = localStorage.getItem('home-toast') || location.state?.toastMessage || '';
    if (msg) { setToastMessage(msg); localStorage.removeItem('home-toast'); const t = setTimeout(() => setToastMessage(''), 2500); return () => clearTimeout(t); }
  }, [location.state]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });

  const [statsRef, statsVisible] = useReveal(0.1);
  const [featRef, featVisible] = useReveal(0.08);
  const [portalRef, portalVisible] = useReveal(0.08);
  const [badgeRef, badgeVisible] = useReveal(0.08);
  const [ctaRef, ctaVisible] = useReveal(0.1);

  return (
    <div className="min-h-screen bg-darkBg text-textColor relative overflow-x-hidden" style={{fontFamily:"'DM Sans',sans-serif"}}>

      {/* AMBIENT */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full bg-atomPink/15 blur-[140px] animate-blob"/>
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-atomPurple/15 blur-[120px] animate-blob" style={{animationDelay:'2s'}}/>
        <div className="absolute bottom-[-15%] left-[25%] w-[55%] h-[55%] rounded-full bg-indigo-500/8 blur-[160px] animate-blob" style={{animationDelay:'4s'}}/>
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5" style={{background:'rgba(11,15,25,0.80)'}}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6)'}}>
              <Target size={17} className="text-white"/>
            </div>
            <span className="text-xl font-bold tracking-tight" style={{fontFamily:"'Syne',sans-serif",background:'linear-gradient(135deg,#ec4899,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AtomAlign</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features','Portals','Milestones'].map(l=>(
              <button key={l} onClick={()=>scrollTo(l.toLowerCase())} className="text-sm text-textMuted hover:text-textColor transition-colors font-medium">{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/5">
              {[['dark',<Moon size={13}/>],['purple',<Palette size={13}/>],['light',<Sun size={13}/>]].map(([t,icon])=>(
                <button key={t} onClick={()=>setTheme(t)} className={`p-1.5 rounded-full transition-all ${theme===t?'bg-white/15 text-textColor':'text-textMuted hover:text-textColor'}`}>{icon}</button>
              ))}
            </div>
            <button onClick={()=>scrollTo('portals')} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-atomPink/20" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6)'}}>
              Get Started <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-36 pb-24 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div className={`space-y-8 transition-all duration-1000 ${heroVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-textMuted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> Microsoft Entra SSO · Teams Integration Active
              </div>
              <h1 className="leading-[1.06] tracking-tighter" style={{fontFamily:"'Syne',sans-serif"}}>
                <span className="block text-5xl lg:text-7xl font-extrabold text-textColor">Align Focus.</span>
                <span className="block text-5xl lg:text-7xl font-extrabold text-textColor">Track Impact.</span>
                <span className="block text-5xl lg:text-7xl font-extrabold" style={{background:'linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#6366f1 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Drive Growth.</span>
              </h1>
              <p className="text-lg text-textMuted max-w-xl leading-relaxed">
                The ultimate intelligent performance ecosystem — bridging employee execution with organisational priorities via Microsoft Teams, real-time KPI tracking, and automated escalation.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={()=>scrollTo('portals')} className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-atomPink/30" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6,#6366f1)'}}>
                  Launch Portal <ArrowRight size={16}/>
                </button>
                <button onClick={()=>scrollTo('features')} className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base border border-white/10 text-textColor hover:bg-white/5 hover:border-white/20 transition-all">
                  <Play size={14} className="text-atomPink"/> See Features
                </button>
              </div>
              <div className="flex flex-wrap gap-6 pt-1">
                {['Azure AD','Graph API','Prisma ORM','Teams SDK'].map(t=>(
                  <div key={t} className="flex items-center gap-1.5 text-xs text-textMuted">
                    <CheckCircle2 size={12} className="text-emerald-400"/> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className={`relative flex justify-center items-center transition-all duration-1000 delay-200 ${heroVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-10'}`}>
              <div className="absolute w-[440px] h-[440px] rounded-full border border-white/5" style={{animation:'spin 40s linear infinite reverse'}}/>
              <div className="absolute w-[360px] h-[360px] rounded-full border border-atomPurple/15" style={{animation:'spin 20s linear infinite'}}/>
              <div className="absolute w-[280px] h-[280px] rounded-full border border-atomPink/20" style={{animation:'spin 30s linear infinite reverse'}}/>
              <div className="absolute w-44 h-44 rounded-full bg-atomPink/25 blur-3xl" style={{animation:'glowPulse 3s ease-in-out infinite'}}/>
              <div className="absolute w-44 h-44 rounded-full bg-atomPurple/20 blur-3xl translate-x-20 translate-y-10" style={{animation:'glowPulse 3s ease-in-out 1.5s infinite'}}/>

              {/* Centre card */}
              <div className="relative z-10 w-64 rounded-3xl border border-white/10 p-6 shadow-2xl" style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(20px)'}}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6)'}}>
                    <Target size={17} className="text-white"/>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-textColor" style={{fontFamily:"'Syne',sans-serif"}}>Q2 2026</div>
                    <div className="text-xs text-textMuted">Performance Cycle</div>
                  </div>
                </div>
                {[{label:'Revenue Growth',pct:87,color:'#ec4899'},{label:'NPS Score',pct:94,color:'#8b5cf6'},{label:'Compliance',pct:100,color:'#10b981'}].map(({label,pct,color})=>(
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-textMuted">{label}</span><span className="font-semibold text-textColor">{pct}%</span></div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{width:heroVisible?`${pct}%`:'0%',background:color,boxShadow:`0 0 8px ${color}60`,transition:'width 1.2s ease 0.6s'}}/>
                    </div>
                  </div>
                ))}
                <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-textMuted">Overall Score</span>
                  <span className="text-lg font-bold" style={{fontFamily:"'Syne',sans-serif",background:'linear-gradient(135deg,#ec4899,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>93.7%</span>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute top-8 right-2 z-20 w-44" style={{animation:'float 6s ease-in-out infinite'}}>
                <div className="rounded-2xl border border-white/10 p-3 shadow-xl" style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(16px)'}}>
                  <div className="flex items-center gap-2 mb-1"><Bell size={12} className="text-atomPink"/><span className="text-xs font-semibold text-textColor">Teams Alert</span></div>
                  <p className="text-xs text-textMuted leading-tight">Nisha Rao — Goals not submitted in 7 days</p>
                </div>
              </div>
              <div className="absolute bottom-12 left-2 z-20 w-40" style={{animation:'float 6s ease-in-out 2s infinite'}}>
                <div className="rounded-2xl border border-white/10 p-3 shadow-xl" style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(16px)'}}>
                  <div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-emerald-400"/><span className="text-xs font-semibold text-textColor">Badge Earned</span></div>
                  <p className="text-xs text-textMuted leading-tight">Century Club — Q1 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="relative z-10 border-y border-white/5 py-3 overflow-hidden" style={{background:'rgba(255,255,255,0.02)'}}>
        <div className="flex whitespace-nowrap" style={{animation:'ticker 30s linear infinite'}}>
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
            <span key={i} className="inline-flex items-center gap-3 px-8 text-xs font-medium text-textMuted uppercase tracking-widest">{item}</span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section ref={statsRef} className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({label,value,suffix,icon,color},i)=>(
            <div key={label} className="rounded-2xl border border-white/8 p-6 text-center transition-all duration-700" style={{background:'rgba(255,255,255,0.04)',transitionDelay:`${i*100}ms`,opacity:statsVisible?1:0,transform:statsVisible?'translateY(0)':'translateY(20px)'}}>
              <div className={`flex justify-center mb-3 ${color}`}>{icon}</div>
              <div className="text-3xl font-extrabold text-textColor mb-1" style={{fontFamily:"'Syne',sans-serif"}}><Counter end={value} suffix={suffix}/></div>
              <div className="text-xs text-textMuted uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featRef} className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${featVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-textMuted mb-6 uppercase tracking-widest font-medium">
              <TrendingUp size={11} className="text-atomPink"/> Core Capabilities
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-textColor mb-4" style={{fontFamily:"'Syne',sans-serif"}}>Built for enterprise performance</h2>
            <p className="text-textMuted max-w-2xl mx-auto text-lg">Every module engineered to handle the complexity of multi-team, multi-cycle performance management at scale.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({icon,color,glow,title,desc},i)=>(
              <div key={title} className={`group relative rounded-2xl border border-white/8 p-6 cursor-default transition-all duration-700 hover:-translate-y-1 hover:border-white/15 hover:shadow-xl ${glow}`}
                style={{background:'rgba(255,255,255,0.04)',transitionDelay:`${i*80}ms`,opacity:featVisible?1:0,transform:featVisible?'translateY(0)':'translateY(20px)'}}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${color} text-white shadow-lg`}>{icon}</div>
                <h3 className="text-base font-bold text-textColor mb-2" style={{fontFamily:"'Syne',sans-serif"}}>{title}</h3>
                <p className="text-sm text-textMuted leading-relaxed">{desc}</p>
                <div className={`absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r ${color} opacity-0 group-hover:opacity-40 transition-opacity`}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section id="portals" ref={portalRef} className="relative z-10 py-24 px-6 border-t border-white/5" style={{background:'rgba(255,255,255,0.02)'}}>
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${portalVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-textMuted mb-6 uppercase tracking-widest font-medium">
              <Shield size={11} className="text-atomPurple"/> Identity Gate
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-textColor mb-4" style={{fontFamily:"'Syne',sans-serif"}}>Select Your Workspace</h2>
            <p className="text-textMuted max-w-xl mx-auto">Role-based access to the AtomAlign ecosystem. Each portal is secured via Microsoft Entra ID.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <PortalCard delay={0} visible={portalVisible} icon={<User size={26}/>} gradient="from-purple-500 to-violet-600" glow="hover:shadow-purple-500/20" border="hover:border-purple-500/40" label="Employee Portal" badge="Contributor" desc="Draft goals, update quarterly actuals, earn achievement rewards, and track your personal performance trajectory." cta="Enter Workspace" perks={['Goal Authoring','Badge System','Progress View']} onClick={()=>navigate(PORTAL_CONFIG.Employee.signInPath)}/>
            <PortalCard delay={100} visible={portalVisible} icon={<Users size={26}/>} gradient="from-pink-500 to-rose-600" glow="hover:shadow-pink-500/25" border="hover:border-pink-500/40" label="Manager Portal" badge="Leadership" desc="Conduct cycle reviews, adjust metric weightages inline, document check-ins, and monitor team escalation queues." cta="Access Dashboard" perks={['Team Reviews','Teams Alerts','Escalation Queue']} onClick={()=>navigate(PORTAL_CONFIG.Manager.signInPath)} featured/>
            <PortalCard delay={200} visible={portalVisible} icon={<Shield size={26}/>} gradient="from-indigo-500 to-blue-600" glow="hover:shadow-indigo-500/20" border="hover:border-indigo-500/40" label="Admin Console" badge="System" desc="Configure fiscal windows, handle post-deadline exceptions, manage tenants, and maintain immutable audit trails." cta="Open Console" perks={['Fiscal Config','Audit Engine','User Management']} onClick={()=>navigate(PORTAL_CONFIG.Admin.signInPath)}/>
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section id="milestones" ref={badgeRef} className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className={`flex flex-col lg:flex-row justify-between items-end gap-8 mb-14 transition-all duration-700 ${badgeVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-8'}`}>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-textMuted mb-5 uppercase tracking-widest font-medium">
                <Award size={11} className="text-amber-400"/> Gamification Layer
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-textColor mb-3" style={{fontFamily:"'Syne',sans-serif"}}>Performance Milestones</h2>
              <p className="text-textMuted max-w-lg">Unlock exclusive achievement badges by exceeding expectations and maintaining precise execution throughout the fiscal year.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(RARITY_COLOR).map(([r,c])=>(
                <span key={r} className={`${c} font-medium px-3 py-1 rounded-full border border-white/8 text-xs`}>{r}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BADGES.map(({icon,color,name,desc,rarity},i)=>{
              const a = ACCENT_MAP[color];
              return (
                <div key={name} className={`group relative rounded-2xl border ${a.border} p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${a.hover}`}
                  style={{background:'rgba(255,255,255,0.03)',transitionDelay:`${i*60}ms`,opacity:badgeVisible?1:0,transform:badgeVisible?'translateY(0)':'translateY(20px)'}}>
                  <div className={`w-14 h-14 rounded-2xl ${a.bg} border ${a.border} flex items-center justify-center mb-4 ${a.text} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
                  <div className={`text-xs font-bold mb-1 ${RARITY_COLOR[rarity]}`}>{rarity}</div>
                  <h4 className="text-sm font-bold text-textColor mb-2" style={{fontFamily:"'Syne',sans-serif"}}>{name}</h4>
                  <p className="text-xs text-textMuted leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative z-10 py-24 px-6">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${ctaVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-8'}`}>
          <div className="relative rounded-3xl border border-white/10 p-12 overflow-hidden" style={{background:'rgba(255,255,255,0.04)'}}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 rounded-full bg-atomPink/20 blur-3xl"/>
            <div className="absolute bottom-0 right-0 w-60 h-40 rounded-full bg-atomPurple/15 blur-3xl"/>
            <div className="relative z-10">
              <div className="text-xs font-medium text-textMuted uppercase tracking-widest mb-6">Ready to align?</div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-textColor mb-5 leading-tight" style={{fontFamily:"'Syne',sans-serif"}}>One platform. Every<br/>performance conversation.</h2>
              <p className="text-textMuted mb-10 max-w-lg mx-auto text-lg">AtomAlign brings together goal-setting, performance reviews, Teams notifications, and compliance tracking in one unified workspace.</p>
              <button onClick={()=>scrollTo('portals')} className="px-10 py-4 rounded-full font-bold text-white text-base transition-all hover:scale-105 hover:shadow-2xl hover:shadow-atomPink/30 inline-flex items-center gap-2" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6,#6366f1)'}}>
                Select Your Portal <ArrowRight size={16}/>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6)'}}>
              <Target size={13} className="text-white"/>
            </div>
            <span className="text-sm font-bold text-textColor" style={{fontFamily:"'Syne',sans-serif"}}>AtomAlign</span>
            <span className="text-xs text-textMuted ml-2">© 2026</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[{dot:'bg-emerald-400',label:'Entra SSO Ready'},{dot:'bg-blue-400',label:'Teams Bot Active'},{dot:'bg-indigo-400',label:'Audit Engine On'},{dot:'bg-amber-400',label:'Graph API Live'}].map(({dot,label})=>(
              <div key={label} className="flex items-center gap-1.5 text-xs text-textMuted">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`}/> {label}
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* SCROLL TOP */}
      <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
        className={`fixed bottom-8 right-8 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-textMuted hover:text-textColor bg-darkBg/80 backdrop-blur transition-all duration-300 z-50 ${showScrollTop?'opacity-100 translate-y-0':'opacity-0 translate-y-4 pointer-events-none'}`}>
        <ArrowUp size={16}/>
      </button>

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-semibold z-50 text-sm">{toastMessage}</div>
      )}
    </div>
  );
};

export default Home;

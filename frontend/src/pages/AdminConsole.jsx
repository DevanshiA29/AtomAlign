import { useState } from 'react';
import { Shield, Target, Users, Calendar, Download, Search, Activity, CheckCircle, ToggleRight, ToggleLeft, Send, Database, Clock, Unlock, Network, BriefcaseBusiness } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import ProfileWorkbench from '../components/ProfileWorkbench';

const OrgNode = ({ node, depth = 0 }) => {
  const roleTone =
    node.role === 'Admin'
      ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
      : node.role === 'Manager'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-slate-600 bg-slate-800/70 text-slate-200';

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3 border-l border-borderColor pl-4' : ''}`}>
      <div className="rounded-2xl border border-borderColor bg-darkBg/70 p-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase tracking-[0.3em] font-bold px-2 py-1 rounded-full border ${roleTone}`}>
                {node.role}
              </span>
              <span className="text-xs text-textMuted">{node.department || 'General'}</span>
            </div>
            <h4 className="font-semibold text-textColor">{node.name}</h4>
            <p className="text-xs text-textMuted mt-1">{node.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-52">
            <div className="rounded-xl border border-borderColor bg-darkBg px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-textMuted">Pending</p>
              <p className="font-bold text-amber-300">{node.metrics?.pending || 0}</p>
            </div>
            <div className="rounded-xl border border-borderColor bg-darkBg px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-textMuted">Locked</p>
              <p className="font-bold text-emerald-300">{node.metrics?.locked || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {node.children?.length > 0 && (
        <div className="mt-3">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminConsole = ({ portalUser }) => {
  const [profile, setProfile] = useState(portalUser);
  const [activeView, setActiveView] = useState('workspace');
  const { 
    windows, 
    auditLog, 
    teamMetrics, 
    orgHierarchy,
    managerDirectory,
    stats, 
    loading, 
    toggleWindow, 
    forceUnlockUser, 
    pushGlobalKPI, 
    exportAchievements 
  } = useAdminContext();

  const [dispatchForm, setDispatchForm] = useState({
    thrustArea: 'Revenue Growth', title: '', description: '', target: '', uom: 'Numeric'
  });
  const [targetDeps, setTargetDeps] = useState(['Engineering']);
  const [overrideSearch, setOverrideSearch] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const handleWindowToggle = (key) => {
    toggleWindow(key, !windows[key]);
  };

  const handleForceUnlock = async () => {
    if(!overrideSearch) return;
    await forceUnlockUser(overrideSearch);
    setOverrideSearch('');
  };

  const handleGlobalDispatch = async () => {
    if(!dispatchForm.title) return;
    setIsDispatching(true);
    await pushGlobalKPI({
      ...dispatchForm,
      targetDepartments: targetDeps
    });
    setIsDispatching(false);
    setDispatchForm({ ...dispatchForm, title: '', description: '', target: '' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><span className="animate-pulse text-atomPink font-bold">Loading Global Framework...</span></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="flex gap-2 p-1 bg-darkBg rounded-xl border border-borderColor w-fit">
        {[
          { id: 'workspace', label: 'Admin Workspace' },
          { id: 'profile', label: 'Personal Details' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === tab.id ? 'bg-atomPink/15 text-atomPink' : 'text-textMuted hover:text-textColor'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-atomPink" size={32} /> 
          Governance & Administration
        </h1>
        <p className="text-textMuted mt-2">
          Signed in as {profile?.name || profile?.email}. Manage global timelines, manager coverage, and the company hierarchy.
        </p>
      </header>

      {activeView === 'profile' ? (
        <ProfileWorkbench profile={profile} onProfileUpdate={setProfile} />
      ) : (
        <>

      {/* SECTION 1: TOP STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex items-center justify-between group hover:border-atomPink/50 transition-all">
          <div>
            <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-2">
              <Activity size={16} /> Global Submission Rate
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-atomPink to-atomPurple bg-clip-text text-transparent">{stats.globalSubmissionRate}%</span>
              <span className="text-sm text-textMuted">of workforce finalized Phase 1</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-atomPink flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <span className="font-bold text-textColor">{stats.globalSubmissionRate}%</span>
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between group hover:border-indigo-500/50 transition-all">
          <div>
            <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-2">
              <CheckCircle size={16} /> Manager Check-in Rate
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{stats.managerCheckinRate}%</span>
              <span className="text-sm text-textMuted">L1 Managers logged reviews</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <span className="font-bold text-textColor">{stats.managerCheckinRate}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <BriefcaseBusiness className="text-amber-300" size={22} /> Registered Managers
          </h2>
          <div className="space-y-3">
            {managerDirectory.map((manager) => (
              <div key={manager.id} className="rounded-2xl border border-borderColor bg-darkBg/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-textColor">{manager.name}</p>
                    <p className="text-xs text-textMuted mt-1">{manager.email}</p>
                    <p className="text-xs text-textMuted mt-1">{manager.department || 'General'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-amber-300">Reports</p>
                    <p className="text-lg font-bold text-amber-300">{manager.children?.length || 0}</p>
                  </div>
                </div>
              </div>
            ))}
            {managerDirectory.length === 0 && (
              <div className="rounded-2xl border border-dashed border-borderColor p-8 text-center text-textMuted">
                No managers have been registered yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <Network className="text-cyan-300" size={22} /> Company Hierarchy View
          </h2>
          <div className="space-y-4 max-h-[38rem] overflow-y-auto pr-2 custom-scrollbar">
            {orgHierarchy.map((node) => (
              <OrgNode key={node.id} node={node} />
            ))}
            {orgHierarchy.length === 0 && (
              <div className="rounded-2xl border border-dashed border-borderColor p-8 text-center text-textMuted">
                No hierarchy data is available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* SECTION 2: MAIN HUB (Team Metric Explorer) */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Users className="text-atomPurple" size={24} /> Team Alignment Tracker</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMetrics.map(team => (
              <div key={team.id} className="glass-card p-5 group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all">
                <div className="flex justify-between items-start mb-4 border-b border-borderColor pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-textColor">{team.team}</h3>
                    <p className="text-xs text-textMuted uppercase tracking-wider">L1: {team.manager}</p>
                  </div>
                  <div className="bg-darkBg px-3 py-1 rounded-full border border-borderColor text-xs font-bold text-atomPurple">
                    {team.pending + team.onTrack + team.completed} Goals
                  </div>
                </div>
                
                <div className="flex justify-between gap-2">
                  <div className="flex-1 bg-darkBg rounded-lg p-2 text-center border border-rose-500/20">
                    <span className="block text-rose-500 font-bold text-lg">{team.pending}</span>
                    <span className="text-[10px] text-textMuted uppercase tracking-widest">Pending</span>
                  </div>
                  <div className="flex-1 bg-darkBg rounded-lg p-2 text-center border border-amber-500/20">
                    <span className="block text-amber-500 font-bold text-lg">{team.onTrack}</span>
                    <span className="text-[10px] text-textMuted uppercase tracking-widest">On Track</span>
                  </div>
                  <div className="flex-1 bg-darkBg rounded-lg p-2 text-center border border-emerald-500/20">
                    <span className="block text-emerald-500 font-bold text-lg">{team.completed}</span>
                    <span className="text-[10px] text-textMuted uppercase tracking-widest">Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: CONTROL CENTER (Window Management) */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Calendar className="text-indigo-400" size={24} /> Window Controls</h2>
          <div className="glass-card p-1">
            {[
              { id: 'phase1', label: 'Phase 1 Goal Setting' },
              { id: 'q1', label: 'Q1 Check-in Window' },
              { id: 'q2', label: 'Q2 Check-in Window' },
              { id: 'q3', label: 'Q3 Check-in Window' },
              { id: 'q4', label: 'Q4 / Annual Review' },
            ].map((win, idx) => (
              <div key={win.id} className={`flex items-center justify-between p-4 ${idx !== 4 ? 'border-b border-borderColor/50' : ''}`}>
                <div>
                  <h4 className={`font-semibold ${windows[win.id] ? 'text-textColor' : 'text-textMuted'}`}>{win.label}</h4>
                  <p className="text-xs text-textMuted">{windows[win.id] ? 'System Unlocked globally.' : 'Globally locked.'}</p>
                </div>
                <button 
                  onClick={() => handleWindowToggle(win.id)}
                  className={`transition-all ${windows[win.id] ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-600'}`}
                >
                  {windows[win.id] ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 4: DATA ENGINE (Global Goal Dispatcher) */}
        <div className="glass-card p-6 border-t-4 border-t-atomPink">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Target className="text-atomPink" size={24} /> Global KPI Dispatcher</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textMuted mb-1 uppercase font-semibold">Thrust Area</label>
                <select className="input-field w-full text-sm bg-darkBg" value={dispatchForm.thrustArea} onChange={e => setDispatchForm({...dispatchForm, thrustArea: e.target.value})}>
                  <option>Revenue Growth</option>
                  <option>Operational Efficiency</option>
                  <option>Compliance & Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 uppercase font-semibold">UoM</label>
                <select className="input-field w-full text-sm bg-darkBg" value={dispatchForm.uom} onChange={e => setDispatchForm({...dispatchForm, uom: e.target.value})}>
                  <option>Numeric</option>
                  <option>%</option>
                  <option>Timeline</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-textMuted mb-1 uppercase font-semibold">Goal Title</label>
              <input type="text" className="input-field w-full text-sm bg-darkBg" placeholder="e.g. Org-wide Security Compliance" value={dispatchForm.title} onChange={e => setDispatchForm({...dispatchForm, title: e.target.value})}/>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textMuted mb-1 uppercase font-semibold">Target Value</label>
                <input type="text" className="input-field w-full text-sm bg-darkBg" placeholder="100" value={dispatchForm.target} onChange={e => setDispatchForm({...dispatchForm, target: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 uppercase font-semibold">Target Departments</label>
                <div className="flex gap-2 flex-wrap">
                  {['Engineering', 'Marketing', 'Sales', 'All Company'].map(dep => (
                    <label key={dep} className="flex items-center gap-1 text-xs text-textMuted cursor-pointer bg-darkBg px-2 py-1 rounded border border-borderColor hover:border-atomPink transition-colors">
                      <input type="checkbox" checked={targetDeps.includes(dep)} onChange={(e) => {
                        if(e.target.checked) setTargetDeps([...targetDeps, dep]);
                        else setTargetDeps(targetDeps.filter(d => d !== dep));
                      }} className="accent-atomPink" /> {dep}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleGlobalDispatch} disabled={isDispatching || !dispatchForm.title} className="w-full btn-primary flex items-center justify-center gap-2 mt-2">
              {isDispatching ? <span className="animate-pulse flex items-center gap-2"><Send size={18} /> Dispatching to Nodes...</span> : <span className="flex items-center gap-2"><Send size={18} /> Push Global KPI</span>}
            </button>
          </div>
        </div>

        {/* SECTION 5: UTILITY SUITE */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-t-4 border-t-amber-500 group">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-amber-500"><Unlock size={24} /> Emergency Overrides</h2>
            <p className="text-sm text-textMuted mb-4">Select an employee to forcefully crack open their approved goal sheet and return it to Draft state.</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                <input 
                  type="text" 
                  placeholder="Search Employee ID or Name..." 
                  className="input-field w-full pl-10 text-sm"
                  value={overrideSearch}
                  onChange={(e) => setOverrideSearch(e.target.value)}
                />
              </div>
              <button onClick={handleForceUnlock} disabled={!overrideSearch} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${overrideSearch ? 'bg-amber-500 text-darkBg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-darkBg border border-borderColor text-textMuted cursor-not-allowed'}`}>
                Force Unlock
              </button>
            </div>
          </div>

          <div className="glass-card p-6 border-t-4 border-t-emerald-500 flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all">
            <h2 className="text-xl font-bold mb-2">Platform Data Extract</h2>
            <p className="text-sm text-textMuted mb-4">Generate raw CSV ledgers of all locked organizational achievement data.</p>
            <button onClick={exportAchievements} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 hover:text-darkBg transition-all w-full justify-center group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Download size={20} /> Download Achievement Ledger
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 6: BOTTOM ANCHOR (Audit Trail) */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-borderColor bg-darkBg/50 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><Database className="text-slate-400" size={24} /> Immutable Audit Ledger</h2>
          <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full font-bold border border-indigo-500/30 flex items-center gap-1">
            <Shield size={12} /> Encrypted
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-textMuted uppercase bg-darkBg border-b border-borderColor">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor ID</th>
                <th className="px-6 py-4">Target Node</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Prior State</th>
                <th className="px-6 py-4">New State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderColor/50">
              {auditLog.map((log, index) => {
                // Ensure date string looks nice
                const timeString = new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ', ' + new Date(log.timestamp).toLocaleDateString([], {month:'short', day:'numeric'});
                return (
                <tr key={log._id || log.id || `${log.timestamp || 'log'}-${index}`} className="hover:bg-darkBg/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-textMuted font-mono text-xs flex items-center gap-2">
                    <Clock size={12} className="text-indigo-400" /> {log.time || timeString}
                  </td>
                  <td className="px-6 py-4 font-bold text-textColor">{log.adminId || log.admin}</td>
                  <td className="px-6 py-4 text-atomPurple font-medium">{log.targetNode || log.target}</td>
                  <td className="px-6 py-4">
                    <span className="bg-borderColor/50 px-2 py-1 rounded text-xs font-semibold">{log.actionEvent || log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-textMuted">{log.priorState || log.prev}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-400">{log.newState || log.new}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

    </div>
  );
};

export default AdminConsole;

import { useState, useEffect } from 'react';
import { Target, Plus, Save, AlertCircle, CheckCircle2, Lock, Unlock, Calendar, Percent, Hash, CircleSlash, Shield, Send, MessageSquare, RefreshCw, SendToBack, Loader2, Trash2, Search } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { API_URL } from '../lib/api';
import ProfileWorkbench from '../components/ProfileWorkbench';

const THRUST_AREAS = [
  'Revenue Growth',
  'Operational Efficiency',
  'Customer Success',
  'Innovation & R&D',
  'Talent & Culture',
  'Compliance & Risk'
];

const UOM_OPTIONS = ['Numeric', '%', 'Timeline', 'Zero-based'];
const STATUS_OPTIONS = ['Not Started', 'On Track', 'Completed'];
const COMMENT_ORDER = ['Review', 'Q1', 'Q2', 'Q3', 'Q4'];

const EmployeePortal = ({ portalUser }) => {
  const [profile, setProfile] = useState(portalUser);
  const [activeView, setActiveView] = useState('workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Tabs for the 4 statuses
  const [activeStatusTab, setActiveStatusTab] = useState('Draft');
  
  const [activeQuarter, setActiveQuarter] = useState('Q1');
  const quarterTabs = ['Q1', 'Q2', 'Q3', 'Q4'];
  const [syncingGoalId, setSyncingGoalId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { windows } = useAdminContext(); 
  const checkInMap = {
    'Q1': windows.q1,
    'Q2': windows.q2,
    'Q3': windows.q3,
    'Q4': windows.q4
  };

  const [goals, setGoals] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState(portalUser?.managerId || '');

  useEffect(() => {
    setProfile(portalUser);
  }, [portalUser]);

  useEffect(() => {
    setSelectedManagerId(profile?.managerId || '');
  }, [profile?.managerId]);

  useEffect(() => {
    if (!profile?.id) return;
    fetchSheet(activeStatusTab);
  }, [activeStatusTab, profile?.id]);

  useEffect(() => {
    fetchManagers();
  }, []);

  async function fetchManagers() {
    try {
      const res = await fetch(`${API_URL}/portal/managers`);
      if (!res.ok) return;
      const data = await res.json();
      setManagers(data.managers || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  }

  async function fetchSheet(status) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/portal/my-sheets?userId=${profile.id}&status=${status}`);
      if(res.ok) {
        const data = await res.json();
        
        if(data.sheets && data.sheets.length > 0) {
          const sheet = data.sheets[0]; // Assuming 1 sheet per status
          const mappedGoals = sheet.items.map((item, idx) => ({
            id: item.id || idx,
            thrustArea: item.thrustArea,
            title: item.title,
            description: item.description,
            weightage: item.weightage,
            target: item.targetValue,
            uom: item.uom,
            actuals: item.actualAchievements || { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
            status: item.status || { Q1: 'Not Started', Q2: 'Not Started', Q3: 'Not Started', Q4: 'Not Started' },
            type: item.type || 'Individual',
            isPrimaryOwner: false,
            comments: item.managerComments
              ? Object.entries(item.managerComments)
                  .filter(([, text]) => text)
                  .sort(([left], [right]) => COMMENT_ORDER.indexOf(left) - COMMENT_ORDER.indexOf(right))
                  .map(([quarter, text]) => ({ quarter, text }))
              : []
          }));
          setGoals(mappedGoals);
        } else {
          setGoals(status === 'Draft' ? [{
            id: Date.now().toString(),
            thrustArea: 'Customer Success',
            title: '',
            description: '',
            weightage: 100,
            target: '',
            uom: '%',
            actuals: { Q1: '', Q2: '', Q3: '', Q4: '' },
            status: { Q1: 'Not Started', Q2: 'Not Started', Q3: 'Not Started', Q4: 'Not Started' },
            type: 'Individual',
            isPrimaryOwner: false,
            comments: []
          }] : []);
        }
      }
    } catch (error) {
      console.error("Error fetching sheet:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }

  const isDraftingPhase = activeStatusTab === 'Draft' || activeStatusTab === 'Returned for Rework';
  const isExecutionPhase = activeStatusTab === 'Locked';
  const isCurrentTabActive = isExecutionPhase && checkInMap[activeQuarter];

  // --- VALIDATIONS ---
  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
  const hasCountError = goals.length > 8;
  const invalidWeightageGoals = goals.filter(g => Number(g.weightage) < 10);
  const hasEmptyRequiredFields = goals.some(g => !g.title?.trim() || !g.target || !g.thrustArea);
  const hasManagerSelection = Boolean(selectedManagerId);
  
  const isValid = totalWeightage === 100 && !hasCountError && invalidWeightageGoals.length === 0 && !hasEmptyRequiredFields && goals.length > 0;
  const canSubmitForApproval = isValid && hasManagerSelection;

  // --- ACTIONS ---
  const updateGoal = (id, field, value) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const updateActual = (id, q, value, isPrimaryOwner) => {
    setGoals(goals.map(g => g.id === id ? { ...g, actuals: { ...g.actuals, [q]: value } } : g));
    if (isPrimaryOwner) {
      setSyncingGoalId(id);
      setTimeout(() => setSyncingGoalId(null), 1500);
    }
  };

  const updateStatus = (id, q, value) => {
    setGoals(goals.map(g => g.id === id ? { ...g, status: { ...g.status, [q]: value } } : g));
  };

  const addNewGoal = () => {
    if (goals.length >= 8) return;
    setGoals([...goals, {
      id: Date.now().toString(),
      thrustArea: THRUST_AREAS[0],
      title: '',
      description: '',
      weightage: 0,
      target: '',
      uom: 'Numeric',
      actuals: { Q1: '', Q2: '', Q3: '', Q4: '' },
      status: { Q1: 'Not Started', Q2: 'Not Started', Q3: 'Not Started', Q4: 'Not Started' },
      type: 'Individual',
      isPrimaryOwner: false,
      comments: []
    }]);
  };

  const handleDeleteGoal = async (id) => {
    // If it's a new goal (not saved to DB yet), just remove from UI
    if (id.toString().length < 24) { // Roughly distinguishing between UUID/ObjectId and Date.now()
      setGoals(goals.filter(g => g.id !== id));
      return;
    }

    // Call DELETE API
    try {
      const res = await fetch(`${API_URL}/portal/goal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals(goals.filter(g => g.id !== id));
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting goal');
    }
  };

  const handleSubmission = async (newStatus) => {
    if (newStatus === 'Pending Approval' && !canSubmitForApproval) return;
    
    setSaving(true);
    
    const payloadItems = goals.map(g => ({
      id: g.id.toString().length > 15 ? g.id : undefined, // Only send ID if it's from DB
      thrustArea: g.thrustArea,
      title: g.title,
      description: g.description,
      uom: g.uom,
      targetValue: g.target,
      weightage: g.weightage,
      type: g.type,
      actualAchievements: g.actuals,
      status: g.status,
    }));

    try {
      const res = await fetch(`${API_URL}/portal/my-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          managerId: selectedManagerId || undefined,
          fiscalYear: '2026',
          status: newStatus,
          items: payloadItems
        })
      });
      
      if(res.ok) {
        // If they submitted to manager, switch the tab to Pending Approval
        if (newStatus !== 'Draft') {
          setActiveStatusTab(newStatus);
          showToast('Submitted request successfully');
        } else {
          // If just saving draft, refresh the goals
          fetchSheet('Draft');
          showToast('Draft saved successfully');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error saving to backend');
    } finally {
      setSaving(false);
    }
  };

  const renderTargetInput = (goal, isReadOnly) => {
    if (goal.uom === 'Timeline') {
      return (
        <input 
          type="date" 
          value={goal.target}
          readOnly={isReadOnly}
          className={`input-field w-full ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          onChange={(e) => updateGoal(goal.id, 'target', e.target.value)}
        />
      );
    }
    return (
      <input 
        type="text" 
        value={goal.target}
        readOnly={isReadOnly}
        placeholder="Enter value"
        className={`input-field w-full ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        onChange={(e) => updateGoal(goal.id, 'target', e.target.value)}
      />
    );
  };

  const getUoMIcon = (uom) => {
    switch(uom) {
      case '%': return <Percent size={14} className="text-atomPink" />;
      case 'Timeline': return <Calendar size={14} className="text-atomPurple" />;
      case 'Zero-based': return <CircleSlash size={14} className="text-cyan-500" />;
      default: return <Hash size={14} className="text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex gap-2 p-1 bg-darkBg rounded-xl border border-borderColor w-fit">
        {[
          { id: 'workspace', label: 'Goal Workspace' },
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

      {activeView === 'profile' ? (
        <ProfileWorkbench
          profile={profile}
          managers={managers}
          allowManagerEdit
          onProfileUpdate={(updatedProfile) => {
            setProfile(updatedProfile);
            setSelectedManagerId(updatedProfile.managerId || '');
          }}
        />
      ) : (
        <>
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-darkBg/50 p-4 rounded-xl border border-borderColor shadow-lg relative z-20">
        <div className="flex gap-4 items-center">
          <div>
            <h2 className="text-xl font-bold text-textColor">My Performance Frameworks</h2>
            <p className="text-xs text-textMuted mt-1">
              Signed in as {profile?.name || profile?.email} • Role: {profile?.role}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {isDraftingPhase && (
            <div className="min-w-[18rem]">
              <label className="block text-[10px] text-textMuted mb-1 uppercase tracking-wider font-semibold">
                Submit For Approval To
              </label>
              <select
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(e.target.value)}
                className="input-field w-full bg-darkBg text-sm"
              >
                <option value="">Select a registered manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} • {manager.department} • {manager.teamSize} reports
                  </option>
                ))}
              </select>
            </div>
          )}
          {isDraftingPhase && (
            <button onClick={() => handleSubmission('Draft')} disabled={saving} className="btn-secondary flex items-center gap-2">
              <Save size={16} /> Save Draft
            </button>
          )}
          {isDraftingPhase && (
            <button onClick={() => handleSubmission('Pending Approval')} disabled={!canSubmitForApproval || saving} className={`btn-primary flex items-center gap-2 ${(!canSubmitForApproval || saving) && 'opacity-50 cursor-not-allowed grayscale'}`}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
              Submit to Manager
            </button>
          )}
          {isExecutionPhase && (
            <button onClick={() => handleSubmission('Locked')} disabled={saving} className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 border-none text-white">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              Save Progress Update
            </button>
          )}
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4 relative">
        <div className="absolute top-1/2 left-10 right-10 h-1 bg-borderColor -translate-y-1/2 hidden md:block z-0"></div>
        
        {[
          { label: 'Draft', state: 'Draft', icon: <Unlock size={18} /> },
          { label: 'Seeking Approval', state: 'Pending Approval', icon: <SendToBack size={18} /> },
          { label: 'Locked (Execution)', state: 'Locked', icon: <Target size={18} /> },
          { label: 'Completed', state: 'Completed', icon: <Lock size={18} /> }
        ].map((step) => {
          const isActive = activeStatusTab === step.state;
          
          return (
            <div 
              key={step.label} 
              className="relative z-10 flex flex-col items-center gap-2 bg-darkBg px-4 cursor-pointer"
              onClick={() => setActiveStatusTab(step.state)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                isActive ? 'bg-gradient-to-tr from-atomPink to-atomPurple text-white scale-110 shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 
                'bg-darkBg border-2 border-borderColor text-textMuted hover:border-atomPink/50'
              }`}>
                {step.icon}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-textColor' : 'text-textMuted'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="animate-spin text-atomPink mb-4" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-atomPink to-atomPurple bg-clip-text text-transparent">Loading {activeStatusTab} Framework...</h2>
        </div>
      ) : (
        <>
          {/* VALIDATION BANNER (PHASE 1) */}
          {isDraftingPhase && goals.length > 0 && (
            <div className={`glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-l-4 transition-colors ${isValid ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-atomPink bg-atomPink/5'}`}>
              <div className="flex items-start gap-3">
                {isValid ? <CheckCircle2 className="text-emerald-500 mt-1" /> : <AlertCircle className="text-atomPink mt-1" />}
                <div>
                  <h3 className="font-semibold text-textColor">Pre-Submission Validation</h3>
                  <div className="text-sm text-textMuted flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span>Weightage: <strong className={totalWeightage === 100 ? 'text-emerald-500' : 'text-atomPink'}>{totalWeightage}% / 100%</strong></span>
                    <span>Limit: <strong className={!hasCountError ? 'text-emerald-500' : 'text-atomPink'}>{goals.length} / 8 Goals</strong></span>
                    {invalidWeightageGoals.length > 0 && (
                      <span className="text-atomPink font-medium">Error: Min 10% per goal required.</span>
                    )}
                    {hasEmptyRequiredFields && (
                      <span className="text-atomPink font-medium">Error: Missing fields.</span>
                    )}
                    {!hasManagerSelection && (
                      <span className="text-atomPink font-medium">Error: Choose a manager before submission.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATES */}
          {goals.length === 0 && !isDraftingPhase && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <Search size={48} className="text-slate-500 mb-4" />
              <h3 className="text-xl font-bold text-textColor mb-2">No {activeStatusTab} Sheets Found</h3>
              <p className="text-textMuted max-w-md">You do not have any goal sheets currently in the '{activeStatusTab}' status.</p>
            </div>
          )}

          {/* QUARTERLY TABS (PHASE 2 Execution) */}
          {(isExecutionPhase || activeStatusTab === 'Completed') && goals.length > 0 && (
            <div className="flex gap-2 border-b border-borderColor pb-2">
              {quarterTabs.map(tab => {
                const isTabOpenInCalendar = checkInMap[tab];
                return (
                  <button 
                    key={tab}
                    onClick={() => setActiveQuarter(tab)}
                    className={`px-6 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${activeQuarter === tab ? 'bg-borderColor text-textColor border-b-2 border-atomPink' : 'text-textMuted hover:text-textColor hover:bg-borderColor/50'}`}
                  >
                    {tab} Check-in
                    {isExecutionPhase && isTabOpenInCalendar && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* GOAL ITEMS GRID */}
          <div className="space-y-6">
            {goals.map((goal, index) => {
              const isShared = goal.type === 'Shared';
              const isCoreLocked = !isDraftingPhase || isShared;
              const isWeightageLocked = !isDraftingPhase;

              return (
                <div key={goal.id} className="glass-card p-6 relative overflow-hidden group hover:border-borderColor/80 transition-all">
                  
                  {isShared && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-atomPurple to-indigo-500 text-white text-xs px-4 py-1 rounded-bl-xl font-medium shadow-lg flex items-center gap-1">
                      <Shield size={12} /> Shared Corporate KPI
                    </div>
                  )}
                  {goal.isPrimaryOwner && (
                    <div className={`absolute top-0 left-0 bg-cyan-500/20 border-r border-b border-cyan-500/30 text-cyan-400 text-[10px] px-3 py-1 rounded-br-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-opacity ${syncingGoalId === goal.id ? 'opacity-100' : 'opacity-70'}`}>
                      <RefreshCw size={10} className={syncingGoalId === goal.id ? 'animate-spin text-white' : ''} />
                      {syncingGoalId === goal.id ? 'Syncing to Global...' : 'Primary Owner'}
                    </div>
                  )}

                  {isDraftingPhase && (
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-500/10"
                      title="Delete Goal"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-4">
                    
                    <div className="col-span-1 hidden md:flex flex-col items-center mt-2">
                      <div className="w-8 h-8 rounded-full bg-darkBg flex items-center justify-center text-textMuted font-bold border border-borderColor shadow-inner">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Thrust Area</label>
                          <select 
                            value={goal.thrustArea}
                            disabled={isCoreLocked}
                            onChange={(e) => updateGoal(goal.id, 'thrustArea', e.target.value)}
                            className={`input-field w-full text-sm ${isCoreLocked ? 'opacity-60 cursor-not-allowed bg-darkBg/50 border-transparent' : ''}`}
                          >
                            {THRUST_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Goal Title</label>
                          <input 
                            type="text" 
                            value={goal.title} 
                            readOnly={isCoreLocked}
                            placeholder="e.g., Launch V2 Dashboard"
                            className={`input-field w-full text-sm font-semibold ${isCoreLocked ? 'opacity-60 cursor-not-allowed bg-darkBg/50 border-transparent' : ''}`}
                            onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Description</label>
                        <textarea 
                          value={goal.description} 
                          readOnly={isCoreLocked}
                          placeholder="Define the specific impact and steps..."
                          rows={2}
                          className={`input-field w-full text-sm resize-none ${isCoreLocked ? 'opacity-60 cursor-not-allowed bg-darkBg/50 border-transparent' : ''}`}
                          onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Unit of Measure</label>
                          <div className="relative">
                            <select 
                              value={goal.uom}
                              disabled={isCoreLocked}
                              onChange={(e) => updateGoal(goal.id, 'uom', e.target.value)}
                              className={`input-field w-full text-sm pl-8 appearance-none ${isCoreLocked ? 'opacity-60 cursor-not-allowed bg-darkBg/50 border-transparent' : ''}`}
                            >
                              {UOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              {getUoMIcon(goal.uom)}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-textMuted mb-1 uppercase tracking-wider font-semibold">Target</label>
                          {renderTargetInput(goal, isCoreLocked)}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center h-full border-t md:border-t-0 md:border-l border-borderColor pt-4 md:pt-0 md:pl-6">
                      <label className="block text-xs text-textMuted mb-2 uppercase tracking-wider font-semibold">Weightage</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={goal.weightage}
                          readOnly={isWeightageLocked}
                          onChange={(e) => updateGoal(goal.id, 'weightage', e.target.value)}
                          className={`input-field w-full text-center text-3xl font-bold py-4 ${isWeightageLocked ? 'opacity-60 cursor-not-allowed bg-darkBg/50 border-transparent' : 'text-atomPink border-atomPink/30 focus:border-atomPink focus:shadow-[0_0_15px_rgba(236,72,153,0.15)]'}`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted font-bold">%</span>
                      </div>
                      {Number(goal.weightage) < 10 && !isWeightageLocked && (
                        <span className="text-[10px] text-atomPink mt-2 block text-center font-medium">Min 10% required</span>
                      )}
                    </div>

                    {(isExecutionPhase || activeStatusTab === 'Completed') && (
                      <div className="col-span-1 md:col-span-3 h-full flex flex-col gap-4">
                        <div className={`bg-darkBg/30 rounded-xl p-4 border shadow-inner flex flex-col justify-center flex-1 transition-colors ${isCurrentTabActive ? 'border-atomPurple/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'border-borderColor opacity-60'}`}>
                          <h4 className={`text-xs uppercase tracking-wider font-bold mb-4 flex items-center justify-between ${isCurrentTabActive ? 'text-atomPurple' : 'text-textMuted'}`}>
                            <span className="flex items-center gap-2"><Target size={14} /> {activeQuarter} Actuals</span>
                            {isCurrentTabActive && <span className="text-[10px] bg-atomPurple/20 text-atomPurple px-2 py-0.5 rounded-full">Open</span>}
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] text-textMuted mb-1 uppercase">Actual Achieved</label>
                              <input 
                                type={goal.uom === 'Timeline' ? 'date' : 'text'}
                                value={goal.actuals[activeQuarter]}
                                readOnly={!isCurrentTabActive}
                                onChange={(e) => updateActual(goal.id, activeQuarter, e.target.value, goal.isPrimaryOwner)}
                                className={`input-field w-full text-sm bg-darkBg focus:border-atomPurple focus:ring-atomPurple ${!isCurrentTabActive ? 'cursor-not-allowed border-transparent' : 'border-borderColor/50'}`}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[10px] text-textMuted mb-1 uppercase">Status</label>
                              <select 
                                value={goal.status[activeQuarter]}
                                disabled={!isCurrentTabActive}
                                onChange={(e) => updateStatus(goal.id, activeQuarter, e.target.value)}
                                className={`input-field w-full text-sm font-medium ${!isCurrentTabActive ? 'cursor-not-allowed border-transparent' : 'border-borderColor/50'} ${
                                  goal.status[activeQuarter] === 'Completed' ? 'text-emerald-500 bg-emerald-500/5' :
                                  goal.status[activeQuarter] === 'On Track' ? 'text-amber-500 bg-amber-500/5' :
                                  'text-textMuted bg-darkBg'
                                }`}
                              >
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        {goal.comments && goal.comments.length > 0 && (
                          <div className="bg-darkBg/50 rounded-xl p-3 border border-borderColor flex-1 overflow-y-auto max-h-32 custom-scrollbar">
                            <h4 className="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                              <MessageSquare size={10} /> Manager Feedback
                            </h4>
                            <div className="space-y-2">
                              {goal.comments.map((comment, i) => (
                                <div key={i} className="text-xs bg-darkBg p-2 rounded-lg border border-borderColor/30">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-textColor">Manager</span>
                                    <span className="text-[9px] text-textMuted">{comment.quarter}</span>
                                  </div>
                                  <p className="text-textMuted italic">"{comment.text}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                  {goal.comments && goal.comments.length > 0 && (
                    <div className="mt-5 bg-darkBg/50 rounded-xl p-3 border border-borderColor">
                      <h4 className="text-[10px] text-textMuted uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                        <MessageSquare size={10} /> Manager Notes
                      </h4>
                      <div className="space-y-2">
                        {goal.comments.map((comment, i) => (
                          <div key={i} className="text-xs bg-darkBg p-2 rounded-lg border border-borderColor/30">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-textColor">
                                {comment.quarter === 'Review' ? 'Review Request' : 'Manager'}
                              </span>
                              <span className="text-[9px] text-textMuted">{comment.quarter}</span>
                            </div>
                            <p className="text-textMuted italic">"{comment.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isDraftingPhase && goals.length < 8 && (
            <button 
              onClick={addNewGoal}
              className="w-full glass-card py-4 border-dashed border-2 border-borderColor text-textMuted hover:text-atomPink hover:border-atomPink hover:bg-atomPink/5 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} /> Add New Goal Item ({goals.length}/8)
            </button>
          )}
        </>
      )}
        </>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 z-50 animate-fade-in">
          <CheckCircle2 size={20} />
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default EmployeePortal;

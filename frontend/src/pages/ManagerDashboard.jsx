import { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit2,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  XCircle
} from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { API_URL } from '../lib/api';
import ProfileWorkbench from '../components/ProfileWorkbench';
const STATUS_LABELS = ['All', 'Requires Action', 'Locked', 'Returned for Rework', 'Draft'];

const badgeToneMap = {
  emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30',
  sky: 'from-sky-500/20 to-cyan-500/10 text-sky-300 border-sky-500/30',
  amber: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/30',
  rose: 'from-rose-500/20 to-pink-500/10 text-rose-300 border-rose-500/30'
};

const statusToneMap = {
  'Pending Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Locked: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Returned for Rework': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Draft: 'bg-slate-800 text-slate-300 border-slate-700'
};

const progressBarTone = (value) => {
  if (value >= 80) return 'from-emerald-500 to-teal-400';
  if (value >= 50) return 'from-amber-500 to-orange-400';
  return 'from-rose-500 to-pink-400';
};

const quarterStatusTone = (status) => {
  if (status === 'Completed') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'On Track') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-slate-800 text-slate-300 border-slate-700';
};

const ManagerDashboard = ({ portalUser }) => {
  const [profile, setProfile] = useState(portalUser);
  const [activeView, setActiveView] = useState('workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [draftGoals, setDraftGoals] = useState([]);
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [reworkReason, setReworkReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const { windows } = useAdminContext();
  const defaultQuarter = windows.q4 ? 'Q4' : windows.q3 ? 'Q3' : windows.q2 ? 'Q2' : 'Q1';
  const [activeQuarter, setActiveQuarter] = useState(defaultQuarter);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncSelectedEmployee = (employeeId, sourceQueue = queue, quarter = activeQuarter) => {
    const selected = sourceQueue.find((entry) => entry.id === employeeId) || null;
    setSelectedEmpId(employeeId || null);
    setDraftGoals(selected ? JSON.parse(JSON.stringify(selected.goals || [])) : []);
    setFeedbackText(selected?.managerFeedback?.[quarter] || '');
  };

  async function fetchQueue(preferredEmployeeId) {
    try {
      const res = await fetch(`${API_URL}/portal/queue?managerId=${profile.id}`);
      if (!res.ok) return;

      const data = await res.json();
      setQueue(data);

      const nextSelectedId =
        (preferredEmployeeId && data.some((entry) => entry.id === preferredEmployeeId) && preferredEmployeeId) ||
        (selectedEmpId && data.some((entry) => entry.id === selectedEmpId) && selectedEmpId) ||
        data[0]?.id ||
        null;

      syncSelectedEmployee(nextSelectedId, data);
    } catch (error) {
      console.error(error);
      showToast('Unable to load the manager queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profile?.id) return;
    let isMounted = true;

    const bootstrapQueue = async () => {
      try {
        const res = await fetch(`${API_URL}/portal/queue?managerId=${profile.id}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted) return;

        setQueue(data);
        syncSelectedEmployee(data[0]?.id || null, data);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          showToast('Unable to load the manager queue.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapQueue();

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const selectedEmployee = queue.find((entry) => entry.id === selectedEmpId) || null;
  const totalWeightage = draftGoals.reduce((sum, goal) => sum + Number(goal.weightage || 0), 0);
  const isWeightageValid = totalWeightage === 100;
  const isMinValid = draftGoals.every((goal) => Number(goal.weightage) >= 10);
  const isMaxValid = draftGoals.length <= 8;
  const canApprove = isWeightageValid && isMinValid && isMaxValid;

  const teamStats = useMemo(() => {
    const pendingCount = queue.filter((entry) => entry.status === 'Pending Approval').length;
    const lockedCount = queue.filter((entry) => entry.status === 'Locked').length;
    const avgProgress = queue.length
      ? Math.round(queue.reduce((sum, entry) => sum + (entry.progress?.completionRate || 0), 0) / queue.length)
      : 0;

    return {
      teamSize: queue.length,
      pendingCount,
      lockedCount,
      avgProgress
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    return queue.filter((entry) => {
      const haystack = `${entry.name} ${entry.dept} ${entry.badge?.label || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === 'All'
          ? true
          : filterStatus === 'Requires Action'
            ? entry.status === 'Pending Approval'
            : entry.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [queue, searchTerm, filterStatus]);

  const handleSelectEmployee = (id) => {
    syncSelectedEmployee(id);
  };

  const handleInlineEdit = (goalId, field, value) => {
    setDraftGoals((currentGoals) =>
      currentGoals.map((goal) => (goal.id === goalId ? { ...goal, [field]: value } : goal))
    );
  };

  const handleApprove = async () => {
    if (!selectedEmployee?.sheetId || !canApprove) return;

    setSaving(true);
    try {
        const res = await fetch(`${API_URL}/portal/sheet/${selectedEmployee.sheetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Locked', goals: draftGoals })
      });

      if (!res.ok) throw new Error('Approval failed');

      await fetchQueue(selectedEmpId);
      showToast('Goals approved and locked for execution.');
    } catch (error) {
      console.error(error);
      showToast('Approval could not be completed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRework = async () => {
    if (!selectedEmployee?.sheetId || !reworkReason.trim()) {
      showToast('Add a clear recommendation before returning the sheet.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/portal/sheet/${selectedEmployee.sheetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Returned for Rework', reworkReason })
      });

      if (!res.ok) throw new Error('Rework request failed');

      setReworkModalOpen(false);
      setReworkReason('');
      await fetchQueue(selectedEmpId);
      showToast('Recommendations sent back to the employee.');
    } catch (error) {
      console.error(error);
      showToast('Unable to recommend changes right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedEmployee?.sheetId) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/portal/sheet/${selectedEmployee.sheetId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter: activeQuarter, text: feedbackText })
      });

      if (!res.ok) throw new Error('Feedback save failed');

      setQueue((currentQueue) =>
        currentQueue.map((entry) =>
          entry.id === selectedEmpId
            ? {
                ...entry,
                managerFeedback: { ...entry.managerFeedback, [activeQuarter]: feedbackText }
              }
            : entry
        )
      );

      showToast(`${activeQuarter} feedback saved.`);
    } catch (error) {
      console.error(error);
      showToast('Unable to save feedback.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen animate-fade-in">
        <Loader2 size={48} className="animate-spin text-atomPink mb-4" />
        <h2 className="text-xl font-bold bg-gradient-to-r from-atomPink to-amber-400 bg-clip-text text-transparent">
          Loading manager workspace...
        </h2>
        <p className="text-textMuted text-sm">Building a live view of team goals and approvals.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 flex gap-6 h-[calc(100vh-4rem)]">
      <div className="w-[23rem] flex flex-col gap-4">
        <div className="flex gap-2 p-1 bg-darkBg rounded-xl border border-borderColor w-full">
          {[
            { id: 'workspace', label: 'Manager Portal' },
            { id: 'profile', label: 'Personal Details' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeView === tab.id ? 'bg-atomPink/15 text-atomPink' : 'text-textMuted hover:text-textColor'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeView === 'profile' ? (
          <ProfileWorkbench profile={profile} onProfileUpdate={setProfile} />
        ) : (
          <>
        <div className="glass-card p-5 space-y-4 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300 mb-2">Manager Command Center</p>
              <h2 className="text-2xl font-bold text-textColor">Team Performance Radar</h2>
              <p className="text-sm text-textMuted mt-1">
                Review submitted goals, spot momentum, and coach each teammate with context.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 flex items-center justify-center shadow-[0_0_25px_rgba(251,146,60,0.28)]">
              <Sparkles className="text-white" size={22} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-borderColor bg-darkBg/60 p-4">
              <p className="text-xs uppercase tracking-wider text-textMuted mb-1">Team Members</p>
              <p className="text-2xl font-bold text-textColor">{teamStats.teamSize}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs uppercase tracking-wider text-amber-300 mb-1">Needs Review</p>
              <p className="text-2xl font-bold text-amber-300">{teamStats.pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs uppercase tracking-wider text-emerald-300 mb-1">Execution Live</p>
              <p className="text-2xl font-bold text-emerald-300">{teamStats.lockedCount}</p>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-xs uppercase tracking-wider text-sky-300 mb-1">Avg Completion</p>
              <p className="text-2xl font-bold text-sky-300">{teamStats.avgProgress}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col min-h-0 flex-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by name, team, or badge..."
              className="input-field w-full pl-9 text-sm bg-darkBg"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {STATUS_LABELS.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  filterStatus === status
                    ? 'bg-atomPink/15 text-atomPink border-atomPink/40'
                    : 'bg-darkBg text-textMuted border-borderColor hover:border-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {filteredQueue.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => handleSelectEmployee(employee.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedEmpId === employee.id
                    ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-rose-500/5 shadow-[0_0_18px_rgba(251,146,60,0.15)]'
                    : 'border-borderColor bg-darkBg/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                      <User size={18} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-textColor">{employee.name}</p>
                      <p className="text-xs text-textMuted">{employee.dept}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${statusToneMap[employee.status] || statusToneMap.Draft}`}>
                    {employee.status}
                  </span>
                </div>

                <div className={`mt-3 rounded-xl border bg-gradient-to-r p-3 ${badgeToneMap[employee.badge?.tone] || badgeToneMap.rose}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-[0.2em] font-bold">Award Badge</span>
                    <Award size={14} />
                  </div>
                  <p className="font-semibold mt-1">{employee.badge?.label || 'Needs Attention'}</p>
                  <p className="text-xs opacity-80 mt-1">{employee.badge?.detail}</p>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-textMuted mb-2">
                    <span>Goal Completion</span>
                    <span>{employee.progress?.completionRate || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${progressBarTone(employee.progress?.completionRate || 0)}`}
                      style={{ width: `${employee.progress?.completionRate || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="rounded-xl bg-darkBg/70 border border-borderColor px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-textMuted">Done</p>
                    <p className="font-bold text-emerald-300">{employee.progress?.completedGoals || 0}</p>
                  </div>
                  <div className="rounded-xl bg-darkBg/70 border border-borderColor px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-textMuted">On Track</p>
                    <p className="font-bold text-amber-300">{employee.progress?.onTrackGoals || 0}</p>
                  </div>
                  <div className="rounded-xl bg-darkBg/70 border border-borderColor px-2 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-textMuted">Check-ins</p>
                    <p className="font-bold text-sky-300">{employee.progress?.checkInRate || 0}%</p>
                  </div>
                </div>
              </button>
            ))}

            {filteredQueue.length === 0 && (
              <div className="rounded-2xl border border-dashed border-borderColor p-8 text-center text-textMuted text-sm">
                No team members matched this filter.
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      <div className="flex-1 glass-card p-6 overflow-hidden relative">
        {selectedEmployee ? (
          <div className="h-full flex flex-col">
            <header className="border-b border-borderColor pb-6 mb-6">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 flex items-center justify-center shadow-[0_0_28px_rgba(251,146,60,0.18)]">
                    <Users className="text-white" size={28} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-bold text-textColor">{selectedEmployee.name}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${statusToneMap[selectedEmployee.status] || statusToneMap.Draft}`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                    <p className="text-sm text-textMuted mt-2">
                      Signed in as {profile?.name || profile?.email} • reviewing {selectedEmployee.dept} with {selectedEmployee.progress?.totalGoals || 0} active goals.
                    </p>
                    <div className={`inline-flex mt-4 items-center gap-2 rounded-full border px-3 py-1.5 bg-gradient-to-r ${badgeToneMap[selectedEmployee.badge?.tone] || badgeToneMap.rose}`}>
                      <Award size={14} />
                      <span className="text-sm font-semibold">{selectedEmployee.badge?.label}</span>
                    </div>
                  </div>
                </div>

                {selectedEmployee.status === 'Pending Approval' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setReworkModalOpen(true)}
                      disabled={saving}
                      className="btn-secondary text-sm flex items-center gap-2 border-rose-500/30 hover:border-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <XCircle size={16} /> Recommend Changes
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={!canApprove || saving}
                      className={`btn-primary text-sm flex items-center gap-2 ${
                        canApprove && !saving
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                          : 'opacity-50 cursor-not-allowed grayscale'
                      }`}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Approve Goals
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-6">
                <div className="rounded-2xl bg-darkBg/60 border border-borderColor p-4">
                  <div className="flex items-center justify-between text-textMuted mb-3">
                    <span className="text-xs uppercase tracking-wider">Goal Completion</span>
                    <TrendingUp size={16} />
                  </div>
                  <p className="text-3xl font-bold text-textColor">{selectedEmployee.progress?.completionRate || 0}%</p>
                  <p className="text-xs text-textMuted mt-2">
                    {selectedEmployee.progress?.completedGoals || 0} of {selectedEmployee.progress?.totalGoals || 0} goals completed.
                  </p>
                </div>
                <div className="rounded-2xl bg-darkBg/60 border border-borderColor p-4">
                  <div className="flex items-center justify-between text-textMuted mb-3">
                    <span className="text-xs uppercase tracking-wider">Check-in Coverage</span>
                    <ClipboardCheck size={16} />
                  </div>
                  <p className="text-3xl font-bold text-textColor">{selectedEmployee.progress?.checkInRate || 0}%</p>
                  <p className="text-xs text-textMuted mt-2">
                    {selectedEmployee.progress?.loggedCheckIns || 0} logged updates across quarterly checkpoints.
                  </p>
                </div>
                <div className="rounded-2xl bg-darkBg/60 border border-borderColor p-4">
                  <div className="flex items-center justify-between text-textMuted mb-3">
                    <span className="text-xs uppercase tracking-wider">In Motion</span>
                    <Target size={16} />
                  </div>
                  <p className="text-3xl font-bold text-textColor">{selectedEmployee.progress?.onTrackGoals || 0}</p>
                  <p className="text-xs text-textMuted mt-2">Goals currently marked as on track.</p>
                </div>
                <div className="rounded-2xl bg-darkBg/60 border border-borderColor p-4">
                  <div className="flex items-center justify-between text-textMuted mb-3">
                    <span className="text-xs uppercase tracking-wider">Last Manager Note</span>
                    <MessageSquare size={16} />
                  </div>
                  <p className="text-sm font-semibold text-textColor line-clamp-3">
                    {selectedEmployee.reviewNote || selectedEmployee.managerFeedback?.[activeQuarter] || 'No note captured yet.'}
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              {selectedEmployee.status === 'Pending Approval' && (
                <>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className={`rounded-2xl border p-4 ${isWeightageValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                      <p className="text-xs uppercase tracking-wider mb-2">Total Weightage</p>
                      <p className="text-2xl font-bold">{totalWeightage}%</p>
                      <p className="text-xs opacity-80 mt-1">Approval requires exactly 100%.</p>
                    </div>
                    <div className={`rounded-2xl border p-4 ${isMinValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                      <p className="text-xs uppercase tracking-wider mb-2">Allocation Health</p>
                      <p className="text-2xl font-bold">{isMinValid ? 'Balanced' : 'Needs Fix'}</p>
                      <p className="text-xs opacity-80 mt-1">Every goal should carry at least 10% weight.</p>
                    </div>
                    <div className={`rounded-2xl border p-4 ${isMaxValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                      <p className="text-xs uppercase tracking-wider mb-2">Portfolio Size</p>
                      <p className="text-2xl font-bold">{draftGoals.length} / 8</p>
                      <p className="text-xs opacity-80 mt-1">Keep the goal sheet focused and manageable.</p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-borderColor bg-gradient-to-br from-darkBg via-darkBg to-amber-500/5 p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h3 className="font-bold text-xl flex items-center gap-2">
                          <Edit2 size={18} className="text-amber-300" /> Approval Workbench
                        </h3>
                        <p className="text-sm text-textMuted mt-1">
                          Fine-tune targets or weightage before approving the final execution plan.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 max-w-sm">
                        Approve when the portfolio is balanced, specific, and aligned to manager expectations.
                      </div>
                    </div>

                    <div className="space-y-4">
                      {draftGoals.map((goal, index) => (
                        <div key={goal.id} className="rounded-2xl border border-borderColor bg-darkBg/60 p-5 hover:border-amber-400/30 transition-colors">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                            <div className="flex-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300 mb-2">
                                Goal {index + 1}
                              </p>
                              <h4 className="text-lg font-bold text-textColor">{goal.title}</h4>
                              <p className="text-sm text-textMuted mt-2">{goal.description}</p>
                              <div className="flex flex-wrap gap-2 mt-4">
                                <span className="text-xs rounded-full border border-borderColor px-3 py-1 bg-darkBg text-textMuted">
                                  {goal.thrustArea}
                                </span>
                                <span className="text-xs rounded-full border border-borderColor px-3 py-1 bg-darkBg text-textMuted">
                                  UoM: {goal.uom}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <div>
                                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Target</label>
                                <input
                                  type="text"
                                  value={goal.targetValue || ''}
                                  onChange={(event) => handleInlineEdit(goal.id, 'targetValue', event.target.value)}
                                  className="input-field w-28 text-center bg-darkBg text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Weight (%)</label>
                                <input
                                  type="number"
                                  value={goal.weightage}
                                  onChange={(event) => handleInlineEdit(goal.id, 'weightage', event.target.value)}
                                  className={`input-field w-24 text-center bg-darkBg text-sm font-bold ${
                                    Number(goal.weightage) < 10 ? 'text-rose-400 border-rose-500/50' : 'text-amber-300'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedEmployee.status === 'Locked' && (
                <>
                  <div className="flex gap-2 p-1 bg-darkBg rounded-2xl w-fit border border-borderColor">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                      <button
                        key={quarter}
                        onClick={() => {
                          setActiveQuarter(quarter);
                          setFeedbackText(selectedEmployee?.managerFeedback?.[quarter] || '');
                        }}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                          activeQuarter === quarter
                            ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-lg'
                            : 'text-textMuted hover:text-textColor'
                        }`}
                      >
                        {quarter}
                      </button>
                    ))}
                  </div>

                  <div className="grid xl:grid-cols-[1.6fr,1fr] gap-6">
                    <div className="rounded-[1.75rem] border border-borderColor bg-darkBg/60 p-6">
                      <h3 className="font-bold text-xl flex items-center gap-2 mb-5">
                        <Target size={18} className="text-emerald-300" /> Goal Progress Audit
                      </h3>
                      <div className="space-y-5">
                        {selectedEmployee.goals.map((goal, index) => {
                          const actual = goal.actualAchievements?.[activeQuarter] || '';
                          const status = goal.status?.[activeQuarter] || 'Not Started';

                          return (
                            <div key={goal.id} className="rounded-2xl border border-borderColor bg-darkBg/70 p-5">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300 mb-2">
                                    Goal {index + 1} • {goal.weightage}% weight
                                  </p>
                                  <h4 className="text-lg font-semibold text-textColor">{goal.title}</h4>
                                  <p className="text-sm text-textMuted mt-2">{goal.description}</p>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${quarterStatusTone(status)}`}>
                                  {status}
                                </span>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="rounded-2xl border border-borderColor bg-darkBg p-4">
                                  <p className="text-[10px] uppercase tracking-wider text-textMuted mb-1">Planned Target</p>
                                  <p className="text-lg font-bold text-textColor">{goal.targetValue || '-'}</p>
                                </div>
                                <div className={`rounded-2xl border p-4 ${actual ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                                  <p className="text-[10px] uppercase tracking-wider text-textMuted mb-1">Actual Logged</p>
                                  <p className={`text-lg font-bold ${actual ? 'text-emerald-300' : 'text-rose-300'}`}>
                                    {actual || 'Missing update'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-[1.75rem] border border-borderColor bg-gradient-to-br from-darkBg to-emerald-500/5 p-6">
                        <h3 className="font-bold text-xl flex items-center gap-2 mb-3">
                          <ShieldCheck size={18} className="text-emerald-300" /> Manager Notes
                        </h3>
                        <p className="text-sm text-textMuted mb-4">
                          Capture your formal guidance for the current quarter so the employee can see where to double down.
                        </p>
                        <textarea
                          className="input-field w-full h-36 bg-darkBg/70 resize-none text-sm"
                          placeholder="Share progress observations, blockers, and next-step guidance..."
                          value={feedbackText}
                          onChange={(event) => setFeedbackText(event.target.value)}
                        />
                        <button
                          disabled={saving}
                          onClick={handleSaveFeedback}
                          className="btn-primary text-sm w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 flex justify-center items-center gap-2"
                        >
                          {saving ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                          Save {activeQuarter} Review
                        </button>
                      </div>

                      <div className="rounded-[1.75rem] border border-borderColor bg-darkBg/60 p-6">
                        <h3 className="font-bold text-xl flex items-center gap-2 mb-4">
                          <Award size={18} className="text-amber-300" /> Recognition Snapshot
                        </h3>
                        <div className={`rounded-2xl border bg-gradient-to-r p-4 ${badgeToneMap[selectedEmployee.badge?.tone] || badgeToneMap.rose}`}>
                          <p className="text-xs uppercase tracking-[0.3em] font-bold">Suggested Badge</p>
                          <p className="text-xl font-bold mt-2">{selectedEmployee.badge?.label}</p>
                          <p className="text-sm opacity-85 mt-2">{selectedEmployee.badge?.detail}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="rounded-2xl bg-darkBg border border-borderColor p-4">
                            <p className="text-xs uppercase tracking-wider text-textMuted mb-1">Completed</p>
                            <p className="text-2xl font-bold text-emerald-300">{selectedEmployee.progress?.completedGoals || 0}</p>
                          </div>
                          <div className="rounded-2xl bg-darkBg border border-borderColor p-4">
                            <p className="text-xs uppercase tracking-wider text-textMuted mb-1">On Track</p>
                            <p className="text-2xl font-bold text-amber-300">{selectedEmployee.progress?.onTrackGoals || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(selectedEmployee.status === 'Draft' || selectedEmployee.status === 'Returned for Rework') && (
                <div className="grid xl:grid-cols-[1.2fr,0.8fr] gap-6">
                  <div className="rounded-[1.75rem] border border-borderColor bg-darkBg/60 p-6">
                    <h3 className="font-bold text-xl flex items-center gap-2 mb-4">
                      <Clock size={18} className="text-sky-300" /> Team Member Snapshot
                    </h3>
                    <p className="text-sm text-textMuted mb-6">
                      The employee is still shaping the plan. You can still review current priorities, momentum, and the latest recommendation trail.
                    </p>

                    <div className="space-y-4">
                      {selectedEmployee.goals.length > 0 ? selectedEmployee.goals.map((goal, index) => (
                        <div key={goal.id} className="rounded-2xl border border-borderColor bg-darkBg/70 p-5">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-300 mb-2">
                                Goal {index + 1}
                              </p>
                              <h4 className="text-lg font-semibold text-textColor">{goal.title || 'Untitled goal'}</h4>
                              <p className="text-sm text-textMuted mt-2">{goal.description || 'Goal details are still being added.'}</p>
                            </div>
                            <div className="rounded-2xl border border-borderColor bg-darkBg px-4 py-3 text-center min-w-24">
                              <p className="text-[10px] uppercase tracking-wider text-textMuted">Weight</p>
                              <p className="text-2xl font-bold text-textColor">{goal.weightage || 0}%</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-borderColor p-8 text-center text-textMuted">
                          No goals submitted yet for this employee.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[1.75rem] border border-borderColor bg-gradient-to-br from-darkBg to-rose-500/5 p-6">
                      <h3 className="font-bold text-xl flex items-center gap-2 mb-3">
                        <MessageSquare size={18} className="text-rose-300" /> Recommendation Trail
                      </h3>
                      <p className="text-sm text-textMuted">
                        {selectedEmployee.reviewNote || 'No recommendation has been sent yet. When you return a sheet, the employee will see your note in their portal.'}
                      </p>
                    </div>

                    <div className="rounded-[1.75rem] border border-borderColor bg-darkBg/60 p-6">
                      <h3 className="font-bold text-xl flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-amber-300" /> Progress Snapshot
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm text-textMuted mb-2">
                            <span>Completion</span>
                            <span>{selectedEmployee.progress?.completionRate || 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${progressBarTone(selectedEmployee.progress?.completionRate || 0)}`}
                              style={{ width: `${selectedEmployee.progress?.completionRate || 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-textMuted mb-2">
                            <span>Check-ins</span>
                            <span>{selectedEmployee.progress?.checkInRate || 0}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                              style={{ width: `${selectedEmployee.progress?.checkInRate || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!['Pending Approval', 'Locked', 'Draft', 'Returned for Rework'].includes(selectedEmployee.status) && (
                <div className="rounded-2xl border border-borderColor bg-darkBg/60 p-10 text-center">
                  <AlertCircle className="mx-auto mb-4 text-textMuted" size={32} />
                  <p className="text-textMuted">This view will expand when more manager actions are enabled for the current status.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center flex-col text-slate-500">
            <User size={48} className="mb-4 opacity-50" />
            <p>Select a team member to review goals and progress.</p>
          </div>
        )}
      </div>

      {reworkModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-lg bg-darkBg/95 shadow-2xl border-rose-500/30">
            <h3 className="text-2xl font-bold text-rose-400 flex items-center gap-2 mb-2">
              <XCircle size={22} /> Recommend Changes
            </h3>
            <p className="text-sm text-textMuted mb-6">
              Share precise edits you want from {selectedEmployee.name}. This note will appear back in the employee portal.
            </p>
            <textarea
              className="input-field w-full h-36 mb-6 bg-darkBg/60 text-sm"
              placeholder="Example: reduce the weight on the first goal, clarify the target date, and add one customer-outcome KPI."
              value={reworkReason}
              onChange={(event) => setReworkReason(event.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setReworkModalOpen(false)} disabled={saving} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={handleRework}
                disabled={saving}
                className="btn-primary flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-sm border-none"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Send Recommendation
              </button>
            </div>
          </div>
        </div>
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

export default ManagerDashboard;

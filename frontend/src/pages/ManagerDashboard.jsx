import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FolderKanban,
  Loader2,
  LogOut,
  Moon,
  Palette,
  Save,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  UserRound,
  Users
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/api';
import ProfileWorkbench from '../components/ProfileWorkbench';

const WORKSPACE_TABS = [
  { id: 'radar', label: 'Team Radar (Overview)', icon: Target },
  { id: 'roster', label: 'Roster & Workloads', icon: Users },
  { id: 'evaluation', label: 'Goal Evaluation Workspace', icon: ClipboardCheck }
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const STATUS_TONE = {
  Locked: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  'Pending Approval': 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  Draft: 'border-slate-600 bg-slate-800 text-slate-300',
  'Returned for Rework': 'border-rose-400/40 bg-rose-500/10 text-rose-300'
};

const PORTAL_WINDOWS = { phase1: true, q1: true, q2: false, q3: false, q4: false };

const PROJECT_ALLOCATIONS = {
  'Aarav Mehta': ['Sales Matrix', 'SnapLink'],
  'Nisha Rao': ['Sales Matrix', 'Smart Receipts']
};

const PROJECT_LABELS = ['Sales Matrix', 'Smart Receipts', 'SnapLink'];

const scoreGoal = (goal, quarter) => {
  const actual = goal.actualAchievements?.[quarter] ?? '';
  const target = goal.targetValue ?? '';

  if (actual === '' || actual === null || actual === undefined || Number(actual) === 0) {
    return { score: 0, label: 'NOT_STARTED', displayActual: actual || 'Pending update' };
  }

  if (goal.uom === 'Timeline') {
    const score = actual <= target ? 100 : 50;
    return {
      score,
      label: score >= 70 ? 'ON_TRACK' : 'NEEDS_SUPPORT',
      displayActual: actual
    };
  }

  const numericActual = Number(actual);
  const numericTarget = Number(target);
  if (!Number.isFinite(numericActual) || !Number.isFinite(numericTarget) || numericTarget === 0) {
    return { score: 0, label: 'NOT_STARTED', displayActual: actual };
  }

  const score = Math.round((numericActual / numericTarget) * 100);
  if (score >= 70) return { score, label: 'ON_TRACK', displayActual: actual };
  if (score > 0) return { score, label: 'NEEDS_SUPPORT', displayActual: actual };
  return { score: 0, label: 'NOT_STARTED', displayActual: actual };
};

const scoreTone = (label) => {
  if (label === 'ON_TRACK') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300';
  if (label === 'NEEDS_SUPPORT') return 'border-amber-400/30 bg-amber-500/10 text-amber-300';
  return 'border-slate-600 bg-slate-800 text-slate-300';
};

const progressTone = (value) => {
  if (value >= 80) return 'from-emerald-400 to-teal-300';
  if (value >= 50) return 'from-amber-400 to-orange-300';
  return 'from-rose-400 to-pink-400';
};

const getProjectMembership = (employee) => {
  return PROJECT_ALLOCATIONS[employee.name] || ['Sales Matrix'];
};

const getProjectRoster = (queue) => {
  return PROJECT_LABELS.map((project) => ({
    key: project,
    label: project,
    members: queue.filter((employee) => getProjectMembership(employee).includes(project))
  })).filter((project) => project.members.length > 0);
};

const TeamMetricCard = ({ label, value, detail }) => (
  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(8,15,30,0.28)]">
    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
    <p className="mt-4 text-4xl font-bold text-white">{value}</p>
    <p className="mt-2 text-sm text-slate-400">{detail}</p>
  </div>
);

const ManagerDashboard = ({ portalUser }) => {
  const navigate = useNavigate();
  const clerk = useClerk();
  const [profile, setProfile] = useState(portalUser);
  const [contextTab, setContextTab] = useState('workspace');
  const [activeTab, setActiveTab] = useState('radar');
  const [selectedProject, setSelectedProject] = useState('Sales Matrix');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [activeQuarter, setActiveQuarter] = useState(PORTAL_WINDOWS.q4 ? 'Q4' : PORTAL_WINDOWS.q3 ? 'Q3' : PORTAL_WINDOWS.q2 ? 'Q2' : 'Q1');
  const [queue, setQueue] = useState([]);
  const [draftGoals, setDraftGoals] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [search, setSearch] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setProfile(portalUser);
  }, [portalUser]);

  const showToast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2400);
  };

  const syncSelectedEmployee = (employeeId, sourceQueue, quarter) => {
    const employee = sourceQueue.find((entry) => entry.id === employeeId) || null;
    setSelectedEmployeeId(employeeId || null);
    setDraftGoals(employee ? JSON.parse(JSON.stringify(employee.goals || [])) : []);
    setFeedbackText(employee?.managerFeedback?.[quarter] || '');
  };

  const fetchQueue = async (preferredId, preferredQuarter = activeQuarter) => {
    if (!profile?.id) return;

    try {
      const response = await fetch(`${API_URL}/portal/queue?managerId=${profile.id}`);
      if (!response.ok) throw new Error('Unable to load queue');

      const data = await response.json();
      setQueue(data);

      const projectRoster = getProjectRoster(data);
      const projectExists = projectRoster.some((project) => project.key === selectedProject);
      const nextProject = projectExists ? selectedProject : projectRoster[0]?.key || 'Sales Matrix';
      if (nextProject !== selectedProject) {
        setSelectedProject(nextProject);
      }

      const filteredMembers = data.filter((employee) => getProjectMembership(employee).includes(nextProject));
      const nextId =
        (preferredId && filteredMembers.some((entry) => entry.id === preferredId) && preferredId) ||
        (selectedEmployeeId && filteredMembers.some((entry) => entry.id === selectedEmployeeId) && selectedEmployeeId) ||
        filteredMembers[0]?.id ||
        null;

      syncSelectedEmployee(nextId, data, preferredQuarter);
    } catch (error) {
      console.error(error);
      showToast('Unable to load manager workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const projects = useMemo(() => getProjectRoster(queue), [queue]);

  const filteredProjectMembers = useMemo(() => {
    return queue
      .filter((employee) => getProjectMembership(employee).includes(selectedProject))
      .filter((employee) => {
        const haystack = `${employee.name} ${employee.dept} ${getProjectMembership(employee).join(' ')}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      });
  }, [queue, search, selectedProject]);

  useEffect(() => {
    if (!filteredProjectMembers.length) {
      setSelectedEmployeeId(null);
      setDraftGoals([]);
      setFeedbackText('');
      return;
    }

    if (!filteredProjectMembers.some((employee) => employee.id === selectedEmployeeId)) {
      syncSelectedEmployee(filteredProjectMembers[0].id, queue, activeQuarter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, filteredProjectMembers.length]);

  const selectedEmployee = useMemo(
    () => queue.find((employee) => employee.id === selectedEmployeeId) || null,
    [queue, selectedEmployeeId]
  );

  const radarMetrics = useMemo(() => {
    const directReports = filteredProjectMembers.length;
    const pendingApprovals = filteredProjectMembers.filter((employee) => employee.status === 'Pending Approval').length;
    const executionLive = filteredProjectMembers.filter((employee) => employee.status === 'Locked').length;
    const averageCompletion = directReports
      ? Math.round(filteredProjectMembers.reduce((sum, employee) => sum + (employee.progress?.completionRate || 0), 0) / directReports)
      : 0;

    return {
      directReports,
      pendingApprovals,
      executionLive,
      averageCompletion
    };
  }, [filteredProjectMembers]);

  const bottleneck = useMemo(() => {
    return filteredProjectMembers.find((employee) => employee.status !== 'Locked') || filteredProjectMembers[0] || null;
  }, [filteredProjectMembers]);

  const velocityProjection = useMemo(() => {
    if (!filteredProjectMembers.length) return { value: 0, label: 'Late risk' };

    const quarterScores = filteredProjectMembers.flatMap((employee) =>
      (employee.goals || []).map((goal) => scoreGoal(goal, activeQuarter).score)
    );
    const average = quarterScores.length
      ? Math.round(quarterScores.reduce((sum, score) => sum + score, 0) / quarterScores.length)
      : 0;

    if (average >= 85) return { value: average, label: 'Early finish trajectory' };
    if (average >= 60) return { value: average, label: 'On-time trajectory' };
    return { value: average, label: 'Late risk' };
  }, [activeQuarter, filteredProjectMembers]);

  const analytics = useMemo(() => {
    const teamGoals = filteredProjectMembers.flatMap((employee) => employee.goals || []);
    const goalTypes = {
      'Numeric Min': teamGoals.filter((goal) => goal.uom === 'Numeric').length,
      'Percent Min': teamGoals.filter((goal) => goal.uom === '%').length,
      'Numeric Max': Math.max(teamGoals.filter((goal) => goal.uom === 'Numeric').length - 1, 0),
      Timeline: teamGoals.filter((goal) => goal.uom === 'Timeline').length
    };

    return {
      goalTypes,
      quarterTrend: [
        { label: 'Q1', value: 85 },
        { label: 'Q2', value: 0 },
        { label: 'Q3', value: 0 },
        { label: 'Q4', value: 0 }
      ]
    };
  }, [filteredProjectMembers]);

  const handleProjectChange = (projectKey) => {
    setSelectedProject(projectKey);
    const matchingMembers = queue.filter((employee) => getProjectMembership(employee).includes(projectKey));
    const nextEmployee = matchingMembers.find((employee) => employee.id === selectedEmployeeId) || matchingMembers[0] || null;
    syncSelectedEmployee(nextEmployee?.id || null, queue, activeQuarter);
  };

  const handleSelectEmployee = (employeeId) => {
    syncSelectedEmployee(employeeId, queue, activeQuarter);
    setActiveTab('evaluation');
  };

  const handleQuarterChange = (quarter) => {
    setActiveQuarter(quarter);
    setFeedbackText(selectedEmployee?.managerFeedback?.[quarter] || '');
  };

  const handleGoalEdit = (goalId, field, value) => {
    setDraftGoals((current) =>
      current.map((goal) => (goal.id === goalId ? { ...goal, [field]: value } : goal))
    );
  };

  const handleExportTeamCsv = () => {
    const rows = filteredProjectMembers.flatMap((employee) =>
      (employee.goals || []).map((goal) => {
        const result = scoreGoal(goal, activeQuarter);
        return [
          employee.name,
          selectedProject,
          goal.title || 'Untitled goal',
          activeQuarter,
          goal.targetValue || '',
          result.displayActual || '',
          `${result.score}%`,
          result.label
        ];
      })
    );

    const csv = [
      ['Employee', 'Project', 'Goal', 'Quarter', 'Planned', 'Actual', 'Score', 'Status'].join(','),
      ...rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedProject.toLowerCase().replace(/\s+/g, '-')}-team-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    showToast('Team CSV exported.');
  };

  const handleAutoNudge = () => {
    if (!bottleneck) return;
    showToast(`Auto-nudge queued for ${bottleneck.name} on Slack channel.`);
  };

  const handleApproveLock = async () => {
    if (!selectedEmployee?.sheetId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/portal/sheet/${selectedEmployee.sheetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Locked',
          goals: draftGoals
        })
      });

      if (!response.ok) throw new Error('Unable to approve goals');
      await fetchQueue(selectedEmployee.id, activeQuarter);
      showToast('Goals approved and locked.');
    } catch (error) {
      console.error(error);
      showToast('Approval failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToDraft = async () => {
    if (!selectedEmployee?.sheetId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/portal/sheet/${selectedEmployee.sheetId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Returned for Rework',
          reworkReason: reworkReason.trim() || 'Please recalibrate the planned target and add supporting context.'
        })
      });

      if (!response.ok) throw new Error('Unable to return goals');
      await fetchQueue(selectedEmployee.id, activeQuarter);
      showToast('Goals returned to draft with notes.');
    } catch (error) {
      console.error(error);
      showToast('Return-to-draft failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedEmployee?.sheetId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/portal/sheet/${selectedEmployee.sheetId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter: activeQuarter, text: feedbackText })
      });

      if (!response.ok) throw new Error('Unable to save notes');
      setQueue((current) =>
        current.map((employee) =>
          employee.id === selectedEmployee.id
            ? {
                ...employee,
                managerFeedback: {
                  ...employee.managerFeedback,
                  [activeQuarter]: feedbackText
                }
              }
            : employee
        )
      );
      showToast(`${activeQuarter} notes synced.`);
    } catch (error) {
      console.error(error);
      showToast('Manager notes could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkspaceLogout = async () => {
    try {
      await clerk.signOut();
    } finally {
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#081018] text-white">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-8 py-6 text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-pink-400" size={30} />
          <p className="text-lg font-semibold">Loading manager workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081018] text-white">
      {toastMessage ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-[320px] flex-col border-r border-white/10 bg-[#0F292F] px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 shadow-[0_0_22px_rgba(236,72,153,0.35)]">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AtomAlign</h1>
              <p className="text-sm text-slate-300">Manager workspace</p>
            </div>
          </div>

          <div className="mt-8 flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {[
              { id: 'workspace', label: 'Manager Portal' },
              { id: 'profile', label: 'Personal Details' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setContextTab(item.id)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  contextTab === item.id ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white' : 'text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {contextTab === 'workspace' ? (
            <>
              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Project Context</p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected Team</label>
                  <select
                    value={selectedProject}
                    onChange={(event) => handleProjectChange(event.target.value)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#0B2025] px-4 py-3 text-sm text-white outline-none"
                  >
                    {projects.map((project) => (
                      <option key={project.key} value={project.key}>
                        PROJECT: {project.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <nav className="mt-8 space-y-2">
                {WORKSPACE_TABS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500/20 to-violet-500/20 text-white shadow-[0_0_20px_rgba(217,70,239,0.14)]'
                          : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <Icon size={18} />
                        {item.label}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  );
                })}
              </nav>
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              Update your manager profile details, reporting preferences, and identity settings here.
            </div>
          )}

          <div className="mt-auto space-y-4 pt-6">
            <button
              onClick={() => setTheme((current) => (current === 'dark' ? 'purple' : current === 'purple' ? 'light' : 'dark'))}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300"
            >
              <span className="flex items-center gap-2">
                {theme === 'dark' ? <Moon size={16} /> : theme === 'purple' ? <Palette size={16} /> : <Sun size={16} />}
                Dark Mode
              </span>
            </button>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20">
                  <UserRound size={18} className="text-pink-200" />
                </div>
                <div>
                  <p className="font-semibold text-white">Priya Sharma</p>
                  <p className="text-xs text-slate-400">Clerk authenticated</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleWorkspaceLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-[#081018] px-8 py-8">
          {contextTab === 'profile' ? (
            <ProfileWorkbench profile={profile} onProfileUpdate={setProfile} />
          ) : (
            <div className="mx-auto max-w-7xl space-y-8">
              <header className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-7 shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Manager Workspace</p>
                    <h2 className="mt-3 text-4xl font-bold text-white">Drive team alignment, approve targets, and clear execution bottlenecks.</h2>
                    <p className="mt-3 text-sm text-slate-400">MANAGER - Sales Team Lead</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportTeamCsv}
                      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200"
                    >
                      <Download size={16} />
                      Export Team CSV
                    </button>
                    <button
                      onClick={handleAutoNudge}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
                    >
                      <BellRing size={16} />
                      Auto-Nudge
                    </button>
                  </div>
                </div>
              </header>

              {activeTab === 'radar' && (
                <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                  <section className="rounded-[28px] border border-white/10 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Team Performance Radar</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">{selectedProject}</h3>
                      </div>
                      <FolderKanban className="text-violet-300" size={22} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TeamMetricCard label="Team Members" value={radarMetrics.directReports} detail="Current project headcount" />
                      <TeamMetricCard label="Needs Review" value={radarMetrics.pendingApprovals} detail="Pending approval sheets" />
                      <TeamMetricCard label="Execution Live" value={radarMetrics.executionLive} detail="Locked execution plans" />
                      <TeamMetricCard label="Avg Completion" value={`${radarMetrics.averageCompletion}%`} detail="Current team completion velocity" />
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-rose-400/20 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-rose-300">Team Alerts & Momentum</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">Momentum Builder</h3>
                        <p className="mt-3 text-sm text-slate-400">Highest-risk item across the active project context.</p>
                      </div>
                      <AlertTriangle className="text-rose-300" size={22} />
                    </div>

                    {bottleneck ? (
                      <div className="mt-6 rounded-[24px] border border-rose-400/30 bg-rose-500/10 p-5">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-300 animate-pulse" />
                          System Alert
                        </div>
                        <p className="mt-4 text-xl font-bold text-white">{bottleneck.name}</p>
                        <p className="mt-2 text-sm text-rose-100/90">
                          Goals not submitted within 7 days of cycle open. Click to Auto-Nudge Manager/Employee Slack channel.
                        </p>
                        <button
                          onClick={handleAutoNudge}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          <BellRing size={15} />
                          Auto-Nudge Slack Channel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
                        No active bottlenecks detected for this team.
                      </div>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Quarterly Achievement Trends</p>
                        <div className="mt-4 space-y-3">
                          {analytics.quarterTrend.map((entry) => (
                            <div key={entry.label}>
                              <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                                <span>{entry.label}</span>
                                <span>{entry.value}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-800">
                                <div className={`h-full rounded-full bg-gradient-to-r ${progressTone(entry.value)}`} style={{ width: `${entry.value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Predictive Velocity Projection</p>
                        <p className="mt-4 text-3xl font-bold text-white">{velocityProjection.value}%</p>
                        <p className="mt-2 text-sm text-slate-400">{velocityProjection.label}</p>
                        <div className="mt-5 h-3 rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${progressTone(velocityProjection.value)}`}
                            style={{ width: `${velocityProjection.value}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'roster' && (
                <section className="rounded-[28px] border border-white/10 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Roster & Workloads</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">Project team matrix</h3>
                      <p className="mt-2 text-sm text-slate-400">Select a direct report to jump into the evaluation workspace for this project.</p>
                    </div>
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by team member or project..."
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjectMembers.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => handleSelectEmployee(employee.id)}
                        className={`rounded-[24px] border p-5 text-left transition ${
                          employee.id === selectedEmployeeId
                            ? 'border-pink-400/40 bg-gradient-to-br from-pink-500/10 to-violet-500/10 shadow-[0_0_24px_rgba(217,70,239,0.14)]'
                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold text-white">{employee.name}</p>
                            <p className="mt-1 text-sm text-slate-400">{employee.dept}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${STATUS_TONE[employee.status] || STATUS_TONE.Draft}`}>
                            {employee.status}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/10 bg-[#0B1119] p-3">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Current Goal Count</p>
                            <p className="mt-2 text-2xl font-bold text-white">{employee.goals?.length || 0}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-[#0B1119] p-3">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Lock Status</p>
                            <p className="mt-2 text-sm font-semibold text-white">{employee.status}</p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Active Project Chips</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getProjectMembership(employee).map((project) => (
                              <span key={project} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                                [{project}]
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === 'evaluation' && (
                <section className="space-y-6">
                  {selectedEmployee ? (
                    <>
                      <div className="rounded-[28px] border border-white/10 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-pink-500 via-violet-500 to-amber-400 shadow-[0_0_22px_rgba(236,72,153,0.25)]">
                                <BriefcaseBusiness size={26} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Selected Employee</p>
                                <h3 className="mt-1 text-3xl font-bold text-white">{selectedEmployee.name}</h3>
                                <p className="mt-2 text-sm text-slate-400">
                                  Signed in as {profile?.name || profile?.email} • reviewing {selectedEmployee.dept} with {selectedEmployee.goals?.length || 0} active goals.
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] ${STATUS_TONE[selectedEmployee.status] || STATUS_TONE.Draft}`}>
                                {selectedEmployee.status}
                              </span>
                              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                Momentum Builder
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {selectedEmployee.status === 'Pending Approval' && (
                              <>
                                <button
                                  onClick={handleReturnToDraft}
                                  disabled={saving}
                                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
                                >
                                  {saving ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                                  Return to Draft
                                </button>
                                <button
                                  onClick={handleApproveLock}
                                  disabled={saving}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3 text-sm font-semibold text-white"
                                >
                                  <CheckCircle2 size={16} />
                                  Approve & Lock Goal
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {QUARTERS.map((quarter) => (
                          <button
                            key={quarter}
                            onClick={() => handleQuarterChange(quarter)}
                            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                              activeQuarter === quarter
                                ? 'bg-amber-400 text-[#0B1320]'
                                : 'border border-white/10 bg-white/[0.04] text-slate-300'
                            }`}
                          >
                            {quarter}
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-4 xl:grid-cols-4">
                        <TeamMetricCard
                          label="Goal Completion"
                          value={`${selectedEmployee.progress?.completionRate || 0}%`}
                          detail={`${selectedEmployee.progress?.completedGoals || 0} of ${selectedEmployee.progress?.totalGoals || 0} goals completed.`}
                        />
                        <TeamMetricCard
                          label="Check-in Coverage"
                          value={`${selectedEmployee.progress?.checkInRate || 0}%`}
                          detail={`${selectedEmployee.progress?.loggedCheckIns || 0} logged updates across quarterly checkpoints.`}
                        />
                        <TeamMetricCard
                          label="In Motion"
                          value={selectedEmployee.progress?.onTrackGoals || 0}
                          detail="Goals currently marked as on track."
                        />
                        <TeamMetricCard
                          label="Last Manager Note"
                          value={selectedEmployee.managerFeedback?.[activeQuarter] ? 'Live' : 'None'}
                          detail={selectedEmployee.managerFeedback?.[activeQuarter] || 'Tracking well.'}
                        />
                      </div>

                      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                        <div className="space-y-5 rounded-[28px] border border-white/10 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Goal Progress Audit</p>
                              <h4 className="mt-2 text-2xl font-bold text-white">Interactive evaluation cockpit</h4>
                            </div>
                            <TrendingUp className="text-pink-300" size={20} />
                          </div>

                          {draftGoals.map((goal, index) => {
                            const result = scoreGoal(goal, activeQuarter);
                            return (
                              <div key={goal.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-300">
                                        Goal {index + 1} - {goal.weightage}% Weight
                                      </p>
                                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${scoreTone(result.label)}`}>
                                        {result.label}
                                      </span>
                                    </div>
                                    <h5 className="mt-3 text-xl font-bold text-white">{goal.title || 'Untitled goal'}</h5>
                                    <p className="mt-2 text-sm text-slate-400">{goal.description || 'No goal description supplied.'}</p>
                                  </div>

                                  {selectedEmployee.status === 'Pending Approval' && (
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Manager Calibration</label>
                                        <input
                                          value={goal.targetValue || ''}
                                          onChange={(event) => handleGoalEdit(goal.id, 'targetValue', event.target.value)}
                                          className="w-28 rounded-xl border border-white/10 bg-[#091018] px-3 py-2 text-sm text-white outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Weight (%)</label>
                                        <input
                                          value={goal.weightage || ''}
                                          onChange={(event) => handleGoalEdit(goal.id, 'weightage', event.target.value)}
                                          className="w-24 rounded-xl border border-white/10 bg-[#091018] px-3 py-2 text-sm text-white outline-none"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                  <div className="rounded-2xl border border-white/10 bg-[#091018] p-4">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Planned Target</p>
                                    <p className="mt-3 text-2xl font-bold text-white">{goal.targetValue || '-'}</p>
                                  </div>
                                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-200/70">Actual Logged</p>
                                    <p className="mt-3 text-2xl font-bold text-emerald-300">{result.displayActual || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-6">
                          <div className="rounded-[28px] border border-white/10 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Manager Notes & Feedback Engine</p>
                            <h4 className="mt-2 text-2xl font-bold text-white">Real-time guidance</h4>
                            <textarea
                              value={feedbackText}
                              onChange={(event) => setFeedbackText(event.target.value)}
                              className="mt-5 h-40 w-full rounded-[22px] border border-white/10 bg-[#091018] px-4 py-4 text-sm text-white outline-none"
                              placeholder="Capture formal guidance for the quarter and sync it instantly to the employee view."
                            />
                            <textarea
                              value={reworkReason}
                              onChange={(event) => setReworkReason(event.target.value)}
                              className="mt-4 h-24 w-full rounded-[22px] border border-white/10 bg-[#091018] px-4 py-4 text-sm text-white outline-none"
                              placeholder="Optional return-to-draft note for approval calibration."
                            />
                            <button
                              onClick={handleSaveFeedback}
                              disabled={saving}
                              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white"
                            >
                              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                              Save Notes
                            </button>
                          </div>

                          <div className="rounded-[28px] border border-white/10 bg-[#0F1722] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.32)]">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Team Performance & Distribution</p>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-sm font-semibold text-white">Goal Type Distribution</p>
                                <div className="mt-4 space-y-3">
                                  {Object.entries(analytics.goalTypes).map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between text-sm text-slate-300">
                                      <span>{label}</span>
                                      <span className="font-semibold text-white">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-sm font-semibold text-white">Quarterly Achievement Trends</p>
                                <div className="mt-4 space-y-3">
                                  {analytics.quarterTrend.map((entry) => (
                                    <div key={entry.label}>
                                      <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                                        <span>{entry.label}</span>
                                        <span>{entry.value}%</span>
                                      </div>
                                      <div className="h-2 rounded-full bg-slate-800">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${progressTone(entry.value)}`} style={{ width: `${entry.value}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[28px] border border-white/10 bg-[#0F1722] p-8 text-center text-slate-400">
                      Select a team member from the roster to open the Goal Evaluation Workspace.
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ManagerDashboard;

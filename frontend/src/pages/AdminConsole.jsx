import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  ChevronRight,
  Download,
  FileSearch,
  LayoutDashboard,
  LogOut,
  RefreshCcw,
  Shield,
  Users
} from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'cycles', label: 'Cycles', icon: RefreshCcw },
  { id: 'reports', label: 'Reports', icon: FileSearch },
  { id: 'audit', label: 'Audit Logs', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
];

const pageCopy = {
  dashboard: {
    title: 'Admin Dashboard',
    subtitle: 'Monitor completion, govern exceptions, and export performance data.'
  },
  users: {
    title: 'User Management',
    subtitle: 'Manage demo users and reporting hierarchy.'
  },
  cycles: {
    title: 'Cycle Management',
    subtitle: 'Open or close quarterly windows for achievement capture.'
  },
  reports: {
    title: 'Reports',
    subtitle: 'Export planned target vs actual achievement for all employees.'
  },
  audit: {
    title: 'Audit Logs',
    subtitle: 'All governance-significant changes are recorded with actor, field, old value, and new value.'
  },
  analytics: {
    title: 'Analytics',
    subtitle: 'QoQ trends, completion rates, goal distribution, and manager effectiveness.'
  }
};

const shellStyles = {
  page: { background: '#F4F6F8', color: '#0F172A', fontFamily: 'Inter, Segoe UI, sans-serif' },
  sidebar: { background: '#0F292F', color: '#F8FAFC' },
  card: { background: '#FFFFFF', borderRadius: '22px', boxShadow: '0 20px 50px rgba(15, 41, 47, 0.08)' }
};

const buttonClasses = {
  primary: 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95',
  secondary: 'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition'
};

const badgeTone = {
  OPEN: 'bg-amber-100 text-amber-800',
  DRAFT: 'bg-sky-100 text-sky-700',
  ON_TRACK: 'bg-emerald-100 text-emerald-700',
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  AHEAD: 'bg-cyan-100 text-cyan-700'
};

const MetricCard = ({ metric }) => (
  <div className="rounded-[22px] border border-slate-200 p-5" style={shellStyles.card}>
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
    <div className="mt-4 flex items-end justify-between gap-4">
      <div>
        <h3 className="text-4xl font-bold text-slate-900">{metric.value}</h3>
        <p className="mt-2 text-sm font-medium text-slate-500">{metric.title}</p>
      </div>
      <div className="h-12 w-12 rounded-2xl bg-slate-100" />
    </div>
  </div>
);

const ProgressRow = ({ label, value }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm font-medium text-slate-600">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#245C63]" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const StatusBadge = ({ children, tone }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeTone[tone] || 'bg-slate-100 text-slate-700'}`}>
    {children}
  </span>
);

const SectionCard = ({ title, subtitle, children }) => (
  <section className="rounded-[24px] border border-slate-200 p-6" style={shellStyles.card}>
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

const Table = ({ columns, rows, renderRow, emptyMessage }) => (
  <div className="overflow-hidden rounded-[20px] border border-slate-200">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.length > 0 ? (
            rows.map(renderRow)
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const AdminConsole = () => {
  const navigate = useNavigate();
  const {
    snapshot,
    loading,
    error,
    resetDemo,
    addUser,
    toggleCycle,
    unlockEmployee,
    downloadCsv
  } = useAdminContext();

  const [activeView, setActiveView] = useState('dashboard');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    managerId: '',
    department: ''
  });

  const [localCycles, setLocalCycles] = useState([
    { id: 'q1', cycle: 'Q1', type: 'Quarterly', window: 'Jan - Mar', status: 'OPEN', actionLabel: 'Close' },
    { id: 'q2', cycle: 'Q2', type: 'Quarterly', window: 'Apr - Jun', status: 'CLOSED', actionLabel: 'Open' },
    { id: 'q3', cycle: 'Q3', type: 'Quarterly', window: 'Jul - Sep', status: 'CLOSED', actionLabel: 'Open' },
    { id: 'q4', cycle: 'Q4', type: 'Quarterly', window: 'Oct - Dec', status: 'CLOSED', actionLabel: 'Open' },
  ]);

  const handleToggleCycle = (id) => {
    setLocalCycles((prev) => 
      prev.map((c) => 
        c.id === id 
          ? { 
              ...c, 
              status: c.status === 'OPEN' ? 'CLOSED' : 'OPEN',
              actionLabel: c.status === 'OPEN' ? 'Open' : 'Close'
            } 
          : c
      )
    );
  };

  const copy = pageCopy[activeView];
  const managers = snapshot.users.filter((user) => user.role === 'MANAGER');

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (isAddingUser) return;

    setIsAddingUser(true);
    try {
      await addUser({
        ...userForm,
        role: userForm.role,
        managerId: userForm.managerId || null,
        department: userForm.department || 'General'
      });
      setUserForm({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        managerId: '',
        department: ''
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.dashboard.metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Completion Dashboard" subtitle="Employee and manager workflow completion.">
          <div className="space-y-5">
            {snapshot.dashboard.completionRows.map((row) => (
              <ProgressRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Escalations" subtitle="Rule-based overdue workflow alerts.">
          <div className="space-y-4">
            {snapshot.dashboard.escalations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-base font-bold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-rose-700">{item.meta}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <SectionCard title="Add User" subtitle="Create a user and place them into the reporting structure immediately.">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleCreateUser}>
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#245C63]"
            placeholder="Full name"
            value={userForm.name}
            onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#245C63]"
            placeholder="Email"
            type="email"
            value={userForm.email}
            onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
          />
          <select
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#245C63]"
            value={userForm.role}
            onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}
          >
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#245C63]"
            value={userForm.managerId}
            onChange={(event) => setUserForm((current) => ({ ...current, managerId: event.target.value }))}
          >
            <option value="">Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#245C63]"
              placeholder="Department"
              value={userForm.department}
              onChange={(event) => setUserForm((current) => ({ ...current, department: event.target.value }))}
            />
            <button
              type="submit"
              disabled={isAddingUser}
              className={`${buttonClasses.primary} bg-[#245C63] disabled:opacity-60`}
            >
              Add User
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Directory" subtitle="Current employee, manager, and admin access roster.">
        <Table
          columns={['Name', 'Email', 'Role', 'Manager', 'Department']}
          rows={snapshot.users}
          emptyMessage="No users available."
          renderRow={(user) => (
            <tr key={user.id}>
              <td className="px-5 py-4 text-sm font-semibold text-slate-900">{user.name}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{user.role}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{user.manager}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{user.department}</td>
            </tr>
          )}
        />
      </SectionCard>
    </div>
  );

  const renderCycles = () => (
    <SectionCard title="Cycle Calendar" subtitle="Quarterly windows can be opened or closed with immediate admin impact.">
      <Table
        columns={['Cycle', 'Type', 'Window', 'Status', 'Action']}
        rows={localCycles}
        emptyMessage="No cycles configured."
        renderRow={(cycle) => (
          <tr key={cycle.id}>
            <td className="px-5 py-4 text-sm font-semibold text-slate-900">{cycle.cycle}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{cycle.type}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{cycle.window}</td>
            <td className="px-5 py-4 text-sm">
              <StatusBadge tone={cycle.status}>{cycle.status}</StatusBadge>
            </td>
            <td className="px-5 py-4 text-sm">
              <button
                onClick={() => handleToggleCycle(cycle.id)}
                className={`${buttonClasses.secondary} border-slate-200 text-slate-700 hover:border-[#245C63] hover:text-[#245C63]`}
              >
                {cycle.actionLabel}
              </button>
            </td>
          </tr>
        )}
      />
    </SectionCard>
  );

  const renderReports = () => (
    <SectionCard title="Achievement Ledger" subtitle="Planned targets, actual achievement, scoring, and governance actions.">
      <Table
        columns={['Employee', 'Department', 'Goal', 'Quarter', 'Planned', 'Actual', 'Score', 'Status', 'Admin']}
        rows={snapshot.reports}
        emptyMessage="No report rows available."
        renderRow={(report) => (
          <tr key={report.id}>
            <td className="px-5 py-4 text-sm font-semibold text-slate-900">{report.employee}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{report.department}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{report.goal}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{report.quarter}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{report.planned || '\u2014'}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{report.actual || '\u2014'}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{report.scoreLabel}</td>
            <td className="px-5 py-4 text-sm">
              <StatusBadge tone={report.status}>{report.status}</StatusBadge>
            </td>
            <td className="px-5 py-4 text-sm">
              <button
                onClick={() => unlockEmployee(report.employeeId)}
                disabled={report.adminAction !== 'Unlock'}
                className={`${buttonClasses.secondary} border-slate-200 text-slate-700 hover:border-[#245C63] hover:text-[#245C63] disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {report.adminAction}
              </button>
            </td>
          </tr>
        )}
      />
    </SectionCard>
  );

  const renderAudit = () => (
    <div className="space-y-4">
      {snapshot.auditLogs.map((log) => (
        <SectionCard key={log.id} title={log.heading}>
          <p className="text-sm text-slate-600">{log.body}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Actor</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{log.actor}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Field</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{log.field}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Old Value</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{log.oldValue}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">New Value</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{log.newValue}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">{log.timestampLabel}</p>
        </SectionCard>
      ))}
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionCard title="Completion Dashboard">
        <div className="space-y-5">
          {snapshot.analytics.progressRows.map((row) => (
            <ProgressRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Goal Distribution">
        <div className="space-y-4">
          {snapshot.analytics.goalDistribution.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">{entry.label}</span>
              <span className="text-lg font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="QoQ Trend">
        <div className="space-y-5">
          {snapshot.analytics.qoqTrend.map((row) => (
            <ProgressRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Manager Effectiveness">
        <div className="space-y-5">
          {snapshot.analytics.managerEffectiveness.map((manager) => (
            <ProgressRow key={manager.name} label={manager.name} value={manager.value} />
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderView = () => {
    if (activeView === 'dashboard') return renderDashboard();
    if (activeView === 'users') return renderUsers();
    if (activeView === 'cycles') return renderCycles();
    if (activeView === 'reports') return renderReports();
    if (activeView === 'audit') return renderAudit();
    return renderAnalytics();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={shellStyles.page}>
        <div className="rounded-[24px] bg-white px-8 py-6 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">AtomQuest</p>
          <p className="mt-3 text-lg font-bold text-slate-900">Loading HR Admin workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={shellStyles.page}>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-[300px] flex-col px-6 py-8" style={shellStyles.sidebar}>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white">
                AQ
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AtomQuest</h1>
                <p className="text-sm text-slate-300">Goal tracking portal</p>
              </div>
            </div>

            <div className="mt-8 rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-lg font-bold text-white">{snapshot.roleScope.title}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                {snapshot.roleScope.subtitle}
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                    active ? 'bg-white text-[#0F292F]' : 'text-slate-200 hover:bg-white/10 hover:text-white'
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

          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Session</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl border border-white/10 bg-transparent px-3 py-3 text-left text-slate-200">
                <p className="text-sm font-bold">{snapshot.roleScope.title}</p>
                <p className="mt-1 text-xs">{snapshot.roleScope.subtitle}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                <LogOut size={16} />
                Logout / Exit
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-6 md:p-8 xl:p-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">{snapshot.currentDate}</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{copy.title}</h1>
                <p className="mt-2 text-sm text-slate-500">{copy.subtitle}</p>
                {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {(activeView === 'dashboard' || activeView === 'reports') && (
                  <button className={`${buttonClasses.primary} bg-[#245C63]`} onClick={downloadCsv}>
                    <Download size={16} />
                    {activeView === 'dashboard' ? 'Export Achievement CSV' : 'Download CSV'}
                  </button>
                )}
                {activeView === 'users' && (
                  <button
                    className={`${buttonClasses.primary} bg-[#245C63]`}
                    onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  >
                    <Users size={16} />
                    Add User
                  </button>
                )}
                <button
                  className={`${buttonClasses.secondary} border-slate-300 bg-white text-slate-700 hover:border-[#245C63] hover:text-[#245C63]`}
                  onClick={resetDemo}
                >
                  <RefreshCcw size={16} />
                  Reset Demo
                </button>
              </div>
            </header>

            {renderView()}

            <footer className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p>Supabase-backed admin data is hydrated from the shared backend snapshot, with live updates streamed into this workspace.</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  <Activity size={14} />
                  Realtime sync active
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminConsole;

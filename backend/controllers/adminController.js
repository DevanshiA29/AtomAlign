const prisma = require('../config/prisma');

const DEMO_TIMESTAMP_ISO = '2026-05-18T07:50:32+05:30';
const DEMO_FISCAL_YEAR = '2026';
const DEMO_USER_EMAILS = ['employee@test.com', 'nisha@test.com', 'manager@test.com', 'admin@test.com'];
const streamClients = new Set();

const createCycleState = () => ([
  {
    id: 'phase1',
    cycle: 'Phase 1 - Goal Setting',
    type: 'GOAL_SETTING',
    window: '2026-05-01 to 2026-06-30',
    status: 'OPEN'
  },
  {
    id: 'q1',
    cycle: 'Q1 Check-in',
    type: 'Q1',
    window: '2026-07-01 to 2026-07-31',
    status: 'OPEN'
  },
  {
    id: 'q2',
    cycle: 'Q2 Check-in',
    type: 'Q2',
    window: '2026-10-01 to 2026-10-31',
    status: 'DRAFT'
  },
  {
    id: 'q3',
    cycle: 'Q3 Check-in',
    type: 'Q3',
    window: '2027-01-01 to 2027-01-31',
    status: 'DRAFT'
  },
  {
    id: 'q4',
    cycle: 'Q4 / Annual',
    type: 'Q4',
    window: '2027-03-01 to 2027-04-30',
    status: 'DRAFT'
  }
]);

const createAuditTrail = () => ([
  {
    id: 'audit-approve-g1',
    heading: 'APPROVE Goal g_1',
    body: 'Priya Sharma changed status from "SUBMITTED" to "LOCKED".',
    timestamp: DEMO_TIMESTAMP_ISO,
    actor: 'Priya Sharma',
    eventType: 'APPROVE',
    field: 'status',
    oldValue: 'SUBMITTED',
    newValue: 'LOCKED'
  }
]);

let demoCycles = createCycleState();
let demoAuditTrail = createAuditTrail();

const demoGoalItems = [
  {
    title: 'Grow enterprise sales pipeline',
    targetValue: '120',
    uom: 'Numeric',
    q1Actual: '88',
    q1Status: 'On Track'
  },
  {
    title: 'Improve renewal coverage',
    targetValue: '95',
    uom: '%',
    q1Actual: '91',
    q1Status: 'On Track'
  },
  {
    title: 'Reduce quote turnaround time',
    targetValue: '2',
    uom: 'Numeric',
    q1Actual: '',
    q1Status: 'Not Started'
  },
  {
    title: 'Complete account hygiene review',
    targetValue: '2026-07-25',
    uom: 'Timeline',
    q1Actual: '',
    q1Status: 'Not Started'
  }
];

const formatTimestamp = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(new Date(value)).replace(',', '');

const roleLabel = (role) => String(role || '').toUpperCase();

const getManagerName = (user) => user.manager?.name || '\u2014';

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveReportStatus = (actualValue, score) => {
  if (actualValue === '' || actualValue === null || actualValue === undefined) {
    return 'NOT_STARTED';
  }

  if (score >= 100) {
    return 'AHEAD';
  }

  return 'ON_TRACK';
};

const calculateScore = (item, quarter = 'Q1') => {
  const actualValue = item.actualAchievements?.[quarter] ?? '';
  if (actualValue === '' || actualValue === null || actualValue === undefined) {
    return 0;
  }

  if (item.uom === 'Timeline') {
    return actualValue && actualValue <= item.targetValue ? 100 : 0;
  }

  const target = parseNumber(item.targetValue);
  const actual = parseNumber(actualValue);

  if (!target || actual === null) {
    return 0;
  }

  return Math.round((actual / target) * 100);
};

const createCsv = (rows) => {
  const escapeCell = (value) => {
    const normalized = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  const header = ['Employee', 'Department', 'Goal', 'Quarter', 'Planned', 'Actual', 'Score', 'Status', 'Admin'];
  const lines = [
    header.join(','),
    ...rows.map((row) => [
      row.employee,
      row.department,
      row.goal,
      row.quarter,
      row.planned,
      row.actual,
      row.scoreLabel,
      row.status,
      row.adminAction
    ].map(escapeCell).join(','))
  ];

  return lines.join('\n');
};

const buildReportRows = (users) => {
  const reports = [];

  users
    .filter((user) => user.role === 'Employee')
    .forEach((user) => {
      user.goalSheets.forEach((sheet) => {
        sheet.items.forEach((item) => {
          const score = calculateScore(item, 'Q1');
          const actual = item.actualAchievements?.Q1 ?? '';
          const status = resolveReportStatus(actual, score);

          reports.push({
            id: item.id,
            employeeId: user.id,
            employee: user.name,
            department: user.department || 'General',
            goal: item.title || 'Untitled goal',
            quarter: 'Q1',
            planned: item.targetValue || '',
            actual,
            score,
            scoreLabel: `${score}%`,
            status,
            adminAction: sheet.status === 'Locked' ? 'Unlock' : 'Unlocked',
            sheetStatus: sheet.status,
            uom: item.uom || 'Numeric',
            manager: getManagerName(user)
          });
        });
      });
    });

  return reports;
};

const buildAnalytics = (reports, employees) => {
  const progressRows = [
    { label: 'Goals locked', value: Math.round((employees.filter((employee) => employee.goalSheets.some((sheet) => sheet.status === 'Locked')).length / Math.max(employees.length, 1)) * 100) },
    { label: 'Check-ins', value: Math.round((employees.filter((employee) => employee.goalSheets.some((sheet) => sheet.items.some((item) => item.actualAchievements?.Q1))).length / Math.max(employees.length, 1)) * 100) },
    { label: 'Approvals', value: Math.round((employees.filter((employee) => employee.goalSheets.some((sheet) => sheet.status === 'Locked')).length / Math.max(employees.length, 1)) * 100) }
  ];

  const goalDistribution = [
    { label: 'NUMERIC MIN', value: reports.filter((report) => report.uom === 'Numeric').length > 0 ? 1 : 0 },
    { label: 'PERCENT MIN', value: reports.filter((report) => report.uom === '%').length > 0 ? 1 : 0 },
    { label: 'NUMERIC MAX', value: reports.filter((report) => report.uom === 'Numeric').length > 1 ? 1 : 0 },
    { label: 'TIMELINE', value: reports.filter((report) => report.uom === 'Timeline').length > 0 ? 1 : 0 }
  ];

  const scoredReports = reports.filter((report) => report.actual !== '' && report.actual !== null && report.actual !== undefined);
  const q1Average = scoredReports.length
    ? Math.round(scoredReports.reduce((total, report) => total + report.score, 0) / scoredReports.length)
    : 0;

  const managerEffectiveness = employees.reduce((acc, employee) => {
    const manager = getManagerName(employee);
    if (manager === '\u2014') {
      return acc;
    }

    const current = acc.get(manager) || { name: manager, total: 0, locked: 0 };
    current.total += 1;
    if (employee.goalSheets.some((sheet) => sheet.status === 'Locked')) {
      current.locked += 1;
    }
    acc.set(manager, current);
    return acc;
  }, new Map());

  return {
    progressRows,
    goalDistribution,
    qoqTrend: [
      { label: 'Q1', value: q1Average },
      { label: 'Q2', value: 0 },
      { label: 'Q3', value: 0 },
      { label: 'Q4', value: 0 }
    ],
    managerEffectiveness: Array.from(managerEffectiveness.values()).map((entry) => ({
      name: entry.name,
      value: entry.total ? Math.round((entry.locked / entry.total) * 100) : 0
    }))
  };
};

const buildEscalations = (employees) => {
  return employees
    .filter((employee) => !employee.goalSheets.some((sheet) => sheet.status === 'Locked'))
    .map((employee) => ({
      id: `escalation-${employee.id}`,
      name: employee.name,
      message: 'Goals not submitted within 7 days of cycle open',
      meta: `${getManagerName(employee)} - OPEN - ${formatTimestamp(DEMO_TIMESTAMP_ISO)}`
    }));
};

const buildUsersTable = (users) => {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleLabel(user.role),
    manager: getManagerName(user),
    department: user.department || 'General'
  }));
};

const buildSnapshot = async () => {
  const users = await prisma.user.findMany({
    include: {
      manager: {
        select: { id: true, name: true }
      },
      goalSheets: {
        include: {
          items: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }
    },
    orderBy: [
      { role: 'asc' },
      { name: 'asc' }
    ]
  });

  const employees = users.filter((user) => user.role === 'Employee');
  const reports = buildReportRows(users);
  const activePopulation = employees.length;
  const lockedEmployees = employees.filter((employee) => employee.goalSheets.some((sheet) => sheet.status === 'Locked')).length;
  const employeesWithCheckIns = employees.filter((employee) =>
    employee.goalSheets.some((sheet) => sheet.items.some((item) => item.actualAchievements?.Q1))
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    currentDate: '2026-05-18',
    roleScope: {
      title: 'HR Admin',
      subtitle: 'ADMIN - Human Resources'
    },
    dashboard: {
      metrics: [
        { label: 'Employees', title: 'Active population', value: activePopulation },
        { label: 'Goal Completion', title: 'Employees with locked goals', value: `${Math.round((lockedEmployees / Math.max(activePopulation, 1)) * 100)}%` },
        { label: 'Check-ins', title: 'Q1 completion', value: `${Math.round((employeesWithCheckIns / Math.max(activePopulation, 1)) * 100)}%` },
        { label: 'Audit Events', title: 'Governance trail', value: demoAuditTrail.length }
      ],
      completionRows: [
        { label: 'Goals locked', value: Math.round((lockedEmployees / Math.max(activePopulation, 1)) * 100) },
        { label: 'Check-ins', value: Math.round((employeesWithCheckIns / Math.max(activePopulation, 1)) * 100) },
        { label: 'Approvals', value: Math.round((lockedEmployees / Math.max(activePopulation, 1)) * 100) }
      ],
      escalations: buildEscalations(employees)
    },
    users: buildUsersTable(users),
    cycles: demoCycles.map((cycle) => ({
      ...cycle,
      actionLabel: cycle.status === 'OPEN' ? 'Close' : 'Open'
    })),
    reports,
    auditLogs: demoAuditTrail.map((log) => ({
      ...log,
      timestampLabel: formatTimestamp(log.timestamp)
    })),
    analytics: buildAnalytics(reports, employees)
  };
};

const sendSseEvent = (res, event, payload) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const broadcastSnapshot = async () => {
  if (streamClients.size === 0) {
    return;
  }

  const snapshot = await buildSnapshot();
  for (const client of streamClients) {
    sendSseEvent(client, 'snapshot', snapshot);
  }
};

const appendAuditLog = (entry) => {
  demoAuditTrail = [
    {
      id: `${entry.eventType.toLowerCase()}-${Date.now()}`,
      timestamp: DEMO_TIMESTAMP_ISO,
      ...entry
    },
    ...demoAuditTrail
  ];
};

const seedDemoData = async () => {
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: trackedUserEmails } },
    select: { id: true, email: true }
  });

  const existingUserIds = existingUsers.map((user) => user.id);

  await prisma.$transaction(async (tx) => {
    if (existingUserIds.length > 0) {
      await tx.goalItem.deleteMany({
        where: {
          goalSheet: {
            userId: { in: existingUserIds }
          }
        }
      });

      await tx.goalSheet.deleteMany({
        where: {
          userId: { in: existingUserIds }
        }
      });
    }

    await tx.user.deleteMany({
      where: { email: { in: DEMO_USER_EMAILS } }
    });

    const priya = await tx.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'manager@test.com',
        password: 'password',
        role: 'Manager',
        department: 'Sales',
        title: 'Sales Manager'
      }
    });

    await tx.user.create({
      data: {
        name: 'HR Admin',
        email: 'admin@test.com',
        password: 'password',
        role: 'Admin',
        department: 'Human Resources',
        title: 'HR Administrator'
      }
    });

    const aarav = await tx.user.create({
      data: {
        name: 'Aarav Mehta',
        email: 'employee@test.com',
        password: 'password',
        role: 'Employee',
        managerId: priya.id,
        department: 'Sales',
        title: 'Account Executive'
      }
    });

    await tx.user.create({
      data: {
        name: 'Nisha Rao',
        email: 'nisha@test.com',
        password: 'password',
        role: 'Employee',
        managerId: priya.id,
        department: 'Sales',
        title: 'Account Executive'
      }
    });

    await tx.goalSheet.create({
      data: {
        userId: aarav.id,
        fiscalYear: DEMO_FISCAL_YEAR,
        status: 'Locked',
        items: {
          create: demoGoalItems.map((goal, index) => ({
            thrustArea: 'Revenue Growth',
            title: goal.title,
            description: goal.title,
            uom: goal.uom,
            targetValue: goal.targetValue,
            weightage: 25,
            type: 'Individual',
            actualAchievements: {
              Q1: goal.q1Actual,
              Q2: '',
              Q3: '',
              Q4: ''
            },
            status: {
              Q1: goal.q1Status,
              Q2: 'Not Started',
              Q3: 'Not Started',
              Q4: 'Not Started'
            },
            managerComments: {
              Q1: index < 2 ? 'Tracking well.' : '',
              Q2: '',
              Q3: '',
              Q4: ''
            }
          }))
        }
      }
    });
  });

  demoCycles = createCycleState();
  demoAuditTrail = createAuditTrail();
};

exports.resetDemoData = async (req, res) => {
  try {
    await seedDemoData();
    const snapshot = await buildSnapshot();
    await broadcastSnapshot();
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAdminPortalSnapshot = async (req, res) => {
  try {
    const demoCount = await prisma.user.count({
      where: { email: { in: DEMO_USER_EMAILS } }
    });

    if (demoCount < DEMO_USER_EMAILS.length) {
      await seedDemoData();
    }

    const snapshot = await buildSnapshot();
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.streamAdminPortal = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  streamClients.add(res);

  try {
    const snapshot = await buildSnapshot();
    sendSseEvent(res, 'snapshot', snapshot);
  } catch (error) {
    sendSseEvent(res, 'error', { message: error.message });
  }

  req.on('close', () => {
    streamClients.delete(res);
    res.end();
  });
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, managerId, department } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, and role are required.' });
    }

    const normalizedRole = String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase();

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: 'password',
        role: normalizedRole,
        managerId: managerId || null,
        department: department || 'General',
        title: normalizedRole === 'Manager' ? 'People Manager' : normalizedRole === 'Admin' ? 'HR Administrator' : 'Team Member'
      }
    });

    appendAuditLog({
      heading: `CREATE User ${user.name}`,
      body: `HR Admin added ${user.name} as ${roleLabel(normalizedRole)}.`,
      actor: 'HR Admin',
      eventType: 'CREATE',
      field: 'user',
      oldValue: 'N/A',
      newValue: user.email
    });

    const snapshot = await buildSnapshot();
    await broadcastSnapshot();
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleCycleStatus = async (req, res) => {
  try {
    const { cycleId } = req.params;
    demoCycles = demoCycles.map((cycle) =>
      cycle.id === cycleId
        ? {
            ...cycle,
            status: cycle.status === 'OPEN' ? 'DRAFT' : 'OPEN'
          }
        : cycle
    );

    const updated = demoCycles.find((cycle) => cycle.id === cycleId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Cycle not found.' });
    }

    appendAuditLog({
      heading: `${updated.status === 'OPEN' ? 'OPEN' : 'CLOSE'} Cycle ${updated.type}`,
      body: `HR Admin changed ${updated.cycle} to ${updated.status}.`,
      actor: 'HR Admin',
      eventType: updated.status === 'OPEN' ? 'OPEN' : 'CLOSE',
      field: 'cycle.status',
      oldValue: updated.status === 'OPEN' ? 'DRAFT' : 'OPEN',
      newValue: updated.status
    });

    const snapshot = await buildSnapshot();
    await broadcastSnapshot();
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.unlockEmployeeReports = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true }
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    const lockedSheets = await prisma.goalSheet.findMany({
      where: {
        userId: employeeId,
        status: 'Locked'
      },
      select: { id: true }
    });

    if (lockedSheets.length > 0) {
      await prisma.goalSheet.updateMany({
        where: {
          id: { in: lockedSheets.map((sheet) => sheet.id) }
        },
        data: {
          status: 'Draft'
        }
      });
    }

    appendAuditLog({
      heading: `UNLOCK Goal Sheet ${employee.name}`,
      body: `HR Admin changed ${employee.name}'s sheet from "LOCKED" to "DRAFT".`,
      actor: 'HR Admin',
      eventType: 'UNLOCK',
      field: 'status',
      oldValue: 'LOCKED',
      newValue: 'DRAFT'
    });

    const snapshot = await buildSnapshot();
    await broadcastSnapshot();
    return res.json({ success: true, data: snapshot });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportAchievements = async (req, res) => {
  try {
    const snapshot = await buildSnapshot();
    const csv = createCsv(snapshot.reports);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=atomquest-admin-reports.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).send('Error generating export');
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const snapshot = await buildSnapshot();
    return res.json({
      success: true,
      data: {
        windowStates: Object.fromEntries(snapshot.cycles.map((cycle) => [cycle.id, cycle.status === 'OPEN'])),
        auditLogs: snapshot.auditLogs,
        stats: {
          globalSubmissionRate: Number.parseInt(snapshot.dashboard.metrics[1].value, 10) || 0,
          managerCheckinRate: Number.parseInt(snapshot.dashboard.metrics[2].value, 10) || 0
        },
        teams: []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrgHierarchy = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({
      success: true,
      data: {
        roots: users.filter((user) => !user.managerId),
        managers: users.filter((user) => user.role === 'Manager')
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleWindow = async (req, res) => {
  req.params.cycleId = req.params.windowName;
  return exports.toggleCycleStatus(req, res);
};

exports.forceUnlockGoal = async (req, res) => {
  return exports.unlockEmployeeReports(req, res);
};

exports.pushSharedGoal = async (req, res) => {
  appendAuditLog({
    heading: 'DISPATCH Shared Goal',
    body: 'HR Admin dispatched a shared KPI package.',
    actor: 'HR Admin',
    eventType: 'DISPATCH',
    field: 'goal.dispatch',
    oldValue: 'N/A',
    newValue: 'Created'
  });

  const snapshot = await buildSnapshot();
  await broadcastSnapshot();
  return res.json({ success: true, data: snapshot });
};

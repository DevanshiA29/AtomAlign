const prisma = require('../config/prisma');

const summarizeSheetSet = (sheets = []) => {
  return sheets.reduce((acc, sheet) => {
    acc.totalSheets += 1;
    if (sheet.status === 'Pending Approval') acc.pending += 1;
    if (sheet.status === 'Locked') acc.locked += 1;
    if (sheet.status === 'Completed') acc.completed += 1;
    return acc;
  }, {
    totalSheets: 0,
    pending: 0,
    locked: 0,
    completed: 0
  });
};

// In-memory mock for SystemConfig and AuditLog since they are not in Postgres schema yet
let mockConfig = { windows: { phase1: true, q1: false, q2: false, q3: false, q4: false } };
let mockAuditLogs = [];

exports.getDashboardData = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'Employee' } });
    const submittedSheets = await prisma.goalSheet.count({ where: { status: { not: 'Draft' } } });
    
    const globalSubmissionRate = totalUsers > 0 ? Math.round((submittedSheets / totalUsers) * 100) : 85;
    const managerCheckinRate = 62; 

    // Real Team Metrics
    const managers = await prisma.user.findMany({
      where: { role: 'Manager' },
      include: {
        employees: {
          include: {
            goalSheets: true
          }
        }
      }
    });

    const teams = managers.map((manager, idx) => {
      let pending = 0;
      let onTrack = 0;
      let completed = 0;

      manager.employees.forEach(emp => {
        emp.goalSheets.forEach(sheet => {
          if (sheet.status === 'Pending Approval') pending++;
          if (sheet.status === 'Locked') onTrack++; // Simplify for demo
          if (sheet.status === 'Completed') completed++;
        });
      });

      return {
        id: manager.id,
        team: manager.department || 'General',
        manager: manager.name,
        pending,
        onTrack,
        completed
      };
    });

    res.json({
      success: true,
      data: {
        windowStates: mockConfig.windows,
        auditLogs: mockAuditLogs,
        stats: { globalSubmissionRate, managerCheckinRate },
        teams
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleWindow = async (req, res) => {
  try {
    const { windowName } = req.params;
    const { active } = req.body;
    
    if (mockConfig.windows[windowName] === undefined) {
      return res.status(400).json({ success: false, error: 'Invalid window name' });
    }

    const priorState = mockConfig.windows[windowName] ? 'Open' : 'Closed';
    mockConfig.windows[windowName] = active;
    const newState = active ? 'Open' : 'Closed';

    const log = {
      id: Date.now().toString(),
      adminId: 'SYS-AUTO',
      targetNode: 'System Global',
      actionEvent: 'Window Toggle',
      priorState: `${windowName.toUpperCase()} ${priorState}`,
      newState: `${windowName.toUpperCase()} ${newState}`,
      timestamp: new Date().toISOString()
    };
    mockAuditLogs.unshift(log);

    res.json({ success: true, log, windowStates: mockConfig.windows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.forceUnlockGoal = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const log = {
      id: Date.now().toString(),
      adminId: 'ADM-882 (You)',
      targetNode: employeeId,
      actionEvent: 'Force Unlock',
      priorState: 'Approved (Locked)',
      newState: 'Draft',
      timestamp: new Date().toISOString()
    };
    mockAuditLogs.unshift(log);

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.pushSharedGoal = async (req, res) => {
  try {
    const { thrustArea, uom, title, targetValue, targetDepartments } = req.body;
    
    const log = {
      id: Date.now().toString(),
      adminId: 'ADM-882 (You)',
      targetNode: targetDepartments.join(', '),
      actionEvent: 'Global KPI Dispatch',
      priorState: 'N/A',
      newState: `"${title}" pushed`,
      timestamp: new Date().toISOString()
    };
    mockAuditLogs.unshift(log);

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportAchievements = async (req, res) => {
  try {
    const csvLines = [
      'Employee Name,Team,Goal Title,UoM,Target,Q1 Actual,Q2 Actual,Q3 Actual,Q4 Actual',
      'Alex Doe,Engineering,Reduce Server Costs,%,15,5,10,0,0',
      'Sarah Smith,Sales,Close 10 Enterprise Deals,Numeric,10,2,4,1,0',
    ];
    const csvString = csvLines.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=achievement_ledger.csv');
    res.send(csvString);
  } catch (error) {
    res.status(500).send('Error generating export');
  }
};

exports.getOrgHierarchy = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        goalSheets: {
          include: {
            items: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    });

    const usersById = new Map(
      users.map((user) => [
        user.id,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          managerId: user.managerId,
          metrics: summarizeSheetSet(user.goalSheets),
          children: []
        }
      ])
    );

    for (const user of users) {
      if (user.managerId && usersById.has(user.managerId)) {
        usersById.get(user.managerId).children.push(usersById.get(user.id));
      }
    }

    const roots = Array.from(usersById.values()).filter((user) => !user.managerId || !usersById.has(user.managerId));
    const managers = Array.from(usersById.values()).filter((user) => user.role === 'Manager');

    res.json({
      success: true,
      data: {
        roots,
        managers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

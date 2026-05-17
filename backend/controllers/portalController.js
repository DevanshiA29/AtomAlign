const prisma = require('../config/prisma');

const DEFAULT_ACTUALS = { Q1: '', Q2: '', Q3: '', Q4: '' };
const DEFAULT_STATUSES = { Q1: 'Not Started', Q2: 'Not Started', Q3: 'Not Started', Q4: 'Not Started' };
const DEFAULT_MANAGER_COMMENTS = { Q1: '', Q2: '', Q3: '', Q4: '', Review: '' };

const mergeQuarterMap = (value, fallback) => ({
  ...fallback,
  ...(value && typeof value === 'object' ? value : {})
});

const normalizeItemPayload = (item) => ({
  thrustArea: item.thrustArea,
  title: item.title,
  description: item.description,
  uom: item.uom,
  targetValue: item.targetValue,
  weightage: Number(item.weightage),
  type: item.type || 'Individual',
  actualAchievements: mergeQuarterMap(item.actualAchievements, DEFAULT_ACTUALS),
  status: mergeQuarterMap(item.status, DEFAULT_STATUSES)
});

const statusPriority = {
  'Pending Approval': 4,
  'Returned for Rework': 3,
  Draft: 2,
  Locked: 1,
  Completed: 0
};

const getStatusPriority = (status) => statusPriority[status] ?? -1;

const sortSheetsByPriority = (sheets) => {
  return [...sheets].sort((a, b) => {
    const priorityDiff = getStatusPriority(b.status) - getStatusPriority(a.status);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

const getBadge = (progress) => {
  if (progress.completionRate >= 90 && progress.checkInRate >= 85) {
    return { label: 'Pacesetter', tone: 'emerald', detail: 'High completion and strong follow-through.' };
  }
  if (progress.checkInRate >= 75) {
    return { label: 'Consistency Star', tone: 'sky', detail: 'Regularly logging visible progress.' };
  }
  if (progress.onTrackGoals > 0 || progress.completedGoals > 0) {
    return { label: 'Momentum Builder', tone: 'amber', detail: 'Goals are moving with clear momentum.' };
  }
  return { label: 'Needs Attention', tone: 'rose', detail: 'Manager support can unblock progress.' };
};

const summarizeGoalProgress = (items = []) => {
  const summary = items.reduce((acc, item) => {
    const statuses = mergeQuarterMap(item.status, DEFAULT_STATUSES);
    const actuals = mergeQuarterMap(item.actualAchievements, DEFAULT_ACTUALS);
    const quarterStatuses = Object.values(statuses);
    const actualValues = Object.values(actuals);

    acc.totalGoals += 1;
    if (quarterStatuses.includes('Completed')) acc.completedGoals += 1;
    else if (quarterStatuses.includes('On Track')) acc.onTrackGoals += 1;
    else acc.notStartedGoals += 1;

    acc.loggedCheckIns += actualValues.filter((value) => value !== '' && value !== null && value !== undefined).length;
    acc.totalCheckIns += 4;
    return acc;
  }, {
    totalGoals: 0,
    completedGoals: 0,
    onTrackGoals: 0,
    notStartedGoals: 0,
    loggedCheckIns: 0,
    totalCheckIns: 0
  });

  const completionRate = summary.totalGoals ? Math.round((summary.completedGoals / summary.totalGoals) * 100) : 0;
  const checkInRate = summary.totalCheckIns ? Math.round((summary.loggedCheckIns / summary.totalCheckIns) * 100) : 0;

  return {
    ...summary,
    completionRate,
    checkInRate
  };
};

const defaultDepartmentByRole = {
  Employee: 'General',
  Manager: 'Leadership',
  Admin: 'Executive Operations'
};

const DEMO_ADMIN_EMAIL = 'devanshiawasthi29@gmail.com';
const defaultTitleByRole = {
  Employee: 'Individual Contributor',
  Manager: 'People Manager',
  Admin: 'Platform Administrator'
};

const getNormalizedEmail = (email = '') => email.trim().toLowerCase();
const getRolePrefix = (role) => {
  if (role === 'Admin') return 'ADM';
  if (role === 'Manager') return 'MGR';
  return 'EMP';
};

const resolveRole = (requestedRole, email) => {
  const normalizedEmail = getNormalizedEmail(email);
  if (normalizedEmail === DEMO_ADMIN_EMAIL) {
    return 'Admin';
  }
  if (requestedRole === 'Admin') {
    return null;
  }
  return requestedRole;
};

const mapUserProfile = (user) => ({
  id: user.id,
  clerkUserId: user.clerkUserId,
  staffCode: user.staffCode,
  name: user.name,
  email: user.email,
  role: user.role,
  managerId: user.managerId,
  department: user.department,
  dateOfJoining: user.dateOfJoining,
  phone: user.phone,
  title: user.title,
  location: user.location,
  bio: user.bio,
  websiteUrl: user.websiteUrl,
  linkedinUrl: user.linkedinUrl,
  githubUrl: user.githubUrl,
  avatarUrl: user.avatarUrl,
  manager: user.manager ? { id: user.manager.id, name: user.manager.name } : null
});

const nextStaffCode = async (tx, role) => {
  const prefix = getRolePrefix(role);
  const count = await tx.user.count({
    where: {
      role,
      staffCode: { startsWith: `${prefix}-` }
    }
  });

  let sequence = count + 1;
  while (true) {
    const candidate = `${prefix}-${String(sequence).padStart(4, '0')}`;
    const existing = await tx.user.findFirst({
      where: { staffCode: candidate },
      select: { id: true }
    });
    if (!existing) return candidate;
    sequence += 1;
  }
};

// --- EMPLOYEE ENDPOINTS ---

exports.syncPortalUser = async (req, res) => {
  try {
    const { email, name, role, clerkUserId, avatarUrl } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required.' });
    }

    const normalizedEmail = getNormalizedEmail(email);
    const resolvedRole = resolveRole(role, normalizedEmail);

    if (!resolvedRole) {
      return res.status(403).json({
        error: 'This email is not authorized for the admin portal.',
        authorized: false,
        matchedRole: null,
        status: 'pending_approval'
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    if (user) {
      user = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          name: name || user.name,
          email: normalizedEmail,
          clerkUserId: clerkUserId || user.clerkUserId,
          avatarUrl: avatarUrl || user.avatarUrl,
          role: getNormalizedEmail(user.email) === DEMO_ADMIN_EMAIL ? 'Admin' : user.role,
          department: user.department || defaultDepartmentByRole[user.role] || 'General',
          title: user.title || defaultTitleByRole[user.role] || 'Team Member'
        },
        include: {
          manager: { select: { id: true, name: true } }
        }
      });
    } else {
      if (normalizedEmail === DEMO_ADMIN_EMAIL) {
        user = await prisma.$transaction(async (tx) => {
          const staffCode = await nextStaffCode(tx, resolvedRole);
          return tx.user.create({
            data: {
              clerkUserId,
              staffCode,
              email: normalizedEmail,
              name: name || normalizedEmail.split('@')[0],
              password: '123456789',
              role: resolvedRole,
              department: defaultDepartmentByRole[resolvedRole] || 'General',
              title: defaultTitleByRole[resolvedRole] || 'Team Member',
              avatarUrl
            },
            include: {
              manager: { select: { id: true, name: true } }
            }
          });
        });
      } else {
        return res.status(403).json({
          error: 'No approved workforce record was found for this email yet.',
          authorized: false,
          matchedRole: null,
          status: 'pending_approval'
        });
      }
    }

    const authorized = user.role === resolvedRole;

    return res.status(200).json({
      authorized,
      matchedRole: user.role,
      status: authorized ? 'approved' : 'wrong_portal',
      user: mapUserProfile(user)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ profile: mapUserProfile(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      phone,
      department,
      dateOfJoining,
      title,
      location,
      bio,
      websiteUrl,
      linkedinUrl,
      githubUrl,
      avatarUrl,
      managerId
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(department !== undefined ? { department } : {}),
        ...(dateOfJoining !== undefined ? { dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl } : {}),
        ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
        ...(githubUrl !== undefined ? { githubUrl } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(managerId !== undefined ? { managerId: managerId || null } : {})
      },
      include: {
        manager: { select: { id: true, name: true } }
      }
    });

    return res.status(200).json({ profile: mapUserProfile(updatedUser) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getManagers = async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'Manager' },
      include: {
        employees: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      managers: managers.map((manager) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        department: manager.department,
        teamSize: manager.employees.length
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/portal/my-sheets
// Fetch sheets based on status
exports.getEmployeeSheet = async (req, res) => {
  try {
    const { userId, fiscalYear = '2026', status } = req.query;
    
    // Find sheets matching the criteria
    const whereClause = { userId, fiscalYear };
    if (status) {
      whereClause.status = status;
    }
    
    const sheets = await prisma.goalSheet.findMany({
      where: whereClause,
      include: {
        items: true,
        user: { select: { name: true, department: true, managerId: true } }
      }
    });

    res.status(200).json({ sheets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/portal/my-sheet
exports.saveEmployeeSheet = async (req, res) => {
  try {
    const { userId, managerId, fiscalYear = '2026', items, status } = req.body;

    const targetStatus = status || 'Draft';
    const sourceStatuses =
      targetStatus === 'Pending Approval'
        ? ['Pending Approval', 'Returned for Rework', 'Draft']
        : targetStatus === 'Draft'
          ? ['Draft', 'Returned for Rework']
          : [targetStatus];

    const updatedSheet = await prisma.$transaction(async (tx) => {
      if (managerId) {
        await tx.user.update({
          where: { id: userId },
          data: { managerId }
        });
      }

      const candidateSheets = await tx.goalSheet.findMany({
        where: {
          userId,
          fiscalYear,
          status: { in: sourceStatuses }
        },
        include: { items: true },
        orderBy: { updatedAt: 'desc' }
      });

      let sheet = candidateSheets[0] || null;

      if (!sheet) {
        sheet = await tx.goalSheet.findFirst({
          where: { userId, fiscalYear, status: targetStatus },
          include: { items: true },
          orderBy: { updatedAt: 'desc' }
        });
      }

      if (sheet) {
        const duplicates = await tx.goalSheet.findMany({
          where: {
            userId,
            fiscalYear,
            status: targetStatus,
            NOT: { id: sheet.id }
          },
          select: { id: true }
        });

        for (const duplicate of duplicates) {
          await tx.goalSheet.delete({ where: { id: duplicate.id } });
        }

        const existingIds = new Set(sheet.items.map((entry) => entry.id));
        const retainedIds = items
          .map((item) => item.id)
          .filter((id) => id && existingIds.has(id));

        await tx.goalItem.deleteMany({
          where: {
            sheetId: sheet.id,
            id: { notIn: retainedIds.length > 0 ? retainedIds : ['__keep_none__'] }
          }
        });

        await tx.goalSheet.update({
          where: { id: sheet.id },
          data: { status: targetStatus }
        });

        for (const item of items) {
          const payload = normalizeItemPayload(item);
          if (item.id && existingIds.has(item.id)) {
            await tx.goalItem.update({
              where: { id: item.id },
              data: payload
            });
          } else {
            await tx.goalItem.create({
              data: {
                sheetId: sheet.id,
                ...payload
              }
            });
          }
        }
      } else {
        sheet = await tx.goalSheet.create({
          data: {
            userId,
            fiscalYear,
            status: targetStatus,
            items: {
              create: items.map((item) => normalizeItemPayload(item))
            }
          },
          include: { items: true }
        });
      }

      return tx.goalSheet.findUnique({
        where: { id: sheet.id },
        include: {
          items: true,
          user: { select: { name: true, department: true } }
        }
      });
    });

    res.status(200).json({ message: 'Sheet saved successfully', sheet: updatedSheet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/portal/goal/:goalId
exports.deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    await prisma.goalItem.delete({
      where: { id: goalId }
    });
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- MANAGER ENDPOINTS ---

exports.getManagerQueue = async (req, res) => {
  try {
    const { managerId, fiscalYear = '2026' } = req.query;
    
    // Find all users who report to this manager
    const team = await prisma.user.findMany({
      where: { managerId }
    });
    const userIds = team.map(u => u.id);
    
    // Find all sheets for the team, ordered by most recently updated
    const sheets = await prisma.goalSheet.findMany({
      where: { userId: { in: userIds }, fiscalYear },
      include: { items: true, user: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Map to queue format
    const queue = team.map(emp => {
      const employeeSheets = sheets.filter((sheet) => sheet.userId === emp.id);
      const prioritizedSheets = sortSheetsByPriority(employeeSheets);
      const activeSheet = prioritizedSheets[0] || null;
      const lockedSheet = employeeSheets.find((sheet) => sheet.status === 'Locked') || null;
      const progressSheet = lockedSheet || activeSheet;
      const progress = summarizeGoalProgress(progressSheet ? progressSheet.items : []);
      const managerFeedback = activeSheet && activeSheet.items.length > 0
        ? mergeQuarterMap(activeSheet.items[0].managerComments, DEFAULT_MANAGER_COMMENTS)
        : DEFAULT_MANAGER_COMMENTS;
      const currentSheet = activeSheet || progressSheet;
      const badge = getBadge(progress);

      return {
        id: emp.id,
        name: emp.name,
        dept: emp.department,
        role: emp.role,
        status: currentSheet ? currentSheet.status : 'Draft',
        sheetId: currentSheet ? currentSheet.id : null,
        goals: currentSheet ? currentSheet.items : [],
        managerFeedback,
        reviewNote: managerFeedback.Review || '',
        score: progress.completionRate,
        badge,
        totalSheets: employeeSheets.length,
        progress,
        lastUpdated: currentSheet ? currentSheet.updatedAt : emp.updatedAt
      };
    });

    res.status(200).json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSheetStatus = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { status, goals, reworkReason } = req.body;
    
    let sheet = await prisma.goalSheet.findUnique({
      where: { id: sheetId }
    });
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    if (goals && goals.length > 0) {
      for (const item of goals) {
        await prisma.goalItem.update({
          where: { id: item.id },
          data: {
            targetValue: item.targetValue,
            weightage: Number(item.weightage)
          }
        });
      }
    }

    if (status === 'Returned for Rework' && reworkReason) {
      const sheetItems = await prisma.goalItem.findMany({
        where: { sheetId }
      });

      for (const item of sheetItems) {
        const comments = mergeQuarterMap(item.managerComments, DEFAULT_MANAGER_COMMENTS);
        comments.Review = reworkReason;

        await prisma.goalItem.update({
          where: { id: item.id },
          data: { managerComments: comments }
        });
      }
    }
    
    sheet = await prisma.goalSheet.update({
      where: { id: sheetId },
      data: { status }
    });
    
    res.status(200).json({ message: `Sheet updated to ${status}`, sheet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveFeedback = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { quarter, text } = req.body;
    
    const items = await prisma.goalItem.findMany({
      where: { sheetId }
    });

    for(const item of items) {
      const comments = mergeQuarterMap(item.managerComments, DEFAULT_MANAGER_COMMENTS);
      comments[quarter] = text;
      
      await prisma.goalItem.update({
        where: { id: item.id },
        data: { managerComments: comments }
      });
    }
    
    res.status(200).json({ message: 'Feedback saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

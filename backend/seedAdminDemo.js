require('dotenv').config();
const prisma = require('./config/prisma');

const DEMO_USERS = {
  manager: {
    name: 'Priya Sharma',
    email: 'manager@test.com',
    password: 'password',
    role: 'Manager',
    department: 'Sales',
    title: 'Sales Manager'
  },
  admin: {
    name: 'HR Admin',
    email: 'admin@test.com',
    password: 'password',
    role: 'Admin',
    department: 'Human Resources',
    title: 'HR Administrator'
  },
  aarav: {
    name: 'Aarav Mehta',
    email: 'employee@test.com',
    password: 'password',
    role: 'Employee',
    department: 'Sales',
    title: 'Account Executive'
  },
  nisha: {
    name: 'Nisha Rao',
    email: 'nisha@test.com',
    password: 'password',
    role: 'Employee',
    department: 'Sales',
    title: 'Account Executive'
  }
};

const DEMO_GOALS = [
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

async function upsertUser(tx, data) {
  return tx.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      password: data.password,
      role: data.role,
      department: data.department,
      title: data.title
    },
    create: data
  });
}

async function seedAdminDemo() {
  await prisma.$transaction(async (tx) => {
    const manager = await upsertUser(tx, DEMO_USERS.manager);
    await upsertUser(tx, DEMO_USERS.admin);

    const aarav = await tx.user.upsert({
      where: { email: DEMO_USERS.aarav.email },
      update: {
        name: DEMO_USERS.aarav.name,
        password: DEMO_USERS.aarav.password,
        role: DEMO_USERS.aarav.role,
        managerId: manager.id,
        department: DEMO_USERS.aarav.department,
        title: DEMO_USERS.aarav.title
      },
      create: {
        ...DEMO_USERS.aarav,
        managerId: manager.id
      }
    });

    await tx.user.upsert({
      where: { email: DEMO_USERS.nisha.email },
      update: {
        name: DEMO_USERS.nisha.name,
        password: DEMO_USERS.nisha.password,
        role: DEMO_USERS.nisha.role,
        managerId: manager.id,
        department: DEMO_USERS.nisha.department,
        title: DEMO_USERS.nisha.title
      },
      create: {
        ...DEMO_USERS.nisha,
        managerId: manager.id
      }
    });

    await tx.goalItem.deleteMany({
      where: {
        goalSheet: {
          userId: aarav.id,
          fiscalYear: '2026'
        }
      }
    });

    await tx.goalSheet.deleteMany({
      where: {
        userId: aarav.id,
        fiscalYear: '2026'
      }
    });

    await tx.goalSheet.create({
      data: {
        userId: aarav.id,
        fiscalYear: '2026',
        status: 'Locked',
        items: {
          create: DEMO_GOALS.map((goal, index) => ({
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

  const totalUsers = await prisma.user.count();
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: Object.values(DEMO_USERS).map((user) => user.email)
      }
    },
    orderBy: { email: 'asc' },
    select: {
      name: true,
      email: true,
      role: true,
      department: true
    }
  });

  console.log(JSON.stringify({
    seeded: demoUsers.length,
    totalUsers,
    demoUsers
  }, null, 2));
}

seedAdminDemo()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

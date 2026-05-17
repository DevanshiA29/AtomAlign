const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

const CURRENT_USER_ID = '60d0fe4f-5311-4361-a8a1-09ca00000001'; 
const CURRENT_MANAGER_ID = '60d0fe4f-5311-4361-a8a1-09cb00000002'; 
const SECOND_USER_ID = '60d0fe4f-5311-4361-a8a1-09ca00000003';
const THIRD_USER_ID = '60d0fe4f-5311-4361-a8a1-09ca00000004';

async function seed() {
  console.log('Cleaning up database...');
  await prisma.goalItem.deleteMany({});
  await prisma.goalSheet.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('Creating users...');
  
  const manager = await prisma.user.create({
    data: {
      id: CURRENT_MANAGER_ID,
      name: 'L1 Manager (Demo)',
      email: 'manager@atomalign.com',
      password: 'password',
      role: 'Manager',
      department: 'Engineering'
    }
  });

  const emp1 = await prisma.user.create({
    data: {
      id: CURRENT_USER_ID,
      name: 'Alex Doe',
      email: 'alex@atomalign.com',
      password: 'password',
      role: 'Employee',
      managerId: manager.id,
      department: 'Engineering'
    }
  });

  const emp2 = await prisma.user.create({
    data: {
      id: SECOND_USER_ID,
      name: 'Sarah Smith',
      email: 'sarah@atomalign.com',
      password: 'password',
      role: 'Employee',
      managerId: manager.id,
      department: 'Design'
    }
  });

  const emp3 = await prisma.user.create({
    data: {
      id: THIRD_USER_ID,
      name: 'John Watson',
      email: 'john@atomalign.com',
      password: 'password',
      role: 'Employee',
      managerId: manager.id,
      department: 'Sales'
    }
  });

  console.log('Creating Goal Sheets...');

  // Emp1 (Alex) - Has a Draft Sheet and a Locked Sheet
  await prisma.goalSheet.create({
    data: {
      userId: emp1.id,
      fiscalYear: '2026',
      status: 'Draft',
      items: {
        create: [
          {
            thrustArea: 'Innovation & R&D',
            title: 'Research new AI models',
            description: 'Evaluate at least 3 models for integration',
            uom: 'Numeric',
            targetValue: '3',
            weightage: 50,
            type: 'Individual'
          },
          {
            thrustArea: 'Operational Efficiency',
            title: 'Reduce CI/CD time',
            description: 'Optimize Github Actions',
            uom: '%',
            targetValue: '20',
            weightage: 50,
            type: 'Individual'
          }
        ]
      }
    }
  });

  // Emp2 (Sarah) - Has a Pending Approval sheet
  await prisma.goalSheet.create({
    data: {
      userId: emp2.id,
      fiscalYear: '2026',
      status: 'Pending Approval',
      items: {
        create: [
          {
            thrustArea: 'Customer Success',
            title: 'Improve UX flow',
            description: 'Redesign onboarding',
            uom: 'Timeline',
            targetValue: '2026-06-30',
            weightage: 100,
            type: 'Individual'
          }
        ]
      }
    }
  });

  // Emp3 (John) - Has a Locked sheet (execution phase)
  await prisma.goalSheet.create({
    data: {
      userId: emp3.id,
      fiscalYear: '2026',
      status: 'Locked',
      items: {
        create: [
          {
            thrustArea: 'Revenue Growth',
            title: 'Close 5 Enterprise deals',
            description: 'Q1 target focus',
            uom: 'Numeric',
            targetValue: '5',
            weightage: 100,
            type: 'Individual',
            actualAchievements: { Q1: "2", Q2: "", Q3: "", Q4: "" },
            status: { Q1: "On Track", Q2: "Not Started", Q3: "Not Started", Q4: "Not Started" },
            managerComments: { Q1: "Good start, keep pushing", Q2: "", Q3: "", Q4: "" }
          }
        ]
      }
    }
  });

  console.log('Seeded Users and Goals in Supabase via Prisma!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());

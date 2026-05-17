const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

const CURRENT_USER_ID = '60d0fe4f-5311-4361-a8a1-09ca00000001'; 
const CURRENT_MANAGER_ID = '60d0fe4f-5311-4361-a8a1-09cb00000002'; 

async function seed() {
  await prisma.user.deleteMany({});
  
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

  console.log('Seeded Users in Supabase via Prisma!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());

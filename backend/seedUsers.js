const mongoose = require('mongoose');
const User = require('./models/User');

const CURRENT_USER_ID = '60d0fe4f5311236168a109ca'; 
const CURRENT_MANAGER_ID = '60d0fe4f5311236168a109cb'; 

mongoose.connect('mongodb://127.0.0.1:27017/atom_align').then(async () => {
  await User.deleteMany({ _id: { $in: [CURRENT_USER_ID, CURRENT_MANAGER_ID] } });
  
  const manager = await User.create({
    _id: CURRENT_MANAGER_ID,
    name: 'L1 Manager (Demo)',
    email: 'manager@atomalign.com',
    password: 'password',
    role: 'Manager',
    department: 'Engineering'
  });

  const emp1 = await User.create({
    _id: CURRENT_USER_ID,
    name: 'Alex Doe',
    email: 'alex@atomalign.com',
    password: 'password',
    role: 'Employee',
    managerId: manager._id,
    department: 'Engineering'
  });

  console.log('Seeded Users!');
  process.exit();
});

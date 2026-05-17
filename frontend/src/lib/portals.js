export const PORTAL_CONFIG = {
  Employee: {
    label: 'Employee Portal',
    path: '/employee',
    signInPath: '/employee/sign-in',
    signUpPath: '/employee/sign-up',
    accent: 'from-purple-500 to-violet-600'
  },
  Manager: {
    label: 'Manager Portal',
    path: '/manager',
    signInPath: '/manager/sign-in',
    signUpPath: '/manager/sign-up',
    accent: 'from-pink-500 to-rose-600'
  },
  Admin: {
    label: 'Admin Portal',
    path: '/admin',
    signInPath: '/admin/sign-in',
    signUpPath: '/admin/sign-up',
    accent: 'from-indigo-500 to-cyan-500'
  }
};

export const DEFAULT_PORTAL_BY_ROLE = {
  Employee: '/employee',
  Manager: '/manager',
  Admin: '/admin'
};

require('dotenv').config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL || 'https://api.clerk.com/v1';

const DEMO_USERS = [
  { email: 'employee@test.com', firstName: 'Aarav', lastName: 'Mehta', password: 'Password@12345' },
  { email: 'nisha@test.com', firstName: 'Nisha', lastName: 'Rao', password: 'Password@12345' },
  { email: 'manager@test.com', firstName: 'Priya', lastName: 'Sharma', password: 'Password@12345' },
  { email: 'admin@test.com', firstName: 'HR', lastName: 'Admin', password: 'Password@12345' }
];

async function clerkRequest(path, options = {}) {
  const response = await fetch(`${CLERK_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.errors?.map((entry) => entry?.message).filter(Boolean).join(', ') || response.statusText;
    throw new Error(`Clerk API ${path} failed: ${message}`);
  }

  return data;
}

async function findUserByEmail(email) {
  const users = await clerkRequest(`/users?email_address=${encodeURIComponent(email)}`);
  return Array.isArray(users) ? users[0] : null;
}

async function seedClerkDemo() {
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not configured. Add it to backend/.env or your shell to seed Clerk users.');
  }

  const createdOrUpdated = [];

  for (const user of DEMO_USERS) {
    const existing = await findUserByEmail(user.email);

    if (existing) {
      await clerkRequest(`/users/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: user.firstName,
          last_name: user.lastName,
          password: user.password,
          skip_password_checks: true,
          skip_password_requirement: true
        })
      });
      createdOrUpdated.push({ email: user.email, status: 'updated', id: existing.id });
      continue;
    }

    const created = await clerkRequest('/users', {
      method: 'POST',
      body: JSON.stringify({
        email_address: [user.email],
        first_name: user.firstName,
        last_name: user.lastName,
        password: user.password,
        skip_password_checks: true,
        skip_password_requirement: true
      })
    });

    createdOrUpdated.push({ email: user.email, status: 'created', id: created.id });
  }

  console.log(JSON.stringify({ seeded: createdOrUpdated.length, users: createdOrUpdated }, null, 2));
}

seedClerkDemo().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

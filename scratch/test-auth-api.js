const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5005; // Use dedicated test port

const runTests = async () => {
  const server = app.listen(PORT, async () => {
    console.log(`[Test Server] Running on http://localhost:${PORT}`);

    try {
      // Helper for fetch
      const request = async (urlPath, options = {}) => {
        const url = `http://localhost:${PORT}${urlPath}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, headers: res.headers, data };
      };

      console.log('\n--- 1. Testing GET /api/health ---');
      const healthRes = await request('/api/health');
      console.log('Health status:', healthRes.status, healthRes.data);
      if (healthRes.status !== 200) throw new Error('Health check failed');

      console.log('\n--- 2. Testing Dev Login (POST /api/auth/dev-login) with incomplete profile ---');
      const loginRes = await request('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test.student@pk.edu',
          name: 'Ahmed Raza',
          resetProfile: true,
        }),
      });
      console.log('Login status:', loginRes.status);
      console.log('User created:', loginRes.data.user?.name, '| Profile complete:', loginRes.data.user?.profileComplete);
      const token = loginRes.data.token;
      if (!token) throw new Error('Token not returned');

      // Get cookie from response headers if present
      const cookie = loginRes.headers.get('set-cookie');
      console.log('Set-Cookie received:', Boolean(cookie));

      console.log('\n--- 3. Testing GET /api/auth/me with Bearer Token ---');
      const meRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Auth Me status:', meRes.status);
      console.log('Authenticated user:', meRes.data.user?.email);
      if (meRes.status !== 200 || meRes.data.user?.email !== 'test.student@pk.edu') {
        throw new Error('Get /me failed');
      }

      console.log('\n--- 4. Testing PATCH /api/users/profile to complete profile ---');
      const profileRes = await request('/api/users/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: 'Ahmed Raza',
          country: 'Pakistan',
          qualifications: ['FSc Pre-Engineering'],
          interests: ['Computer Science', 'Data Science'],
        }),
      });
      console.log('Profile update status:', profileRes.status);
      console.log('Updated profileComplete:', profileRes.data.user?.profileComplete);
      console.log('Updated interests:', profileRes.data.user?.interests);
      if (!profileRes.data.user?.profileComplete) {
        throw new Error('Profile was not marked complete');
      }

      console.log('\n--- 5. Testing Unauthorized access to /api/auth/me without token ---');
      const unauthRes = await request('/api/auth/me');
      console.log('Unauthenticated status (expected 401):', unauthRes.status);
      if (unauthRes.status !== 401) throw new Error('Expected 401 Unauthorized');

      console.log('\n--- 6. Testing POST /api/auth/logout ---');
      const logoutRes = await request('/api/auth/logout', { method: 'POST' });
      console.log('Logout status:', logoutRes.status, logoutRes.data);
      if (logoutRes.status !== 200) throw new Error('Logout failed');

      console.log('\n✅ ALL AUTHENTICATION & ONBOARDING API TESTS PASSED SUCCESSFULLY!\n');
    } catch (err) {
      console.error('\n❌ Test failure:', err);
    } finally {
      server.close(() => {
        console.log('[Test Server] Closed.');
        process.exit(0);
      });
    }
  });
};

runTests();

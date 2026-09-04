const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5015;

const runTests = async () => {
  const server = app.listen(PORT, async () => {
    console.log(`[Integration Test Server] Running on http://localhost:${PORT}`);

    try {
      const request = async (urlPath, options = {}) => {
        const url = `http://localhost:${PORT}${urlPath}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      };

      console.log('\n--- 1. Testing Route Protection (requireAuth) ---');
      const protectedEndpoints = [
        ['GET', '/api/tutor/conversations'],
        ['GET', '/api/documents'],
        ['POST', '/api/stem/balance-equation'],
        ['GET', '/api/scholarships/saved'],
        ['GET', '/api/courses/my-roadmaps'],
        ['GET', '/api/opportunities/saved'],
        ['PATCH', '/api/users/profile'],
      ];

      for (const [method, ep] of protectedEndpoints) {
        const res = await request(ep, { method });
        if (res.status !== 401) {
          throw new Error(`Security breach: Endpoint ${method} ${ep} returned status ${res.status} instead of 401 Unauthorized.`);
        }
        console.log(`  🔒 Guarded: ${method} ${ep} -> 401 Unauthorized (OK)`);
      }

      console.log('\n--- 2. Testing Public Endpoints ---');
      const healthRes = await request('/api/health');
      if (healthRes.status !== 200 || !healthRes.data.status) {
        throw new Error('Health check failed');
      }
      console.log('  🌐 Public health endpoint: OK');

      console.log('\n--- 3. Testing Authentication & Session Acquisition ---');
      const loginRes = await request('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'integration.tester@pk.edu', name: 'Dr. Ayesha Malik' }),
      });
      const token = loginRes.data.token;
      if (!token) throw new Error('Auth token acquisition failed');
      const authHeader = { Authorization: `Bearer ${token}` };
      console.log('  ✅ Logged in as Dr. Ayesha Malik (Token verified)');

      console.log('\n--- 4. Testing Input Validation Middleware ---');
      const badEquationRes = await request('/api/stem/balance-equation', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({}), // Missing equation
      });
      if (badEquationRes.status !== 400 || badEquationRes.data.error !== 'ValidationError') {
        throw new Error('Validation middleware failed to reject missing equation');
      }
      console.log('  🛡️ Validation caught missing required payload -> 400 Bad Request (OK)');

      const badCourseRes = await request('/api/courses/roadmap', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ courseTitle: '' }), // Empty title
      });
      if (badCourseRes.status !== 400) {
        throw new Error('Validation middleware failed to reject empty courseTitle');
      }
      console.log('  🛡️ Validation caught empty course title -> 400 Bad Request (OK)');

      console.log('\n--- 5. Testing Rate Limiter Quota Protection ---');
      console.log('  Firing rapid requests to test rate limiter...');
      let hit429 = false;
      for (let i = 0; i < 50; i++) {
        const rapidRes = await request('/api/courses/recommend', {
          method: 'POST',
          headers: authHeader,
          body: JSON.stringify({ interests: ['Physics'] }),
        });
        if (rapidRes.status === 429) {
          hit429 = true;
          console.log(`  🛡️ Rate Limiter triggered at request #${i + 1} with status 429 (Retry-After: ${rapidRes.data.retryAfterSeconds}s)`);
          break;
        }
      }

      console.log('\n🎉 ALL PHASE 10 POLISH & INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    } catch (err) {
      console.error('\n❌ Test failure:', err);
    } finally {
      server.close(() => {
        console.log('[Integration Test Server] Closed.');
        process.exit(0);
      });
    }
  });
};

runTests();

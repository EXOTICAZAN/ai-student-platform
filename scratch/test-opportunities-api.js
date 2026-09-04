const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5013;

const runTests = async () => {
  const server = app.listen(PORT, async () => {
    console.log(`[Test Server] Running on http://localhost:${PORT}`);

    try {
      const request = async (urlPath, options = {}) => {
        const url = `http://localhost:${PORT}${urlPath}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
      };

      console.log('\n--- 1. Authenticating test user ---');
      const loginRes = await request('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'career.student@pk.edu', name: 'Bilal Tariq' }),
      });
      const token = loginRes.data.token;
      if (!token) throw new Error('Failed to obtain auth token');
      const authHeader = { Authorization: `Bearer ${token}` };
      console.log('✅ Logged in as Bilal Tariq, Token acquired.');

      console.log('\n--- 2. Testing Live Opportunity Discovery (Local Pakistan) ---');
      const discoverRes = await request('/api/opportunities/discover', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          type: 'internship',
          isPakistanLocal: true,
          searchText: 'Software Engineer React Python',
        }),
      });
      console.log('Discover status:', discoverRes.status);
      console.log('Found opportunities count:', discoverRes.data.count);
      if (discoverRes.status !== 200 || !Array.isArray(discoverRes.data.opportunities) || discoverRes.data.opportunities.length === 0) {
        throw new Error('Opportunity discovery failed');
      }
      const sample = discoverRes.data.opportunities[0];
      console.log('Sample discovered opportunity:', {
        title: sample.title,
        company: sample.company,
        location: sample.location,
        type: sample.type,
        url: sample.applicationUrl,
      });

      console.log('\n--- 3. Testing Opportunity Save ---');
      const saveRes = await request('/api/opportunities/save', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(sample),
      });
      console.log('Save status:', saveRes.status);
      const savedOpportunity = saveRes.data.opportunity;
      if (saveRes.status !== 201 && saveRes.status !== 200) {
        throw new Error('Failed to save opportunity');
      }
      const savedId = savedOpportunity._id;
      console.log('✅ Saved opportunity ID:', savedId);

      console.log('\n--- 4. Testing Get Saved Opportunities ---');
      const getSavedRes = await request('/api/opportunities/saved', {
        headers: authHeader,
      });
      console.log('Get saved status:', getSavedRes.status, 'Total saved:', getSavedRes.data.count);
      if (getSavedRes.status !== 200 || getSavedRes.data.count < 1) {
        throw new Error('Get saved opportunities failed');
      }

      console.log('\n--- 5. Testing Delete Saved Opportunity ---');
      const deleteRes = await request(`/api/opportunities/saved/${savedId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      console.log('Delete status:', deleteRes.status);
      if (deleteRes.status !== 200) {
        throw new Error('Delete saved opportunity failed');
      }
      console.log('✅ Saved opportunity deleted successfully.');

      console.log('\n🎉 ALL PHASE 9 CAREER & INTERNSHIP BACKEND TESTS PASSED SUCCESSFULLY!\n');
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

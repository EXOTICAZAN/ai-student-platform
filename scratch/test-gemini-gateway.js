const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5006;

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

      console.log('\n--- 1. Testing POST /api/ai/test with plain text prompt ---');
      const textRes = await request('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Explain what makes Pakistani student education unique in 2 sentences.',
        }),
      });
      console.log('Text test status:', textRes.status);
      console.log('Result:', textRes.data);
      if (textRes.status !== 200) throw new Error('Plain text test failed');

      console.log('\n--- 2. Testing POST /api/ai/test with format="json" and schema ---');
      const jsonRes = await request('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'List 3 major academic streams in Pakistan with their primary subjects.',
          format: 'json',
          schema: {
            streams: [
              {
                name: 'FSc Pre-Medical',
                subjects: ['Biology', 'Physics', 'Chemistry'],
              },
            ],
          },
        }),
      });
      console.log('JSON test status:', jsonRes.status);
      console.log('JSON Result:', JSON.stringify(jsonRes.data.result, null, 2));
      if (jsonRes.status !== 200) throw new Error('JSON format test failed');

      console.log('\n--- 3. Testing POST /api/ai/test validation (Missing prompt) ---');
      const errorRes = await request('/api/ai/test', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      console.log('Missing prompt status (expected 400):', errorRes.status);
      if (errorRes.status !== 400) throw new Error('Expected 400 for missing prompt');

      console.log('\n✅ ALL GEMINI API INTEGRATION LAYER TESTS PASSED SUCCESSFULLY!\n');
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

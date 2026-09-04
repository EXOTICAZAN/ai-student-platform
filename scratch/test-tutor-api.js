const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5007;

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
        body: JSON.stringify({ email: 'tutor.student@pk.edu', name: 'Zainab Fatima' }),
      });
      const token = loginRes.data.token;
      if (!token) throw new Error('Failed to obtain auth token');
      const authHeader = { Authorization: `Bearer ${token}` };

      console.log('\n--- 2. Creating a new Tutor conversation ---');
      const createRes = await request('/api/tutor/conversations', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          title: 'Physics Mechanics Study',
          subject: 'Physics',
        }),
      });
      console.log('Create conversation status:', createRes.status);
      const convId = createRes.data.conversation?._id;
      if (!convId) throw new Error('Conversation ID not returned');

      console.log('\n--- 3. Sending a study question to the AI Tutor ---');
      const sendRes = await request(`/api/tutor/conversations/${convId}/message`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          message: 'Can you explain projectile motion trajectory in simple terms?',
        }),
      });
      console.log('Send message status:', sendRes.status);
      console.log('Messages count:', sendRes.data.messages?.length);
      console.log('AI Response excerpt:', sendRes.data.messages?.[1]?.content?.slice(0, 150));
      if (sendRes.status !== 200 || sendRes.data.messages?.length < 2) {
        throw new Error('Message sending failed');
      }

      console.log('\n--- 4. Listing student conversations ---');
      const listRes = await request('/api/tutor/conversations', {
        headers: authHeader,
      });
      console.log('List status:', listRes.status, 'Total conversations:', listRes.data.count);
      if (listRes.status !== 200 || listRes.data.count < 1) throw new Error('Listing failed');

      console.log('\n--- 5. Fetching conversation by ID ---');
      const getRes = await request(`/api/tutor/conversations/${convId}`, {
        headers: authHeader,
      });
      console.log('Get status:', getRes.status, 'Title:', getRes.data.conversation?.title);
      if (getRes.status !== 200) throw new Error('Get conversation failed');

      console.log('\n--- 6. Deleting conversation ---');
      const delRes = await request(`/api/tutor/conversations/${convId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      console.log('Delete status:', delRes.status, delRes.data);
      if (delRes.status !== 200) throw new Error('Delete failed');

      console.log('\n✅ ALL AI TUTOR BACKEND TESTS PASSED SUCCESSFULLY!\n');
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

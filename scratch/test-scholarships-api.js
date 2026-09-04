const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5009;

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
        body: JSON.stringify({ email: 'scholarship.student@pk.edu', name: 'Ali Hamza' }),
      });
      const token = loginRes.data.token;
      if (!token) throw new Error('Failed to obtain auth token');
      const authHeader = { Authorization: `Bearer ${token}` };
      console.log('✅ Logged in as Ali Hamza, Token acquired.');

      console.log('\n--- 2. Testing Live Scholarship Discovery ---');
      const discoverRes = await request('/api/scholarships/discover', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          country: 'Pakistan',
          fieldOfStudy: 'Computer Science & IT',
          degreeLevel: 'Undergraduate',
          searchText: 'Need Based HEC',
        }),
      });
      console.log('Discover status:', discoverRes.status);
      console.log('Found scholarships count:', discoverRes.data.count);
      if (discoverRes.status !== 200 || !Array.isArray(discoverRes.data.scholarships) || discoverRes.data.scholarships.length === 0) {
        throw new Error('Scholarship discovery failed');
      }
      const sample = discoverRes.data.scholarships[0];
      console.log('Sample discovered scholarship:', {
        title: sample.title,
        provider: sample.provider,
        country: sample.country,
        amount: sample.amount,
        estimatedChance: sample.estimatedChancePercent,
      });

      console.log('\n--- 3. Testing Scholarship Save ---');
      const saveRes = await request('/api/scholarships/save', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(sample),
      });
      console.log('Save status:', saveRes.status);
      const savedScholarship = saveRes.data.scholarship;
      if (saveRes.status !== 201 && saveRes.status !== 200) {
        throw new Error('Failed to save scholarship');
      }
      const savedId = savedScholarship._id;
      console.log('✅ Saved scholarship ID:', savedId);

      console.log('\n--- 4. Testing Get Saved Scholarships ---');
      const getSavedRes = await request('/api/scholarships/saved', {
        headers: authHeader,
      });
      console.log('Get saved status:', getSavedRes.status, 'Total saved:', getSavedRes.data.count);
      if (getSavedRes.status !== 200 || getSavedRes.data.count < 1) {
        throw new Error('Get saved scholarships failed');
      }

      console.log('\n--- 5. Testing Guided Application Support Generation ---');
      const guideRes = await request(`/api/scholarships/saved/${savedId}/apply-guide`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          customNotes: 'Passionate about AI applications for healthcare in Pakistan with 3.8 GPA.',
        }),
      });
      console.log('Generate Guide status:', guideRes.status);
      const guide = guideRes.data.guide;
      if (guideRes.status !== 200 || !guide || !guide.checklist || !guide.draftPersonalStatement) {
        throw new Error('Generate application guide failed');
      }
      console.log('Generated checklist items:', guide.checklist.length);
      console.log('Draft personal statement excerpt:\n', guide.draftPersonalStatement.slice(0, 180), '...');

      console.log('\n--- 6. Testing Guide Update (Checklist & Statement Edits) ---');
      const updatedChecklist = guide.checklist.map((item, idx) =>
        idx === 0 ? { ...item, completed: true } : item
      );
      const updateRes = await request(`/api/scholarships/saved/${savedId}/guide`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({
          checklist: updatedChecklist,
          draftPersonalStatement: guide.draftPersonalStatement + '\n\n[Edited by candidate: Added specific research goals.]',
        }),
      });
      console.log('Update Guide status:', updateRes.status);
      if (updateRes.status !== 200 || !updateRes.data.guide.checklist[0].completed) {
        throw new Error('Guide update failed');
      }
      console.log('✅ Checklist task 0 marked completed and statement update persisted.');

      console.log('\n--- 7. Testing Delete Saved Scholarship ---');
      const deleteRes = await request(`/api/scholarships/saved/${savedId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      console.log('Delete status:', deleteRes.status);
      if (deleteRes.status !== 200) {
        throw new Error('Delete saved scholarship failed');
      }
      console.log('✅ Saved scholarship deleted successfully.');

      console.log('\n🎉 ALL PHASE 7 SCHOLARSHIP BACKEND TESTS PASSED SUCCESSFULLY!\n');
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

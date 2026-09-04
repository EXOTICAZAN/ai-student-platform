const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const app = require('../server/server');

const PORT = 5011;

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

      console.log('\n--- 1. Authenticating test student ---');
      const loginRes = await request('/api/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: 'course.student@pk.edu', name: 'Sara Khan' }),
      });
      const token = loginRes.data.token;
      if (!token) throw new Error('Failed to obtain auth token');
      const authHeader = { Authorization: `Bearer ${token}` };
      console.log('✅ Logged in as Sara Khan, Token acquired.');

      console.log('\n--- 2. Testing Course Recommendations ---');
      const recRes = await request('/api/courses/recommend', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          interests: ['Computer Science', 'Web Development'],
          skillLevel: 'Beginner',
        }),
      });
      console.log('Recommendations status:', recRes.status);
      console.log('Found courses count:', recRes.data.count);
      if (recRes.status !== 200 || !Array.isArray(recRes.data.recommendations) || recRes.data.recommendations.length === 0) {
        throw new Error('Course recommendations failed');
      }
      console.log('Sample recommendation:', recRes.data.recommendations[0].title);

      console.log('\n--- 3. Testing Step-by-Step Roadmap Generation ---');
      const roadmapRes = await request('/api/courses/roadmap', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          courseTitle: 'React & Tailwind CSS Frontend Mastery',
          skillLevel: 'Beginner',
          interest: 'Computer Science',
        }),
      });
      console.log('Generate roadmap status:', roadmapRes.status);
      const roadmap = roadmapRes.data.roadmap;
      if (roadmapRes.status !== 201 || !roadmap || !Array.isArray(roadmap.steps) || roadmap.steps.length < 3) {
        throw new Error('Roadmap generation failed');
      }
      const roadmapId = roadmap._id;
      console.log(`✅ Created roadmap with ${roadmap.steps.length} milestones. Sample step 1: "${roadmap.steps[0].title}"`);

      console.log('\n--- 4. Testing Step Completion Toggle ---');
      const stepRes = await request(`/api/courses/roadmap/${roadmapId}/step/1`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify({ completed: true }),
      });
      console.log('Step toggle status:', stepRes.status);
      if (stepRes.status !== 200 || !stepRes.data.step?.completed) {
        throw new Error('Step toggle failed');
      }
      console.log('✅ Step 1 marked complete.');

      console.log('\n--- 5. Testing Final Milestone Mastery Quiz Generation ---');
      const quizRes = await request(`/api/courses/roadmap/${roadmapId}/final-quiz`, {
        method: 'POST',
        headers: authHeader,
      });
      console.log('Final quiz generation status:', quizRes.status);
      const quiz = quizRes.data.quiz;
      if (quizRes.status !== 200 || !Array.isArray(quiz) || quiz.length < 3) {
        throw new Error('Final quiz generation failed');
      }
      console.log(`✅ Generated ${quiz.length} mastery quiz questions.`);

      console.log('\n--- 6. Testing Final Quiz Evaluation & Submission ---');
      const perfectAnswers = {};
      quiz.forEach((q, idx) => {
        perfectAnswers[idx] = q.correctIndex;
      });

      const submitRes = await request(`/api/courses/roadmap/${roadmapId}/submit-quiz`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          answers: perfectAnswers,
        }),
      });
      console.log('Submit quiz status:', submitRes.status);
      if (submitRes.status !== 200 || !submitRes.data.passed || submitRes.data.scorePercent < 70) {
        throw new Error('Quiz evaluation failed');
      }
      console.log(`✅ Final quiz passed with ${submitRes.data.scorePercent}% score!`);

      console.log('\n--- 7. Testing Get User Roadmaps ---');
      const listRes = await request('/api/courses/my-roadmaps', {
        headers: authHeader,
      });
      console.log('List status:', listRes.status, 'Total roadmaps:', listRes.data.count);
      if (listRes.status !== 200 || listRes.data.count < 1) {
        throw new Error('Listing roadmaps failed');
      }

      console.log('\n--- 8. Testing Delete Roadmap ---');
      const delRes = await request(`/api/courses/roadmap/${roadmapId}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      console.log('Delete status:', delRes.status);
      if (delRes.status !== 200) {
        throw new Error('Delete roadmap failed');
      }
      console.log('✅ Roadmap deleted successfully.');

      console.log('\n🎉 ALL PHASE 8 COURSE & ROADMAP TESTS PASSED SUCCESSFULLY!\n');
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

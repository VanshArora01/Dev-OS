const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_CLERK_ID = 'user_test_123';

async function test() {
    console.log('--- Subscription Verification System ---');

    try {
        // 1. Get Plans
        console.log('\n[1] Fetching Plans...');
        const plansRes = await axios.get(`${BASE_URL}/subscription/plans`);
        console.log('Plans:', plansRes.data.map(p => p.name).join(', '));

        // 2. Check Status (should create default starter)
        console.log('\n[2] Checking Status...');
        const statusRes = await axios.get(`${BASE_URL}/subscription/status?clerkId=${TEST_CLERK_ID}`);
        console.log('Current Plan:', statusRes.data.planName);
        console.log('Projects Used:', statusRes.data.projectsUsed);
        console.log('Remaining Projects:', statusRes.data.remainingProjects);

        // 3. Try to Create Project (should work as count is 0, limit is 2)
        console.log('\n[3] Creating Project 1...');
        const p1 = await axios.post(`${BASE_URL}/projects`, {
            clerkId: TEST_CLERK_ID,
            title: 'Test Project 1',
            userEmail: 'test@example.com',
            infraType: 'Urban Road'
        });
        console.log('Project 1 Created:', p1.data._id);

        // 4. Creating Project 2
        console.log('\n[4] Creating Project 2...');
        const p2 = await axios.post(`${BASE_URL}/projects`, {
            clerkId: TEST_CLERK_ID,
            title: 'Test Project 2',
            userEmail: 'test@example.com',
            infraType: 'Bridge'
        });
        console.log('Project 2 Created:', p2.data._id);

        // 5. Try to Create Project 3 (should fail)
        console.log('\n[5] Creating Project 3 (Expected to fail)...');
        try {
            await axios.post(`${BASE_URL}/projects`, {
                clerkId: TEST_CLERK_ID,
                title: 'Test Project 3',
                userEmail: 'test@example.com',
                infraType: 'Dam'
            });
            console.error('FAIL: Project 3 was created but should have been blocked');
        } catch (err) {
            console.log('SUCCESS: Blocked correctly -', err.response?.data?.error);
        }

        // 6. Subscribe to Pro
        console.log('\n[6] Subscribing to Pro...');
        const subRes = await axios.post(`${BASE_URL}/subscription/subscribe`, {
            clerkId: TEST_CLERK_ID,
            planName: 'pro'
        });
        console.log('Subscription Success:', subRes.data.message);
        console.log('Transaction ID:', subRes.data.payment.transactionId);

        // 7. Try to Create Project 3 again (should now work)
        console.log('\n[7] Creating Project 3 again...');
        const p3 = await axios.post(`${BASE_URL}/projects`, {
            clerkId: TEST_CLERK_ID,
            title: 'Test Project 3',
            userEmail: 'test@example.com',
            infraType: 'Dam'
        });
        console.log('Project 3 Created:', p3.data._id);

        // 8. Check PDF Export Block (Starter)
        const OTHER_USER = 'user_starter_456';
        console.log('\n[8] Checking PDF block for Starter user...');
        try {
            await axios.get(`${BASE_URL}/report/dummy_id/download?clerkId=${OTHER_USER}`);
            console.error('FAIL: PDF download was allowed for starter');
        } catch (err) {
            console.log('SUCCESS: PDF blocked for starter -', err.response?.data?.error);
        }

        console.log('\n--- VERIFICATION COMPLETE ---');
    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

test();

const axios = require('axios');

async function debugAccess() {
    try {
        console.log('1. Logging in as Super Admin...');
        const loginRes = await axios.post('http://localhost:3000/auth/login', {
            email: 'superadmin@alegapp.com',
            password: '123456' // Correct password from seed.service.ts
        });

        const token = loginRes.data.access_token;
        console.log('✅ Login successful. Token obtained.');

        console.log('2. Accessing /saas/industries...');
        const res = await axios.get('http://localhost:3000/saas/industries', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Success!', res.data);

    } catch (error) {
        if (error.response) {
            console.error('❌ Request Failed:', error.response.status, error.response.statusText);
            console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Check password in seed.service.ts -> it is '123456'
debugAccess();

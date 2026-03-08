const API_URL = 'http://127.0.0.1:3000';
const EMAIL = 'superadmin@alegapp.com';
const PASSWORD = '123456';

async function main() {
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const fs = require('fs');
        // ...
        const loginData = await loginRes.json();
        if (loginData.access_token) {
            console.log('Token received');
            fs.writeFileSync('token.txt', loginData.access_token);
        } else {
            // ...
            console.error('FAILED', loginData);
            process.exit(1);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();

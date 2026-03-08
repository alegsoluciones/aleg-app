async function run() {
    try {
        console.log("🔐 Logging in as Super Admin...");
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'superadmin@alegapp.com', password: '123456' })
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${await loginRes.text()}`);
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log("✅ Logged in.");

        console.log("🔄 Triggering Sync All...");
        const syncRes = await fetch('http://localhost:3000/tenants/admin/sync-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-tenant-slug': 'global-admin'
            }
        });

        const syncData = await syncRes.json();
        console.log("📊 Sync Result:", JSON.stringify(syncData, null, 2));

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

run();

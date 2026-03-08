
// scripts/test-suspension.js
// Native fetch (Node 18+)
const { DataSource } = require('../backend/node_modules/typeorm');

// DB Config from docker-compose/default
const DB_CONFIG = {
    type: 'mysql',
    host: 'localhost',
    port: 3307,
    username: 'root',
    password: 'root',
    database: 'aleg_global',
};

async function testSuspension() {
    console.log("🔒 TEST SUSPENSION PROTOCOL STARTED");

    // 0. Setup DB Connection
    const dataSource = new DataSource(DB_CONFIG);
    await dataSource.initialize();
    console.log("   ✅ DB Connected");

    // 1. Get Token (Solderma)
    let token;
    const loginRes = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'administradora@solderma.com', password: '123' })
    });

    // Auth Retry Logic
    if (loginRes.ok) {
        token = (await loginRes.json()).access_token;
    } else {
        // Try 123456
        const retry = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'administradora@solderma.com', password: '123456' })
        });
        if (retry.ok) {
            token = (await retry.json()).access_token;
        } else {
            console.error("   ❌ Login Failed");
            process.exit(1);
        }
    }
    console.log("   ✅ Token Obtained");

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': 'clinica-solderma',
        'Content-Type': 'application/json'
    };

    // 2. Initial Assessment (Should be ACTIVE)
    console.log("\n1️⃣  INITIAL STATE (ACTIVE)");
    const res1 = await fetch('http://localhost:3000/appointments?start=2024-01-01&end=2024-01-02', { headers });
    if (res1.ok || res1.status === 404) { // 404 is fine (no appointments), 403/401 is bad
        console.log("   ✅ Access Allowed (Expected)");
    } else {
        console.log(`   ❌ Access Blocked unexpectedly: ${res1.status}`); // Could be FeatureGuard if I didn't restore?
    }

    // 3. EXECUTE SUSPENSION
    console.log("\n2️⃣  EXECUTING SUSPENSION (SQL UPDATE)");
    await dataSource.query(`UPDATE tenant SET status = 'SUSPENDED' WHERE slug = 'clinica-solderma'`);
    console.log("   ⚠️ Tenant 'clinica-solderma' is now SUSPENDED.");

    // 4. VERIFY BLOCK (Should be 403 Forbidden)
    console.log("\n3️⃣  VERIFYING LOCKDOWN");
    const res2 = await fetch('http://localhost:3000/appointments?start=2024-01-01&end=2024-01-02', { headers });

    if (res2.status === 403) {
        const body = await res2.json();
        if (JSON.stringify(body).includes('ACCOUNT_SUSPENDED')) {
            console.log("   ✅ BLOCKED CORRECTLY: ACCOUNT_SUSPENDED");
        } else {
            console.log(`   ⚠️ Blocked but wrong message: ${JSON.stringify(body)}`);
        }
    } else {
        console.log(`   ❌ FAILED: Access status is ${res2.status} (Expected 403)`);
    }

    // 5. VERIFY WHITELIST (Config/Billing)
    console.log("\n4️⃣  VERIFYING ESCAPE ROUTE (Whitelist)");
    const res3 = await fetch('http://localhost:3000/tenants/config', { headers }); // Whitelisted
    if (res3.ok) {
        console.log("   ✅ Config/Billing Access Allowed (Whitelisted)");
    } else {
        console.log(`   ❌ FAILED: Whitelist blocked (${res3.status})`);
    }

    // 6. RESTORE
    console.log("\n5️⃣  RESTORING SERVICE");
    await dataSource.query(`UPDATE tenant SET status = 'ACTIVE' WHERE slug = 'clinica-solderma'`);
    console.log("   ✅ Tenant restored to ACTIVE.");

    // 7. FINAL CHECK
    const res4 = await fetch('http://localhost:3000/appointments?start=2024-01-01&end=2024-01-02', { headers });
    if (res4.ok) {
        console.log("   ✅ Service Restored.");
    } else {
        console.log(`   ❌ Service NOT Restored: ${res4.status}`);
    }

    await dataSource.destroy();
    process.exit(0);
}

testSuspension();

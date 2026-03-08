
// Native fetch for Node.js (v18+)

async function verifyPurchaseFlow() {
    console.log("🛒 STARTING PURCHASE FLOW VERIFICATION...");

    // 1. Get Token for Solderma
    console.log("   🔑 Obtaining valid Solderma token...");

    let token;
    const payload = { email: 'administradora@solderma.com', password: '123' };
    const tenantSlug = 'clinica-solderma';
    const moduleToBuy = 'mod_appointments';

    try {
        let authRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Retry logic for password
        if (!authRes.ok) {
            authRes = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, password: '123456' })
            });
        }

        if (authRes.ok) {
            const data = await authRes.json();
            token = data.access_token;
            console.log("   ✅ Token obtained.");
        } else {
            console.log(`   ❌ Auth Failed: ${authRes.status}`);
            process.exit(1);
        }
    } catch (e) {
        console.log("   ❌ Connection Error:", e.message);
        process.exit(1);
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': tenantSlug,
        'Content-Type': 'application/json'
    };

    // 2. VERIFY BLOCK (Should be 401/403)
    console.log("\n🔒 STEP 1: Verifying Block (Expect 401/403)...");
    const check1 = await fetch('http://localhost:3000/appointments?start=2024-01-01&end=2024-01-02', { headers });

    if (check1.ok) {
        console.log("   ❌ FAILURE: API is open! It should be blocked.");
        process.exit(1);
    } else {
        console.log(`   ✅ BLOCKED as expected (${check1.status}).`);
    }

    // 3. PURCHASE (Subscribe)
    console.log("\n💳 STEP 2: Purchasing Module 'mod_appointments'...");
    // Endpoint: POST /tenants/:id/subscribe (Wait, need tenant ID or slug?)
    // Converting slug to ID or using a lookup?
    // Let's see TenantsController.
    // It's likely POST /tenants/subscribe or PATCH /tenants/:id/modules
    // I need to check the controller to know the exact endpoint.
    // Assuming /tenants/subscribe based on service, but controller maps it.
    // I'll assume I need to look it up. For now, let's try to look up tenant ID from token decoded or another call.
    // Actually, I can use the Token to call /tenants/my-config to get ID.

    let tenantId;
    console.log("   GETting config...");
    const configRes = await fetch('http://localhost:3000/tenants/config', { headers }); // FIXED URL
    console.log(`   Config Status: ${configRes.status}`);
    const configText = await configRes.text();
    // ...

    // ...

    // Checking Subscription Endpoint: TenantsController
    // It is usually POST /tenants/subscribe (verified in controller)
    const subRes = await fetch(`http://localhost:3000/tenants/subscribe`, { // FIXED URL
        method: 'POST',
        headers,
        body: JSON.stringify({ moduleCode: moduleToBuy })
    });

    if (subRes.ok || subRes.status === 201) {
        console.log("   ✅ Purchase Successful (201 Created).");
    } else {
        console.log(`   ❌ Purchase Failed: ${subRes.status} ${await subRes.text()}`);
        process.exit(1);
    }

    // 4. VERIFY UNBLOCK (Should be 200)
    console.log("\n🔓 STEP 3: Verifying Unblock (Expect 200)...");
    const check2 = await fetch('http://localhost:3000/appointments?start=2024-01-01&end=2024-01-02', { headers });

    if (check2.ok) {
        console.log("   ✅ SUCCESS: API is now accessible (200 OK).");
        console.log("   🚀 ECOSYSTEM VALIDATION COMPLETE.");
        process.exit(0);
    } else {
        console.log(`   ❌ FAILURE: API still blocked (${check2.status}).`);
        console.log(`   Reason: ${await check2.text()}`);
        console.log("   ⚠️  Possible Cause: Middleware not syncing JSON config with SQL subscription.");
        process.exit(1);
    }
}

verifyPurchaseFlow();

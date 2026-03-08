
// scripts/test-backup.js
// Use native fetch (Node 18+)
const fs = require('fs');
const path = require('path');

async function testBackup() {
    console.log("📦 TEST BACKUP STARTED");

    // 1. Login as Solderma (Tenant Admin)
    let token;
    const loginPayload = { email: 'administradora@solderma.com', password: '123' };

    // RETRY LOOP
    let attempts = 0;
    while (attempts < 20) {
        try {
            process.stdout.write(`   🔄 Attempt ${attempts + 1} connecting... `);
            let authRes = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginPayload)
            });

            if (!authRes.ok) {
                authRes = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...loginPayload, password: '123456' })
                });
            }

            if (authRes.ok) {
                token = (await authRes.json()).access_token;
                console.log("✅ OK");
                break;
            } else {
                console.log(`❌ Failed: ${authRes.status}`);
            }
        } catch (e) {
            console.log(`⏳ Waiting (${e.code || e.message})...`);
            await new Promise(r => setTimeout(r, 3000));
        }
        attempts++;
    }

    if (!token) {
        console.log("   ❌ Login Failed. Server Down?");
        process.exit(1);
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': 'clinica-solderma'
    };

    // 2. Request Backup
    console.log("   📥 Requesting Backup Stream...");
    const backupRes = await fetch('http://localhost:3000/backup/download/full', { headers });

    if (backupRes.ok) {
        console.log(`   ✅ Backup Response: ${backupRes.status} OK`);

        // Save Stream to File
        const destPath = path.join(__dirname, 'backup_solderma_test.zip');
        const fileStream = fs.createWriteStream(destPath);

        const arrayBuffer = await backupRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        fs.writeFileSync(destPath, buffer);
        console.log(`   💾 Saved to: ${destPath}`);
        console.log(`   📦 Size: ${(buffer.length / 1024).toFixed(2)} KB`);

        // Optional: Verify Magic Bytes (PK..)
        if (buffer.toString('hex', 0, 4) === '504b0304') {
            console.log("   ✅ Valid ZIP Magic Bytes Detected.");
        } else {
            console.log("   ⚠️  Warning: File might not be a valid ZIP.");
        }

    } else {
        console.log(`   ❌ Backup Failed: ${backupRes.status} ${await backupRes.text()}`);
        process.exit(1);
    }
}

testBackup();

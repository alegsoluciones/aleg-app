const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function auditTrash() {
    try {
        console.log('🔐 Authenticating...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-slug': 'global-admin' },
            body: JSON.stringify({ email: 'superadmin@alegapp.com', password: '123456' })
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.accessToken || loginData.token || loginData.access_token;

        console.log('🧪 1. Create Patient');
        const uniqueDni = `TRASH${Date.now()}`;
        const patientRes = await fetch(`${BASE_URL}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-slug': 'global-admin', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: `Trash Tester ${uniqueDni}`, dni: uniqueDni })
        });
        const patient = await patientRes.json();
        console.log(`   Patient ID: ${patient.id} (UUID)`);

        console.log('🧪 2. Create Visit (Record)');
        const visitDate = new Date().toISOString().split('T')[0];
        const recordRes = await fetch(`${BASE_URL}/patients/${patient.id}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-tenant-slug': 'global-admin', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                date: visitDate,
                title: 'Trash Test Visit',
                notes: 'This note should end up in the trash.'
            })
        });
        const record = await recordRes.json();
        const visitDateStr = record.date.split('T')[0]; // Use RETURNED date
        console.log(`   Record ID: ${record.id}`);
        console.log(`   Record Date (Raw): ${record.date}`);
        console.log(`   Record Date (Parsed): ${visitDateStr}`);

        // Verify physical folder existence IMMEDIATELY
        const patientPath = path.join(__dirname, `../backend/storage/global-admin/${patient.id}`);
        console.log(`   Checking Patient Folder: ${patientPath}`);
        if (fs.existsSync(patientPath)) {
            console.log(`   Contents: ${fs.readdirSync(patientPath)}`);
        } else {
            console.log(`   ❌ Patient Folder NOT FOUND!`);
        }

        const visitPath = path.join(patientPath, visitDateStr);
        console.log(`   Expected Visit Path: ${visitPath}`);
        if (fs.existsSync(visitPath)) {
            console.log('   ✅ Visit Path EXISTS');
        } else {
            console.log('   ❌ Visit Path DOES NOT EXIST');
            // List parent folder
            const parentPath = path.join(__dirname, `../backend/storage/global-admin/${patient.id}`);
            if (fs.existsSync(parentPath)) {
                console.log(`   Parent contents: ${fs.readdirSync(parentPath)}`);
            }
        }
        if (!fs.existsSync(visitPath)) {
            // Force create it to simulate existing attachment folder if it wasn't auto-created (Storage logic creates it on demand usually)
            // But our current patients service sync logic might trigger it?
            // Actually, createRecord calls syncRecordJson -> getSecurePath(create=true) -> mkdir.
            // So it SHOULD exist if creation happened. 
            // Let's force check and create if missing to strictly test move logic (even though empty folder move depends on os)
            console.log('   ⚠️ Visit folder not auto-created (maybe no attachments). Forcing creation for test.');
            fs.mkdirSync(visitPath, { recursive: true });
        }
        console.log('   ✅ Visit folder exists.');

        console.log('🧪 3. Delete Visit');
        const delRes = await fetch(`${BASE_URL}/patients/${patient.id}/records/${record.id}`, {
            method: 'DELETE',
            headers: { 'x-tenant-slug': 'global-admin', 'Authorization': `Bearer ${token}` }
        });

        if (!delRes.ok) {
            const errText = await delRes.text();
            throw new Error(`Delete Failed: ${delRes.status} - ${errText}`);
        }
        console.log('   ✅ Visit Deleted from DB.');

        console.log('🔎 4. Verify Trash');
        const trashPath = path.join(__dirname, `../backend/storage/global-admin/_TRASH_/${patient.id}/VISIT_${record.id}_${visitDateStr}`);

        if (fs.existsSync(trashPath)) {
            console.log(`✅ SUCCESS: Trash folder found at: ${trashPath}`);
        } else {
            console.error(`❌ FAILURE: Trash folder NOT found at: ${trashPath}`);
            const trashRoot = path.join(__dirname, `../backend/storage/global-admin/_TRASH_`);
            if (fs.existsSync(trashRoot)) {
                console.log('Listing Trash Root:', fs.readdirSync(trashRoot));
            }
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}

auditTrash();

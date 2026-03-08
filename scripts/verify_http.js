const http = require('http');
const fs = require('fs');
const path = require('path');

const TOKEN = fs.readFileSync('token.txt', 'utf-8').trim();
const TENANT_SLUG = 'clinica-solderma';

function request(method, pathStr, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: pathStr,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) { resolve(data); }
                } else {
                    reject(`Request failed: ${res.statusCode} ${data}`);
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    try {
        console.log('🚀 HTTP VERIFY START');

        // 1. Get Tenant ID
        const tenants = await request('GET', '/tenants');
        const target = tenants.find(t => t.slug === TENANT_SLUG);
        if (!target) throw new Error('Tenant not found');
        const TENANT_ID = target.id;
        console.log(`✅ Tenant ID: ${TENANT_ID}`);

        // 2. Create Patient
        const patient = await request('POST', '/patients', {
            name: "Test HTTP Subject",
            dni: "22222222",
            email: "http@test.com"
        }, { 'x-tenant-id': TENANT_ID });
        console.log(`✅ Created: ${patient.name} (${patient.id})`);

        // 3. Inject Data
        const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const fileName = `INFO_${patient.internalId}_${safeName}.json`;
        const filePath = path.join(process.cwd(), 'backend', 'storage', TENANT_SLUG, patient.id, fileName);

        if (!fs.existsSync(filePath)) throw new Error('File not created');

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        content.INJECTED = "SURVIVED_HTTP";
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log('✅ Data Injected');

        // 4. Rename
        const NEW_NAME = "Test HTTP Renamed";
        const updated = await request('PATCH', `/patients/${patient.id}`, {
            name: NEW_NAME
        }, { 'x-tenant-id': TENANT_ID });
        console.log(`✅ Renamed to: ${updated.name}`);

        // 5. Verify
        const newSafeName = NEW_NAME.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const newFileName = `INFO_${patient.internalId}_${newSafeName}.json`;
        const newFilePath = path.join(process.cwd(), 'backend', 'storage', TENANT_SLUG, patient.id, newFileName);

        if (!fs.existsSync(newFilePath)) throw new Error('New file missing');
        if (fs.existsSync(filePath)) console.warn('⚠️ Old file still exists (Trash failed?)'); // Should be gone/moved

        const newContent = JSON.parse(fs.readFileSync(newFilePath, 'utf-8'));
        if (newContent.INJECTED === 'SURVIVED_HTTP') {
            console.log('🏆 SUCCESS: Data Persisted!');
        } else {
            console.error('❌ FAIL: Data lost');
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ FATAL:', e);
        process.exit(1);
    }
}

main();

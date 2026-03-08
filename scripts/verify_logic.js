const fs = require('fs');
const path = require('path');

const API_URL = 'http://127.0.0.1:3000';
const TENANT_SLUG = 'clinica-solderma';

async function main() {
    try {
        console.log('🚀 Iniciando verificación lógica...');

        // 1. Read Token
        const token = fs.readFileSync('token.txt', 'utf-8').trim();
        console.log('✅ Token leído.');

        // 2. Get Tenant
        const tenantsRes = await fetch(`${API_URL}/tenants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tenants = await tenantsRes.json();
        const targetTenant = tenants.find(t => t.slug === TENANT_SLUG);
        if (!targetTenant) throw new Error('Tenant not found');
        const TENANT_ID = targetTenant.id;

        // 3. Create Patient
        const createRes = await fetch(`${API_URL}/patients`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-tenant-id': TENANT_ID
            },
            body: JSON.stringify({
                name: "Test Plastic Manual",
                dni: "11111111",
                email: "plastic@test.com"
            })
        });
        const patient = await createRes.json();
        console.log(`✅ Paciente creado: ${patient.name} (${patient.id})`);

        // 4. Inject
        const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const fileName = `INFO_${patient.internalId}_${safeName}.json`;
        const filePath = path.join(process.cwd(), 'backend', 'storage', TENANT_SLUG, patient.id, fileName);

        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        content.INJECTED_DATA = "SURVIVED";
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log('✅ Data inyectada en JSON.');

        // 5. Update (Rename)
        const NEW_NAME = "Test Plastic Renamed";
        const updateRes = await fetch(`${API_URL}/patients/${patient.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-tenant-id': TENANT_ID
            },
            body: JSON.stringify({ name: NEW_NAME })
        });
        const updated = await updateRes.json();
        console.log(`✅ Paciente renombrado a: ${updated.name}`);

        // 6. Verify
        const newSafeName = NEW_NAME.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const newFileName = `INFO_${patient.internalId}_${newSafeName}.json`;
        const newFilePath = path.join(process.cwd(), 'backend', 'storage', TENANT_SLUG, patient.id, newFileName);

        if (!fs.existsSync(newFilePath)) throw new Error('New file missing');
        if (fs.existsSync(filePath)) console.warn('⚠️ Archivo viejo aun existe (Trash check manual required if not moved)'); // It SHOULD be moved.

        const newContent = JSON.parse(fs.readFileSync(newFilePath, 'utf-8'));
        if (newContent.INJECTED_DATA === 'SURVIVED') {
            console.log('🏆 SUCCESS: Injected data survived!');
        } else {
            console.error('❌ FAIL: Data lost.');
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ ERROR:', e);
        process.exit(1);
    }
}
main();

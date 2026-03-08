
const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.join(__dirname, '../backend/storage');
const TENANT_SLUG = 'clinica-solderma';

function createDummyData() {
    console.log(`🌱 Seeding Storage for ${TENANT_SLUG}...`);

    const tenantDir = path.join(STORAGE_ROOT, TENANT_SLUG);
    if (!fs.existsSync(tenantDir)) {
        fs.mkdirSync(tenantDir, { recursive: true });
        console.log(`   📂 Created: ${tenantDir}`);
    }

    // Patient 1: Juana De Arco (Historic)
    const p1Uuid = 'uuid-juana-de-arco-123';
    const p1Dir = path.join(tenantDir, p1Uuid);
    fs.mkdirSync(p1Dir, { recursive: true });

    const p1Info = {
        internalId: 'HC-001',
        firstName: 'Juana',
        lastName: 'De Arco',
        birthDate: '1412-01-06'
    };
    fs.writeFileSync(path.join(p1Dir, 'INFO_HC-001_JUANA.json'), JSON.stringify(p1Info, null, 2));
    fs.writeFileSync(path.join(p1Dir, 'historia.txt'), 'Paciente presenta quemaduras...');
    console.log(`   👤 Created Patient: Juana De Arco`);

    // Patient 2: John Doe (Anonymous)
    const p2Uuid = 'uuid-john-doe-456';
    const p2Dir = path.join(tenantDir, p2Uuid);
    fs.mkdirSync(p2Dir, { recursive: true });

    const p2Info = {
        internalId: 'HC-002',
        firstName: 'John',
        lastName: 'Doe'
    };
    fs.writeFileSync(path.join(p2Dir, 'INFO_HC-002_JOHN.json'), JSON.stringify(p2Info, null, 2));
    console.log(`   👤 Created Patient: John Doe`);

    console.log("✅ Seed Complete.");
}

createDummyData();

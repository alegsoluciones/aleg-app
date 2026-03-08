const fs = require('fs');
const path = require('path');

// CONFIG
const API_URL = 'http://127.0.0.1:3000'; // Force IPv4
const EMAIL = 'superadmin@alegapp.com';
const PASSWORD = '123456';
const TENANT_SLUG = 'clinica-solderma'; // Target Tenant

async function main() {
    try {
        console.log('🧪 INICIANDO PROTOCOLO DE PRUEBA: PLASTIC SURGERY');
        console.log('------------------------------------------------');

        // 1. LOGIN
        console.log('🔑 Autenticando...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginData.access_token) {
            console.error('❌ Error de Login:', loginData);
            process.exit(1);
        }
        const token = loginData.access_token;
        console.log('✅ Login Exitoso');

        // 2. GET TENANT ID
        // We need the ID for the header usually, or just use the slug derived from user?
        // The backend middleware uses x-tenant-id or defaults?
        // SuperAdmin can access any tenant.
        // Let's get the tenant list to find local Solderma ID.
        const tenantsRes = await fetch(`${API_URL}/tenants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tenants = await tenantsRes.json();
        const targetTenant = tenants.find(t => t.slug === TENANT_SLUG);

        if (!targetTenant) {
            console.error(`❌ Tenant '${TENANT_SLUG}' no encontrado.`);
            process.exit(1);
        }
        const TENANT_ID = targetTenant.id;
        console.log(`🏢 Tenant ID: ${TENANT_ID} (${TENANT_SLUG})`);

        // 3. CREATE PATIENT
        console.log('CREATE: Generando Paciente de Prueba...');
        const createRes = await fetch(`${API_URL}/patients`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-tenant-id': TENANT_ID
            },
            body: JSON.stringify({
                name: "Test Subject Alpha",
                dni: "99999999",
                email: "test@alpha.com"
            })
        });
        const patient = await createRes.json();
        if (!patient.id) {
            console.error('❌ Error creando paciente:', patient);
            process.exit(1);
        }
        console.log(`✅ Paciente Creado: ${patient.name} (ID: ${patient.id})`);

        // 4. LOCATE & INJECT SECRET DATA
        // Path: storage/clinica-solderma/{UUID}/INFO_HC-XXXX_TEST_SUBJECT_ALPHA.json
        const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const fileName = `INFO_${patient.internalId}_${safeName}.json`;
        const filePath = path.join(process.cwd(), 'backend', 'storage', TENANT_SLUG, patient.id, fileName);

        console.log(`📂 Buscando archivo: ${fileName}`);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Archivo JSON no encontrado en FS: ${filePath}`);
            // Wait minor delay?
            process.exit(1);
        }

        console.log('💉 Inyectando datos manuales (simulando edición humana en FS)...');
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fileContent.secret_data = "I WILL SURVIVE";
        fileContent.manual_note = "Do not delete me";
        fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
        console.log('✅ Datos inyectados.');

        // 5. UPDATE PATIENT (RENAME)
        console.log('🔄 UPDATE: Renombrando paciente (Trigger Plastic Surgery)...');
        const NEW_NAME = "Test Subject Beta";
        const updateRes = await fetch(`${API_URL}/patients/${patient.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-tenant-id': TENANT_ID
            },
            body: JSON.stringify({
                name: NEW_NAME,
                occupation: "Survivor"
            })
        });
        const updatedPatient = await updateRes.json();
        console.log(`✅ Update respuesta: ${updatedPatient.name}`);

        // 6. VALIDATE RESULTS
        console.log('🔍 Validando resultados...');

        // A. Check Old File Gone
        if (fs.existsSync(filePath)) {
            console.error('❌ FALLO: El archivo viejo NO fue eliminado/rotado.');
            // process.exit(1); // Don't exit yet, check new file
        } else {
            console.log('✅ OK: Archivo viejo desaparecido.');
        }

        // B. Check New File Exists
        const newSafeName = NEW_NAME.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        const newFileName = `INFO_${patient.internalId}_${newSafeName}.json`;
        const newFilePath = path.join(process.cwd(), 'backend', 'storage', TENANT_SLUG, patient.id, newFileName);

        if (!fs.existsSync(newFilePath)) {
            console.error(`❌ FALLO: El nuevo archivo NO existe: ${newFileName}`);
            process.exit(1);
        } else {
            console.log(`✅ OK: Nuevo archivo creado: ${newFileName}`);
        }

        // C. Check Data Survival (Merge)
        const newContent = JSON.parse(fs.readFileSync(newFilePath, 'utf-8'));

        if (newContent.secret_data === "I WILL SURVIVE" && newContent.manual_note === "Do not delete me") {
            console.log('🏆 ÉXITO TOTAL: Los datos manuales sobrevivieron al renombramiento!');
            console.log('   Dato preservado 1:', newContent.secret_data);
            console.log('   Dato preservado 2:', newContent.manual_note);
        } else {
            console.error('❌ FALLO CRÍTICO: Los datos manuales se perdieron.');
            console.log('Contenido actual:', newContent);
            process.exit(1);
        }

        // CLEANUP (Optional)
        // await fetch(`${API_URL}/patients/${patient.id}`, { method: 'DELETE', headers: ... });
    } catch (error) {
        console.error('❌ Error fatal en la prueba:', error);
        process.exit(1);
    }
}

main();

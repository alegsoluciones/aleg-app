const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------
// 1. MOCKED SERVICE CONTEXT
// ---------------------------------------------------------
class StorageService {
    constructor() {
        this.STORAGE_ROOT = path.join(process.cwd(), 'storage_test_env');
        this.logger = console;
        if (!fs.existsSync(this.STORAGE_ROOT)) fs.mkdirSync(this.STORAGE_ROOT, { recursive: true });
    }

    getSecurePath(tenantSlug, patientId, name) {
        // Mocking the getSecurePath logic from real service
        const patientFolder = patientId; // We use ID as folder
        const fullPath = path.join(this.STORAGE_ROOT, tenantSlug, patientFolder);
        if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
        return { fullPath };
    }

    // 👇 THE ACTUAL CODE COPIED FROM StorageService.ts 👇
    rotatePatientInfo(tenantSlug, patientInternalId, patientId) {
        if (!tenantSlug || !patientInternalId || !patientId) return null;

        const { fullPath } = this.getSecurePath(tenantSlug, patientId, ''); // Path to patient root
        if (!fs.existsSync(fullPath)) return null;

        // 1. Search for existing INFO file
        const files = fs.readdirSync(fullPath);
        const infoFile = files.find(f => f.startsWith(`INFO_${patientInternalId}_`) && f.endsWith('.json'));

        if (!infoFile) return null;

        const currentFilePath = path.join(fullPath, infoFile);
        let oldContent = null;

        try {
            // 2. Read Content (Preservation)
            const raw = fs.readFileSync(currentFilePath, 'utf-8');
            oldContent = JSON.parse(raw);
        } catch (e) {
            this.logger.error(`Error reading old info file ${infoFile}: ${e.message}`);
        }

        // 3. Move to Trash (Soft Delete)
        const trashName = `${infoFile}.replaced_${Date.now()}`;
        const trashPath = path.join(this.STORAGE_ROOT, tenantSlug, '_TRASH_', patientId, trashName);

        try {
            if (!fs.existsSync(path.dirname(trashPath))) {
                fs.mkdirSync(path.dirname(trashPath), { recursive: true });
            }
            fs.renameSync(currentFilePath, trashPath);
            this.logger.log(`♻️ Rotated Info File: ${infoFile} -> ${trashName}`);
        } catch (e) {
            this.logger.error(`Error rotating info file: ${e.message}`);
        }

        return oldContent;
    }
}

// ---------------------------------------------------------
// 2. TEST EXECUTION
// ---------------------------------------------------------
async function main() {
    console.log('🧪 TESTING PLASTIC SURGERY ALGORITHM');
    const service = new StorageService();
    const TENANT = 'test-tenant';
    const ID = 'uuid-patient-1';
    const INTERNAL = 'HC-001';

    // A. Setup State (Old Name)
    const { fullPath } = service.getSecurePath(TENANT, ID, '');
    const oldFile = `INFO_${INTERNAL}_JUAN_PEREZ.json`;
    const data = { name: "Juan", secret: "I SURVIVED" };
    fs.writeFileSync(path.join(fullPath, oldFile), JSON.stringify(data));
    console.log(`✅ State A: File exists (${oldFile})`);

    // B. Execute Rotation
    console.log('🔄 Triggering Rotation...');
    const preserved = service.rotatePatientInfo(TENANT, INTERNAL, ID);

    // C. Verify Preservation
    if (preserved && preserved.secret === 'I SURVIVED') {
        console.log('🏆 SUCCESS: Data returned for merge.');
    } else {
        console.error('❌ FAIL: Data lost.');
        process.exit(1);
    }

    // D. Verify FS Cleanup
    if (fs.existsSync(path.join(fullPath, oldFile))) {
        console.error('❌ FAIL: Old file not moved.');
        process.exit(1);
    } else {
        console.log('✅ OK: Old file removed from root.');
    }

    // E. Verify Trash
    const trashPath = path.join(service.STORAGE_ROOT, TENANT, '_TRASH_', ID);
    const trashFiles = fs.readdirSync(trashPath);
    if (trashFiles.some(f => f.includes('JUAN_PEREZ'))) {
        console.log('✅ OK: Found in Trash.');
    } else {
        console.error('❌ FAIL: Not found in trash.');
        process.exit(1);
    }

    // Cleanup
    fs.rmSync(service.STORAGE_ROOT, { recursive: true, force: true });
}

main();

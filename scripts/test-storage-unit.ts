const fs = require('fs');
const path = require('path');

// MOCK LOGGER
class MockLogger {
    log(msg) { console.log('[LOG]', msg); }
    error(msg) { console.error('[ERR]', msg); }
    warn(msg) { console.warn('[WARN]', msg); }
}

// MOCK NESTJS COMMON
const common = {
    Injectable: () => { },
    Logger: MockLogger,
    BadRequestException: class extends Error { },
    NotFoundException: class extends Error { }
};

// LOAD STORAGE SERVICE CLASS
// We need to read the file and eval it, or require it if it was JS. It's TS.
// Since we are in dev environment with 'ts-node' likely available (npm run dev uses it), 
// we could try running with ts-node.
// But simpler: I'll manually implement the test logic matching the service logic to verify the script 
// OR I can use 'ts-node' to run a TS test file.

// User has `npm run dev` running, so `ts-node` is likely installed.
// I will create `scripts/test-storage-unit.ts` and run it with `npx ts-node scripts/test-storage-unit.ts`.

import { StorageService } from '../backend/src/common/services/storage.service';

async function main() {
    console.log('🧪 UNIT TEST: StorageService.rotatePatientInfo');

    // 1. Setup
    const service = new StorageService();
    // Override logger for visibility if needed, but default instantiates new Logger? 
    // StorageService does `private readonly logger = new Logger(StorageService.name);`
    // If I run via ts-node, NestJS common must be resolvable.

    const TENANT = 'test-unit-tenant';
    const ID = 'uuid-123';
    const INTERNAL_ID = 'HC-TEST';

    // 2. Prepare FS
    const root = path.join(process.cwd(), 'storage');
    const patientDir = path.join(root, TENANT, ID);

    if (fs.existsSync(patientDir)) fs.rmSync(patientDir, { recursive: true, force: true });
    fs.mkdirSync(patientDir, { recursive: true });

    // 3. Create Source File
    const oldName = `INFO_${INTERNAL_ID}_OLD_NAME.json`;
    const oldPath = path.join(patientDir, oldName);
    const originalContent = { data: 'IMPORTANT_DATA' };
    fs.writeFileSync(oldPath, JSON.stringify(originalContent));
    console.log('✅ Created source file:', oldName);

    // 4. Run Rotation
    console.log('🔄 Executing Rotation...');
    const result = service.rotatePatientInfo(TENANT, INTERNAL_ID, ID);

    // 5. Verify Content
    if (result && result.data === 'IMPORTANT_DATA') {
        console.log('✅ Content preserved in return value.');
    } else {
        console.error('❌ Content LOST or not returned.', result);
        process.exit(1);
    }

    // 6. Verify Move
    if (fs.existsSync(oldPath)) {
        console.error('❌ Old file still exists!');
        process.exit(1);
    } else {
        console.log('✅ Old file moved from source.');
    }

    // 7. Verify Trash
    const trashRoot = path.join(root, TENANT, '_TRASH_', ID);
    if (!fs.existsSync(trashRoot)) {
        console.error('❌ Trash folder not created');
        process.exit(1);
    }
    const trashFiles = fs.readdirSync(trashRoot);
    if (trashFiles.length > 0) {
        console.log('✅ File found in Trash:', trashFiles[0]);
    } else {
        console.error('❌ Trash empty');
        process.exit(1);
    }

    console.log('🏆 UNIT TEST PASSED');

    // Cleanup
    fs.rmSync(path.join(root, TENANT), { recursive: true, force: true });
}

main().catch(e => console.error(e));


const mysqldump = require('mysqldump');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');

// 1. Load Environment
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'aleg_global',
    port: parseInt(process.env.DB_PORT || '3306')
};

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const TEMP_DIR = path.join(__dirname, '../temp');
const BACKUP_DIR = path.join(__dirname, '../backups/ready_to_upload');
const STORAGE_DIR = path.join(__dirname, '../backend/storage'); // Adjust path
const CORE_FILES = [
    path.join(__dirname, '../backend/.env'), // Fixed path
    path.join(__dirname, '../backend/ormconfig.json'),
    path.join(__dirname, '../package.json'),
    path.join(__dirname, '../backend/package.json')
];

async function generateFullBackup() {
    console.log(`🚀 STARTING FULL SYSTEM BACKUP [${TIMESTAMP}]`);
    console.log(`   📂 Backup Dir: ${BACKUP_DIR}`);

    // Ensure Dirs
    fs.ensureDirSync(TEMP_DIR);
    fs.ensureDirSync(BACKUP_DIR);

    // ETAPA 1: SQL DUMP
    const sqlFile = path.join(TEMP_DIR, `dump_${TIMESTAMP}.sql`);
    try {
        console.log("   💾 Dumping Database...");
        await mysqldump({
            connection: DB_CONFIG,
            dumpToFile: sqlFile,
            compressFile: false, // We zip later
        });
        console.log("   ✅ Database Dump Created.");
    } catch (e) {
        console.error("   ❌ DB Dump Failed:", e);
        process.exit(1);
    }

    // ETAPA 2 & 3: ZIPPING (Sequential to avoid memory spike)
    const coreZipPath = path.join(BACKUP_DIR, `BACKUP_CORE_${TIMESTAMP}.zip`);
    await createZip('CORE', coreZipPath, (archive) => {
        archive.file(sqlFile, { name: 'database_dump.sql' });
        CORE_FILES.forEach(f => {
            if (fs.existsSync(f)) archive.file(f, { name: path.basename(f) });
        });
    });

    const storageZipPath = path.join(BACKUP_DIR, `BACKUP_STORAGE_${TIMESTAMP}.zip`);
    if (fs.existsSync(STORAGE_DIR)) {
        await createZip('STORAGE', storageZipPath, (archive) => {
            archive.glob('**/*', {
                cwd: STORAGE_DIR,
                ignore: ['**/_TRASH_/**', '**/.tmp/**']
            }, { prefix: 'storage' });
        });
    }

    // ETAPA 4: CLEANUP
    console.log("   🧹 Cleaning up temp files...");
    // Force garbage collection hint (not real GC) or delay to release lock
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        fs.removeSync(sqlFile);
    } catch (e) {
        console.warn(`   ⚠️ Could not delete temp SQL (File Locked?): ${e.message}`);
    }

    console.log(`\n✨ BACKUP COMPLETE!`);
    console.log(`   1️⃣  ${path.basename(coreZipPath)}`);
    if (fs.existsSync(storageZipPath)) console.log(`   2️⃣  ${path.basename(storageZipPath)}`);
}

function createZip(label, outputPath, setupArchive) {
    return new Promise((resolve, reject) => {
        console.log(`   📦 Zipping ${label}...`);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            const size = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`      ✅ ${label} Zip Created (${size} MB)`);
            resolve();
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        setupArchive(archive);
        archive.finalize();
    });
}

generateFullBackup();

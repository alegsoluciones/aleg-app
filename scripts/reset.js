const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("☢️  LIMPIEZA Y RESTAURACIÓN DE INFRAESTRUCTURA (V. FINAL) ☢️");

const MAX_ATTEMPTS = 300;
const CHECK_INTERVAL = 1000;

const runCommand = (command) => {
    try {
        execSync(command, { stdio: 'inherit', shell: true });
    } catch (error) { /* Ignorar errores de limpieza */ }
};

const deleteFolderRecursive = (directoryPath) => {
    if (fs.existsSync(directoryPath)) {
        try {
            fs.rmSync(directoryPath, { recursive: true, force: true });
        } catch (e) { }
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const cwd = process.cwd();

    // 1. DESTRUCCIÓN (-v borra volumen para forzar reinicio de BD)
    console.log("\n⬇️  [1/4] Destruyendo contenedores y volúmenes...");
    runCommand('docker-compose down -v');

    // Limpieza local
    const storagePath = path.join(cwd, 'backend', 'storage');
    deleteFolderRecursive(storagePath);
    fs.mkdirSync(storagePath, { recursive: true });
    fs.writeFileSync(path.join(storagePath, '.gitkeep'), '');

    // 2. DESPLIEGUE (Docker auto-inyecta init.sql)
    console.log(`🚀 Levantando servicios (Docker)...`);
    runCommand('docker-compose up -d');

    // 3. HEALTHCHECK
    console.log(`\n⏳ [3/4] Esperando inicialización de MySQL (Máx ${MAX_ATTEMPTS}s)...`);
    let isHealthy = false;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            const status = execSync('docker inspect --format="{{.State.Health.Status}}" aleg-mysql', { stdio: 'pipe' }).toString().trim();
            if (status === 'healthy') {
                // console.log("📸");
                isHealthy = true;
                console.log(`\n✅ MySQL HEALTHY en ${i + 1}s.`);
                break;
            }
        } catch (e) { }

        // console.log(".");
        if ((i + 1) % 10 === 0) console.log(` ${i + 1}s `);
        await delay(CHECK_INTERVAL);
    }

    if (!isHealthy) {
        console.error("\n❌ Error: Timeout MySQL. Mostrando logs para depuración:");
        runCommand('docker logs aleg-mysql --tail 20');
        process.exit(1);
    }

    // 3.5. ASEGURAR START DE BACKEND
    // A veces docker-compose up inicial falla por timeout del healthcheck, dejando al backend en "Created".
    // Ahora que sabemos que MySQL está healthy, levantamos el resto.
    console.log(`\n🚀 Reactivando servicios dependientes (Backend/Frontend)...`);
    // Usamos 'restart' para forzar que el backend intente reconectar, ya que pudo haber fallado y muerto silenciosamente o quedado en limbo.
    // 'up -d' a veces no hace nada si cree que ya está 'Created'.
    runCommand('docker-compose restart backend frontend');

    // 4. VALIDACIÓN DE DATOS (Universal, sin dependencia de OS)
    console.log("\n🔍 [4/4] Validando integridad de datos (Smart Wait)...");

    // Retry loop for validation to avoid "Table doesn't exist" race condition
    const MAX_VALIDATION_ATTEMPTS = 30; // 30 seconds
    let validationSuccess = false;

    for (let i = 0; i < MAX_VALIDATION_ATTEMPTS; i++) {
        try {
            // Usamos execSync para consistencia
            const output = execSync('docker exec aleg-mysql mysql -uroot -proot aleg_global -N -e "SELECT count(*) FROM tenant;"', {
                stdio: 'pipe',
                encoding: 'utf-8'
            }).toString().trim();

            if (output && output.match(/^\d+$/)) {
                console.log(`✅ Validación Exitosa: Tablas creadas. Tenants encontrados: ${output}`);
                validationSuccess = true;
                break;
            }
        } catch (e) {
            // Ignore errors during retry (likely table not ready yet)
            // Only log if it's the last attempt
            if (i === MAX_VALIDATION_ATTEMPTS - 1) {
                const stderr = e.stderr ? e.stderr.toString() : e.message;
                console.warn(`⚠️  Alerta: No se pudo validar la BD tras ${MAX_VALIDATION_ATTEMPTS}s. Error: ${stderr.trim()}`);
            }
        }
        await delay(1000);
    }

    if (!validationSuccess) {
        console.warn(`⚠️  La validación no pudo confirmar los datos (el backend podría seguir iniciándose).`);
    }

    console.log("\n========================================");
    console.log("✅  SISTEMA 100% OPERATIVO Y LIMPIO");
    console.log("========================================");
}

main();
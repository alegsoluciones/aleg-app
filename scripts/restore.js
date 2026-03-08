const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');
const fs = require('fs');
const path = require('path');

// --- COLORS & CONFIG ---
const COLORS = {
    RESET: "\x1b[0m",
    BRIGHT: "\x1b[1m",
    CYAN: "\x1b[36m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    RED: "\x1b[31m",
    MAGENTA: "\x1b[35m",
    BLUE: "\x1b[34m"
};

const ICONS = {
    SYNC: "🔄",
    CHECK: "✅",
    ERROR: "❌",
    WARN: "⚠️ ",
    ROCKET: "🚀",
    DB: "🗄️ ",
    PKG: "📦",
    CLEAN: "🧹"
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const clearScreen = () => console.clear();

const header = () => {
    clearScreen();
    console.log(COLORS.CYAN + "========================================================" + COLORS.RESET);
    console.log(COLORS.BRIGHT + `   ${ICONS.SYNC}  RESTORE & SYNC - ALEG AIO (v2.0)  ${ICONS.SYNC}` + COLORS.RESET);
    console.log(COLORS.CYAN + "========================================================" + COLORS.RESET);
    console.log(COLORS.BLUE + `   Host: ${os.hostname()} | Platform: ${os.platform()}` + COLORS.RESET);
    console.log(COLORS.CYAN + "--------------------------------------------------------" + COLORS.RESET);
};

// --- HELPERS ---
const runCommand = (command, silent = false, ignoreError = false) => {
    try {
        const output = execSync(command, { stdio: silent ? 'pipe' : 'inherit', shell: true });
        return silent ? output.toString().trim() : true;
    } catch (e) {
        if (!ignoreError && e.stderr) {
            // Only show error details if not ignoring errors
            if (!silent) console.error(COLORS.RED + `\n   ${ICONS.ERROR} DETALLE DEL ERROR:` + COLORS.RESET);
            if (!silent) console.error(COLORS.RED + e.stderr.toString() + COLORS.RESET);
        }
        return false;
    }
};

const getFileHash = (filePath) => {
    if (!fs.existsSync(filePath)) return '';
    const content = fs.readFileSync(filePath);
    return content.toString();
};

const killPort = (port) => {
    try {
        if (os.platform() === 'win32') {
            const output = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe', encoding: 'utf-8' });
            const lines = output.split('\n');
            const pids = new Set();
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 4) {
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== '0') pids.add(pid);
                }
            });

            if (pids.size > 0) {
                console.log(COLORS.YELLOW + `   ⏳ Liberando puerto ${port} (Procesos: ${Array.from(pids).join(', ')})...` + COLORS.RESET);
                pids.forEach(pid => {
                    runCommand(`taskkill /PID ${pid} /F`, true, true);
                });
            }
        } else {
            // Linux/Mac implementation (lsof/kill)
            runCommand(`lsof -ti:${port} | xargs kill -9`, true, true);
        }
    } catch (e) {
        // Ignore if no process found
    }
};

// --- STEPS ---

const stepCheckDocker = () => {
    console.log(COLORS.YELLOW + `\n🐳 [PRE] Verificando Docker...` + COLORS.RESET);
    try {
        execSync('docker info', { stdio: 'ignore' });
        console.log(COLORS.GREEN + `   ${ICONS.CHECK} Docker está corriendo.` + COLORS.RESET);
    } catch (e) {
        console.log(COLORS.RED + `   ${ICONS.ERROR} ERROR: Docker no está ejecutándose.` + COLORS.RESET);
        console.log(COLORS.CYAN + "   👉 Por favor, abre 'Docker Desktop' y espera a que inicie antes de continuar." + COLORS.RESET);
        process.exit(1);
    }
};

const stepKillPorts = () => {
    console.log(COLORS.YELLOW + `\n${ICONS.CLEAN} [PRE] Verificando puertos conflictos...` + COLORS.RESET);
    killPort(3000);
    killPort(5173); // Frontend
    console.log(COLORS.GREEN + `   ${ICONS.CHECK} Puertos 3000/5173 libres.` + COLORS.RESET);
};

const stepGitPull = async () => {
    console.log(COLORS.YELLOW + `\n${ICONS.SYNC} [1/3] Sincronizando código (Git Pull)...` + COLORS.RESET);

    // Save package.json state before pull
    const getHashes = () => ({
        root: getFileHash(path.join(process.cwd(), 'package.json')),
        backend: getFileHash(path.join(process.cwd(), 'backend', 'package.json')),
        frontend: getFileHash(path.join(process.cwd(), 'frontend', 'package.json'))
    });

    const prePull = getHashes();

    try {
        const result = runCommand('git pull', false); // Show output to user so they see changes
        if (result === false) {
            console.log(COLORS.RED + `   ${ICONS.ERROR} Error al hacer git pull. Verifica tu conexión o conflictos.` + COLORS.RESET);
            return false;
        }

        console.log(COLORS.GREEN + `   ${ICONS.CHECK} Código actualizado.` + COLORS.RESET);

        const postPull = getHashes();
        const changed = (prePull.root !== postPull.root) ||
            (prePull.backend !== postPull.backend) ||
            (prePull.frontend !== postPull.frontend);

        return { success: true, pkgChanged: changed };

    } catch (e) {
        console.log(COLORS.RED + `   ${ICONS.ERROR} Excepción al intentar git pull.` + COLORS.RESET);
        return false;
    }
};

const stepDependencies = (pkgChanged) => {
    console.log(COLORS.YELLOW + `\n${ICONS.PKG} [2/3] Verificando dependencias...` + COLORS.RESET);

    const missingModules = !fs.existsSync('node_modules') ||
        !fs.existsSync('backend/node_modules') ||
        !fs.existsSync('frontend/node_modules');

    if (pkgChanged || missingModules) {
        if (missingModules) console.log(COLORS.CYAN + `   ${ICONS.WARN} Faltan carpetas node_modules.` + COLORS.RESET);
        if (pkgChanged) console.log(COLORS.CYAN + `   ${ICONS.WARN} Se detectaron cambios en package.json.` + COLORS.RESET);

        console.log("   Instalando dependencias (esto puede tardar unos segundos)...");

        // Root not always needed but good practice
        // runCommand('npm install'); 

        if (fs.existsSync('backend/package.json')) {
            process.stdout.write("   👉 Backend: ");
            runCommand('cd backend && npm install', false);
        }
        if (fs.existsSync('frontend/package.json')) {
            process.stdout.write("   👉 Frontend: ");
            runCommand('cd frontend && npm install', false);
        }
        console.log(COLORS.GREEN + `   ${ICONS.CHECK} Dependencias actualizadas.` + COLORS.RESET);
    } else {
        console.log(COLORS.GREEN + `   ${ICONS.CHECK} Las dependencias están al día.` + COLORS.RESET);
    }
};

const stepDatabase = () => {
    return new Promise((resolve) => {
        console.log(COLORS.YELLOW + `\n${ICONS.DB} [3/3] Base de Datos` + COLORS.RESET);

        console.log(COLORS.BRIGHT + "   ¿Deseas regenerar la Base de Datos con el código nuevo?" + COLORS.RESET);
        console.log("   (Esto ejecutará 'reset', borrando data actual por data de prueba actualizada)");

        rl.question(COLORS.CYAN + '\n   👉 Escribe "y" para resetear, o ENTER para mantener datos: ' + COLORS.RESET, (ans) => {
            if (ans.trim().toLowerCase() === 'y' || ans.trim().toLowerCase() === 'yes') {
                console.log(COLORS.MAGENTA + `\n   🚀 Iniciando Reset & Seed...` + COLORS.RESET);
                runCommand('node scripts/reset.js');
                console.log(COLORS.MAGENTA + `\n   🌱 Configuración Inicial Completa.` + COLORS.RESET);
            } else {
                console.log(COLORS.BLUE + "   Saltando regeneración de BD." + COLORS.RESET);
            }
            resolve();
        });
    });
};


// --- MAIN FLOW ---
const main = async () => {
    header();

    stepCheckDocker();
    stepKillPorts();

    const pullResult = await stepGitPull();

    if (pullResult === false) {
        console.log(COLORS.RED + "\n❌ No se pudo sincronizar. Abortando para evitar inconsistencias." + COLORS.RESET);
        rl.close();
        process.exit(1);
    }

    stepDependencies(pullResult.pkgChanged);

    await stepDatabase();

    // AUTO-LAUNCH DEV
    console.log(COLORS.GREEN + `\n${ICONS.ROCKET} RESTAURACIÓN COMPLETADA.` + COLORS.RESET);
    console.log("   Preparando entorno de desarrollo...");

    // Stop conflicting containers (just in case reset.js started them or they were running)
    // We want to work LOCALLY with npm run dev
    runCommand('docker stop aleg-backend aleg-frontend', true, true);

    console.log(COLORS.CYAN + "\n👉 Iniciando: npm run dev" + COLORS.RESET);

    rl.close();

    // Use spawn with inherit stdio
    const { spawn } = require('child_process');
    const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });

    dev.on('exit', (code) => {
        process.exit(code);
    });
};

main();

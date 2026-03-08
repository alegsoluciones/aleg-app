const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');

// --- CONFIG & COLORS ---
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
    CROWN: "👑",
    LIGHTNING: "⚡",
    LOCK: "🔒",
    SKULL: "☢️ ",
    CHECK: "✅",
    ERROR: "❌",
    WARN: "⚠️ ",
    ROCKET: "🚀",
    GIT: "octocat"
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const clearScreen = () => {
    console.clear();
};

const header = () => {
    clearScreen();
    console.log(COLORS.CYAN + "========================================================" + COLORS.RESET);
    console.log(COLORS.BRIGHT + `   ${ICONS.CROWN}  SNAPSHOT 3.2 - CUSTOM DESC EDITION  ${ICONS.CROWN}` + COLORS.RESET);
    console.log(COLORS.CYAN + "========================================================" + COLORS.RESET);
    console.log(COLORS.BLUE + `   Host: ${os.hostname()} | Platform: ${os.platform()}` + COLORS.RESET);
    console.log(COLORS.CYAN + "--------------------------------------------------------" + COLORS.RESET);
};

// --- HELPERS ---
const runCommand = (command, silent = false) => {
    try {
        const output = execSync(command, { stdio: silent ? 'pipe' : 'inherit', shell: true });
        return silent ? output.toString().trim() : true;
    } catch (e) {
        return false;
    }
};

const getTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// Smart Connectivity Check
const validateRemoteConnection = () => {
    console.log(COLORS.YELLOW + "\n   📡 Verificando conexión con GitHub..." + COLORS.RESET);

    const hasOrigin = runCommand('git remote get-url origin', true);
    if (!hasOrigin) {
        console.log(COLORS.RED + `   ${ICONS.WARN} No hay repositorio remoto configurado.` + COLORS.RESET);
        console.log(COLORS.YELLOW + "   Usa la opción [3] para VINCULAR este proyecto primero." + COLORS.RESET);
        return false;
    }

    try {
        execSync('git ls-remote origin', { stdio: 'ignore' });
        console.log(COLORS.GREEN + "   ✅ Conexión establecida." + COLORS.RESET);
        return true;
    } catch (e) {
        console.log(COLORS.RED + `   ${ICONS.LOCK} Acceso denegado o credenciales faltantes.` + COLORS.RESET);
        console.log(COLORS.CYAN + "   🛠️  Iniciando protocolo de autenticación interactiva..." + COLORS.RESET);
        try {
            console.log(COLORS.BRIGHT + "   👉 Por favor ingresa tus credenciales en la ventana emergente o terminal..." + COLORS.RESET);
            execSync('git fetch origin', { stdio: 'inherit' });
            console.log(COLORS.GREEN + "   ✅ Autenticado correctamente." + COLORS.RESET);
            return true;
        } catch (err) {
            console.log(COLORS.RED + "   ❌ Falló la autenticación. No se puede realizar el respaldo." + COLORS.RESET);
            return false;
        }
    }
};

// --- ACTIONS ---

const actionQuickBackup = (callback) => {
    console.log(COLORS.YELLOW + `\n${ICONS.LIGHTNING} MODO FLASH: RESPALDO RÁPIDO` + COLORS.RESET);

    if (!validateRemoteConnection()) {
        if (callback) callback();
        return;
    }

    // 👇 Pidiendo descripción al usuario
    rl.question(COLORS.CYAN + '\n   📝 Descripción opcional (Enter para omitir): ' + COLORS.RESET, (desc) => {
        console.log("   Guardando estado actual...");

        const description = desc.trim() ? ` - ${desc.trim()}` : '';

        if (runCommand('git add .')) {
            const msg = `⚡ SNAPSHOT FLASH: ${getTimestamp()}${description}`;
            if (runCommand(`git commit -m "${msg}"`, true)) {
                console.log(COLORS.GREEN + "   Cambios confirmados localmente." + COLORS.RESET);
                console.log("   Subiendo a la nube...");
                if (runCommand('git push')) {
                    console.log(COLORS.BRIGHT + COLORS.GREEN + `\n${ICONS.CHECK} RESPALDO COMPLETADO EXITOSAMENTE.` + COLORS.RESET);
                } else {
                    console.log(COLORS.RED + `\n${ICONS.ERROR} Error al subir (Push).` + COLORS.RESET);
                }
            } else {
                console.log(COLORS.YELLOW + `\n${ICONS.CHECK} Nada que respaldar (Directorio limpio).` + COLORS.RESET);
            }
        }
        if (callback) callback();
    });
};

const actionDailyClose = (callback) => {
    console.log(COLORS.MAGENTA + `\n${ICONS.LOCK} MODO CIERRE: RESPALDO DEL DÍA (TAG)` + COLORS.RESET);

    if (!validateRemoteConnection()) {
        if (callback) callback();
        return;
    }

    rl.question(COLORS.CYAN + '\n   📝 Notas del Cierre (Enter para omitir): ' + COLORS.RESET, (desc) => {
        console.log("   Congelando versión del sistema...");

        const tagDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const tagName = `CIERRE_DIA_${tagDate}`;
        const description = desc.trim() ? ` (${desc.trim()})` : '';

        runCommand('git add .', true);
        runCommand(`git commit -m "🔒 CIERRE OFICIAL DEL DÍA: ${tagDate}${description}"`, true);

        console.log(`   Creando etiqueta de seguridad: ${COLORS.BRIGHT}${tagName}${COLORS.RESET}`);
        if (runCommand(`git tag -f ${tagName}`)) {
            console.log("   Sincronizando con remoto...");
            if (runCommand('git push && git push --tags --force')) {
                console.log(COLORS.BRIGHT + COLORS.GREEN + `\n${ICONS.LOCK} DÍA CERRADO Y ASEGURADO.` + COLORS.RESET);
            } else {
                console.log(COLORS.RED + `\n${ICONS.ERROR} Error subiendo el cierre.` + COLORS.RESET);
            }
        }
        if (callback) callback();
    });
};

const actionMigrateRepo = () => {
    // Nota: Esta función ya maneja su propio flujo de preguntas, por lo que no necesita callback externo simple
    console.log(COLORS.RED + `\n${ICONS.SKULL} ZONA DE PELIGRO: CAMBIO DE REPOSITORIO` + COLORS.RESET);
    // ... (El resto sigue igual, pero por seguridad re-insertamos el contenido previo)
    console.log(COLORS.YELLOW + "   Esta acción:" + COLORS.RESET);
    console.log("   1. Borrará el historial Git local actual.");
    console.log("   2. Inicializará un repositorio nuevo limpio.");
    console.log("   3. FORZARÁ (Push Force) tu código actual al nuevo repositorio.");
    console.log(COLORS.BRIGHT + "   Tu código local NO se perderá, pero el historial viejo sí." + COLORS.RESET);

    rl.question(COLORS.BRIGHT + '\n   Ingresa la URL del NUEVO repositorio GitHub: ' + COLORS.RESET, (url) => {
        if (!url.trim()) {
            console.log(COLORS.RED + "   Operación cancelada." + COLORS.RESET);
            return pauseAndMenu();
        }

        rl.question(COLORS.RED + `   ${ICONS.WARN} ¿ESTÁS 100% SEGURO? Escribe 'CONFIRMAR' para proceder: ` + COLORS.RESET, (ans) => {
            if (ans.trim().toUpperCase() !== 'CONFIRMAR') {
                console.log(COLORS.GREEN + "   Cancelado." + COLORS.RESET);
                return pauseAndMenu();
            }

            console.log(COLORS.RED + `\n   ${ICONS.SKULL} INICIANDO MIGRACIÓN NUCLEAR...` + COLORS.RESET);
            if (process.platform === 'win32') runCommand('rmdir /s /q .git', true);
            else runCommand('rm -rf .git', true);

            runCommand('git init', true);
            runCommand('git branch -M main', true);
            runCommand('git add .');
            runCommand('git commit -m "☢️ NUEVO ORIGEN: Migración de Repositorio (Clean State)"', true);
            runCommand(`git remote add origin ${url}`, true);

            console.log("   Subiendo al nuevo origen...");
            if (runCommand('git push -u origin main --force')) {
                console.log(COLORS.BRIGHT + COLORS.GREEN + `\n${ICONS.ROCKET} MIGRACIÓN EXITOSA.` + COLORS.RESET);
            } else {
                console.log(COLORS.RED + `\n${ICONS.ERROR} Falló el push inicial.` + COLORS.RESET);
            }
            pauseAndMenu();
        });
    });
};

const pauseAndMenu = () => {
    rl.question(COLORS.CYAN + '\nPresiona ENTER para volver al menú...' + COLORS.RESET, () => {
        mainMenu();
    });
};

// --- MENU LOOP ---
const mainMenu = () => {
    header();
    console.log(COLORS.YELLOW + "\n OPCIONES DISPONIBLES:" + COLORS.RESET);
    console.log(` ${COLORS.BRIGHT}[1] ${ICONS.LIGHTNING} RESPALDO RÁPIDO (Quick Backup)${COLORS.RESET}`);
    console.log(`      Guarda cambios y sube a la nube. Ideal para checkpoints.`);

    console.log(`\n ${COLORS.BRIGHT}[2] ${ICONS.LOCK} CIERRE DEL DÍA (Daily Lock)${COLORS.RESET}`);
    console.log(`      Genera una etiqueta (Tag) inmutable. Candado de seguridad.`);

    console.log(`\n ${COLORS.BRIGHT}[3] ${ICONS.SKULL} CAMBIAR REPOSITORIO (Migrate/Reset)${COLORS.RESET}`);
    console.log(`      Vincula este proyecto a un repo nuevo (GitHub) preservando tus arquivos.`);

    console.log(`\n ${COLORS.BRIGHT}[4] 📊 STATUS GIT${COLORS.RESET}`);
    console.log(`      Ver estado actual.`);

    console.log(`\n [0] SALIR`);

    rl.question(COLORS.CYAN + '\n👉 Selecciona una opción: ' + COLORS.RESET, (opt) => {
        switch (opt.trim()) {
            case '1': actionQuickBackup(pauseAndMenu); break; // Pasamos callback
            case '2': actionDailyClose(pauseAndMenu); break;  // Pasamos callback
            case '3': actionMigrateRepo(); break;             // Own flow
            case '4':
                console.log("");
                runCommand('git status');
                pauseAndMenu();
                break;
            case '0':
                console.log("👋 Bye.");
                rl.close();
                process.exit(0);
                break;
            default: mainMenu();
        }
    });
};

// Start
mainMenu();
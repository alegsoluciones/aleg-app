const { spawn, execSync } = require('child_process');
const net = require('net');

// Configuration
const DB_PORT = 3307; // External port exposed in docker-compose.yml
const DB_HOST = 'localhost';
const CHECK_INTERVAL_MS = 1000;
const MAX_RETRIES = 30; // 30 seconds timeout
const DOCKER_SERVICE = 'mysql';

/**
 * Executes a shell command and returns true if successful
 */
function runCommand(command, inherit = false) {
    try {
        execSync(command, { stdio: inherit ? 'inherit' : 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Checks if a port is open
 */
function checkPort(port, host) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.setTimeout(500); // 500ms connection timeout

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function waitForDB() {
    process.stdout.write(`⏳ Waiting for Database on port ${DB_PORT}...`);

    for (let i = 0; i < MAX_RETRIES; i++) {
        const isOpen = await checkPort(DB_PORT, DB_HOST);
        if (isOpen) {
            console.log(' ✅ Ready!');
            return true;
        }
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    }

    console.log('\n❌ Database timeout! Is the container running properly?');
    return false;
}

async function main() {
    console.log('🚀 Starting ALEG Smart Dev Environment...');

    // 0. Ensure no conflicting containers are running (Backend/Frontend)
    // We only want 'mysql' container to be running.
    // If 'aleg-backend' uses port 3000, it conflicts with local npm run dev:backend
    console.log('\n🧹 Stopping conflicting containers (Backend/Frontend)...');
    runCommand('docker stop aleg-backend aleg-frontend', false);
    // Alternatively, we can use docker compose stop backend frontend if names vary, 
    // but explicit names are set in docker-compose.yml

    // 1. Start Infrastructure (DB Only)
    console.log(`\n🐳 Starting Database (${DOCKER_SERVICE})...`);
    // Ensure we start ONLY mysql, detached.
    const success = runCommand(`docker compose up -d ${DOCKER_SERVICE}`, true);

    if (!success) {
        console.error('❌ Failed to start Docker containers. Check docker-compose.yml');
        process.exit(1);
    }

    // 2. Wait for Healthcheck
    const dbReady = await waitForDB();
    if (!dbReady) {
        process.exit(1);
    }

    // 3. Launch Code
    console.log('\n💻 Launching Application Code (Backend + Frontend)...');
    console.log('----------------------------------------------------');

    const devProcess = spawn('npm', ['run', 'dev:code'], {
        stdio: 'inherit',
        shell: true
    });

    devProcess.on('exit', (code) => {
        process.exit(code);
    });
}

main();

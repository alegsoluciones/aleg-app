// Native fetch in Node 18+, no require needed.

const API_URL = 'http://localhost:3000';
// Hardcoded token for dev environment or we login
const SUPER_USER = { email: 'superadmin@alegapp.com', password: '123456' };

const MODULES_DEF = [
    { code: 'core-std', name: 'Core Estándar', description: 'Funciones base: Pacientes, Roles, Settings.', price: 0, isActive: true },
    { code: 'util_importer', name: 'Importador Legacy', description: 'Herramienta para migrar Excel a ALEG.', price: 15, isActive: true },
    { code: 'mod_logistics', name: 'Logística Avanzada', description: 'Control de inventarios, proveedores y stock.', price: 40, isActive: true },
    { code: 'mod_financial', name: 'Finanzas & Facturación', description: 'Módulo de caja, facturación electrónica y reportes.', price: 50, isActive: true },
    { code: 'mod_marketing', name: 'CRM & Marketing', description: 'Campañas de email, seguimiento de leads.', price: 30, isActive: true },
    { code: 'mod_vet', name: 'Veterinaria Pro', description: 'Fichas de mascotas, razas y vacunas.', price: 35, isActive: true },
    // Módulos Futuros
    { code: 'telemed', name: 'Telemedicina', description: 'Video-consultas integradas y chat seguro.', price: 60, isActive: true },
    { code: 'pharmacy', name: 'Farmacia', description: 'Punto de venta POS para farmacia interna.', price: 45, isActive: true },
    { code: 'lab', name: 'Laboratorio', description: 'Gestión de muestras y resultados de laboratorio.', price: 55, isActive: true }
];

async function main() {
    console.log("🔧 FIXING MODULES CATALOG...");

    // 1. Login
    console.log("🔑 Logging in as Super Admin...");
    let token = '';
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(SUPER_USER)
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Login failed: ${res.status} - ${txt}`);
        }
        const data = await res.json();
        token = data.access_token;
        console.log("✅ Logged In.");
    } catch (e) {
        console.error("❌ Failed to login. Is backend running?", e.message);
        process.exit(1);
    }

    // 2. Post Modules
    console.log(`📦 Seeding ${MODULES_DEF.length} modules...`);
    for (const mod of MODULES_DEF) {
        process.stdout.write(`   Processing ${mod.code}... `);
        try {
            const res = await fetch(`${API_URL}/marketplace/modules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': 'global-admin'
                },
                body: JSON.stringify(mod)
            });

            if (res.ok) {
                console.log("✅ OK");
            } else if (res.status === 409) {
                console.log("⏭️ Exists (Skipped)");
            } else {
                console.log(`❌ Error: ${res.status}`);
            }
        } catch (e) {
            console.log(`❌ Network Error: ${e.message}`);
        }
    }
    console.log("\n✅ FIX COMPLETE. Refresh Marketplace in Dashboard.");
}

main();

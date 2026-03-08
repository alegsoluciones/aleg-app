
const { DataSource } = require('../backend/node_modules/typeorm');

// CONFIG
const DB_CONFIG = {
    type: 'mysql',
    host: 'localhost',
    port: 3307,
    username: 'root',
    password: 'root', // Found in docker-compose
    database: 'aleg_global',
};

async function seed() {
    console.log("🌱 SEEDING MARKETPLACE MODULES...");

    const dataSource = new DataSource(DB_CONFIG);
    await dataSource.initialize();
    console.log("✅ DB Connected");

    const modules = [
        { code: 'core-std', name: 'Núcleo Estándar', price: 0, category: 'CORE', description: 'Sistema base: Pacientes, Citas, Dashboard.' },
        { code: 'mod_appointments', name: 'Agenda & Citas (Smart)', price: 15.00, category: 'ADDON', description: 'Agenda avanzada, recordatorios WhatsApp, control de asistencia.' },
        { code: 'mod_patients', name: 'Pacientes & CRM', price: 10.00, category: 'ADDON', description: 'Base de datos de pacientes, historia clínica digital.' },
        { code: 'mod_medical_records', name: 'Historias Clínicas (EMR)', price: 20.00, category: 'ADDON', description: 'Expedientes médicos completos, recetas, triaje.' },
        { code: 'mod_financial', name: 'Finanzas & Cobros', price: 30.00, category: 'ADDON', description: 'Facturación, caja chica, reportes financieros.' },
        { code: 'mod_logistics', name: 'Logística Pro', price: 25.00, category: 'ADDON', description: 'Control de inventario, proveedores y stock.' },
        { code: 'mod_marketing', name: 'Marketing & Leads', price: 15.00, category: 'ADDON', description: 'Campañas de email, seguimiento de leads.' },
        { code: 'mod_vet', name: 'Pack Veterinario', price: 10.00, category: 'PLUGIN', description: 'Adaptación veterinaria: Razas, Pelaje, Propietarios.' },
        { code: 'telemed', name: 'Telemedicina', price: 20.00, category: 'PLUGIN', description: 'Videoconsultas integradas y sala de espera virtual.' },
        { code: 'pharmacy', name: 'Farmacia & Recetas', price: 15.00, category: 'ADDON', description: 'Venta de medicamentos y gestión de recetas.' }
    ];

    for (const mod of modules) {
        // Check if exists
        const exists = await dataSource.query(`SELECT * FROM marketplace_modules WHERE code = '${mod.code}'`);
        if (exists.length === 0) {
            await dataSource.query(`
                INSERT INTO marketplace_modules (code, name, price, category, description, isActive)
                VALUES ('${mod.code}', '${mod.name}', ${mod.price}, '${mod.category}', '${mod.description}', 1)
            `);
            console.log(`   ➕ Inserted: ${mod.name}`);
        } else {
            console.log(`   🆗 Exists: ${mod.name}`);
        }
    }

    console.log("✅ Seed Complete.");
    await dataSource.destroy();
}

seed().catch(console.error);

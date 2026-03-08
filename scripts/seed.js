const readline = require('readline');

// CONFIG
const API_URL = "http://127.0.0.1:3000";
const ADMIN_EMAIL = "superadmin@alegapp.com"; // 👈 CORRECTED
const ADMIN_PASS = "123456"; // 👈 CORRECTED

// TENANT DEFINITIONS
const TENANTS_DEF = [
    {
        name: 'Solderma Instituto Dermatológico',
        slug: 'clinica-solderma',
        industry: 'CLINICAL',
        adminEmail: 'administradora@solderma.com',
        config: {
            app_mode: 'CLINICAL',
            terminology: { patient: 'Paciente', record: 'Historia', eval_section: 'Evaluación Dermatológica' },
            active_modules: ['core-std', 'mod_agenda', 'mod_patients', 'mod_medical_records', 'util_importer'],
            theme: { primary: '#3B82F6', radius: '0.5rem', logoUrl: 'https://placehold.co/200x200/3B82F6/white?text=Solderma' }
        }
    },
    {
        name: 'Dr. Pets Veterinaria',
        slug: 'dr-pets',
        industry: 'VET',
        adminEmail: 'veterinaria@drpets.com',
        config: {
            app_mode: 'VET',
            terminology: { patient: 'Mascota', record: 'Ficha Médica', eval_section: 'Triaje Veterinario', owner: 'Propietario' },
            theme: { primary: '#10B981', radius: '1rem', logoUrl: 'https://placehold.co/200x200/10B981/white?text=Dr+Pets' },
            active_modules: ['core-std', 'mod_agenda', 'mod_patients', 'mod_medical_records', 'mod_vet']
        }
    },
    {
        name: 'El Mundo de Sara',
        slug: 'el-mundo-de-sara',
        industry: 'CRAFT',
        adminEmail: 'sara@elmundodesara.com',
        config: {
            app_mode: 'CRAFT',
            terminology: { patient: 'Alumna', record: 'Proyecto', eval_section: 'Detalles del Kit' },
            theme: { primary: '#8B5CF6', radius: '0rem', logoUrl: 'https://placehold.co/200x200/8B5CF6/white?text=El+Mundo+de+Sara' },
            active_modules: ['core-std', 'mod_agenda', 'mod_patients', 'mod_logistics']
        }
    },
    {
        name: 'Aspeten Eventos Corporativos',
        slug: 'aspeten-events',
        industry: 'EVENTS',
        adminEmail: 'events@aspeten.com',
        config: {
            app_mode: 'EVENTS',
            terminology: { patient: 'Asistente', record: 'Check-in', eval_section: 'Datos del Stand' },
            theme: { primary: '#EC4899', radius: '0.5rem', logoUrl: 'https://placehold.co/200x200/EC4899/white?text=Aspeten' },
            active_modules: ['core-std', 'mod_marketing']
        }
    }
];

// MARKETPLACE CATALOG DEFINITION
// MARKETPLACE CATALOG DEFINITION
const MODULES_DEF = [
    { code: 'core-std', name: 'Standard Core', price: 0.00, description: 'Pacientes, Citas, Dashboard Base.', dependencies: [] },

    // 🏥 CORE MEDICAL MODULES (Granular)
    { code: 'mod_agenda', name: 'Agenda Médica', price: 0.00, description: 'Gestión de citas y turnos.', dependencies: ['core-std'] },
    { code: 'mod_patients', name: 'Gestión de Pacientes', price: 0.00, description: 'Directorio y perfiles de pacientes.', dependencies: ['core-std'] },
    { code: 'mod_medical_records', name: 'Historias Clínicas', price: 0.00, description: 'Fichas, consultas y evolución.', dependencies: ['mod_patients'] },

    // 💼 BUSINESS MODULES
    { code: 'mod_logistics', name: 'Logística Pro', price: 49.99, description: 'Inventario, Proveedores y Entradas/Salidas.', dependencies: ['core-std'] },
    { code: 'mod_financial', name: 'Finanzas', price: 29.99, description: 'Facturación, Caja Chica, Reportes Financieros.', dependencies: ['core-std'] },
    { code: 'mod_marketing', name: 'Marketing CRM', price: 19.99, description: 'Campañas Email/WhatsApp y Lead Scoring.', dependencies: ['core-std'] },

    // 🐾 SPECIALTY MODULES
    { code: 'mod_vet', name: 'Pack Veterinario', price: 0.00, description: 'Historia Clínica Vet, Razas y Vacunas.', dependencies: ['core-std'] },
    { code: 'util_importer', name: 'Migrador Excel', price: 0.00, description: 'Herramienta de carga masiva de datos.', dependencies: ['core-std'] }
];

// DATA GENERATORS
// ADVANCED DATA GENERATORS
const FIRST_NAMES = ["Ricardo", "Valeria", "Mauricio", "Claudia", "Santiago", "Gabriela", "Roberto", "Lucia", "Fernando", "Daniela"];
const LAST_NAMES = ["Villanueva", "Castañeda", "Zavala", "Aguirre", "Palomino", "Figueroa", "Mendoza", "Vargas", "Rojas", "Torres"];
const PET_NAMES = ["Firulais", "Rex", "Luna", "Simba", "Nala", "Thor", "Max", "Bella", "Coco", "Charlie", "Rocky"];
const PET_BREEDS = ["Pastor Alemán", "Bulldog", "Persa", "Siames", "Golden Retriever", "Labrador", "Poodle", "Husky", "Chihuahua", "Boxer"];
const COMPANIES = ["Coca Cola", "Samsung", "Nestlé", "Alicorp", "Backus", "Toyota", "BBVA", "Scotiabank", "Latam", "Movistar"];

// UTILS
let rl;
const getRl = () => {
    if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return rl;
};
const ask = (q) => new Promise(r => getRl().question(q, r));
const log = console.log;
const delay = ms => new Promise(r => setTimeout(r, ms));
const random = arr => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min) + min);

// Helper for dates
const randomDatePast = (monthsBack) => {
    const d = new Date();
    d.setMonth(d.getMonth() - randomInt(0, monthsBack));
    d.setDate(randomInt(1, 28));
    return d.toISOString().split('T')[0];
};

let SUPER_TOKEN = null;

const waitForBackend = async () => {
    console.log("⏳ Esperando a que el Backend esté listo...");
    for (let i = 0; i < 150; i++) {
        try {
            await fetch(API_URL);
            console.log("✅ Backend detectado.");
            return true;
        } catch (e) {
            await delay(2000);
            if (i % 10 === 0) process.stdout.write(` [${i * 2}s] `);
            else process.stdout.write(".");
        }
    }
    console.error("\n❌ Timeout esperando al Backend (Port 3000).");
    return false;
};

// --- ACTIONS ---

async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error("Login fallido");
        const data = await res.json();
        return data.access_token;
    } catch (e) {
        console.warn(`Original Error for ${email}:`, e.message);
        return null;
    }
}

async function loginSuper() {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Login Fail: ${res.status} - ${txt}`);
        }
        const data = await res.json();
        SUPER_TOKEN = data.access_token;
        return true;
    } catch (e) {
        log("❌ Error login:", e.message);
        return false;
    }
}

async function createTenant(def) {
    console.log(`🏗️ Creando/Verificando ${def.name}... `);

    const listRes = await fetch(`${API_URL}/tenants`, {
        headers: {
            'Authorization': `Bearer ${SUPER_TOKEN}`,
            'x-tenant-slug': 'global-admin'
        }
    });

    if (!listRes.ok) {
        console.log(`❌ Error listando tenants: ${listRes.status} ${listRes.statusText}`);
        return null;
    }

    const tenants = await listRes.json();
    const existing = tenants.find(t => t.slug === def.slug);

    if (existing) {
        console.log(`✅ Ya existe ${def.slug} (Actualizando...).`);

        // Force Update Industry & Config
        const updateRes = await fetch(`${API_URL}/tenants/${existing.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPER_TOKEN}`,
                'x-tenant-slug': 'global-admin'
            },
            body: JSON.stringify({
                // name: def.name, // Dont rename if not needed
                industry: def.industry,
                config: def.config
            })
        });

        if (updateRes.ok) {
            console.log("   🔄 Tenant actualizado (Industria/Config).");
        } else {
            console.log("   ⚠️ Error actualizando tenant:", await updateRes.text());
        }

        return existing;
    }

    const res = await fetch(`${API_URL}/tenants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPER_TOKEN}`,
            'x-tenant-slug': 'global-admin'
        },
        body: JSON.stringify({
            name: def.name,
            slug: def.slug,
            industry: def.industry,
            config: def.config,
            adminEmail: def.adminEmail
        })
    });

    if (res.ok) {
        const t = await res.json();
        console.log("✨ Creado ID:", t.id);
        console.log(`   👤 Admin creado automáticamente por Backend: ${def.adminEmail}`);
        return t;
    } else {
        const txt = await res.text();
        console.log(`❌ Error: ${res.status} - ${txt}`);
        return null;
    }
}


async function seedData(tenantSlug, patientCount, withPhotos) {
    const listRes = await fetch(`${API_URL}/tenants`, {
        headers: { 'Authorization': `Bearer ${SUPER_TOKEN}`, 'x-tenant-slug': 'global-admin' }
    });

    if (!listRes.ok) return log(`❌ Error listando tenants: ${listRes.status}`);
    const tenants = await listRes.json();
    const tenant = tenants.find(t => t.slug === tenantSlug);
    if (!tenant) return log("❌ Tenant no encontrado.");

    const def = TENANTS_DEF.find(d => d.slug === tenantSlug);
    if (!def) return log("❌ Definición de Tenant no encontrada para credenciales.");

    log(`🔐 Autenticando como Admin de ${tenant.name}...`);
    const tenantToken = await loginUser(def.adminEmail, '123456');
    if (!tenantToken) return log(`❌ No se pudo conectar a ${tenantSlug}`);

    log(`🚀 Inyectando data AVANZADA en ${tenantSlug} (${def.industry})...`);

    // API Helper
    const api = async (endpoint, method = 'GET', body = null) => {
        const headers = {
            'Authorization': `Bearer ${tenantToken}`,
            'x-tenant-slug': tenantSlug
        };
        if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
        return await fetch(`${API_URL}${endpoint}`, { method, headers, body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : null });
    };

    // Pre-fetch placeholder image once to save bandwidth
    let imgBlob = null;
    if (withPhotos) {
        try {
            const r = await fetch('https://picsum.photos/300/300?blur=2');
            imgBlob = await r.blob();
        } catch (e) { log("⚠️ No internet for photos"); }
    }

    for (let i = 1; i <= patientCount; i++) {
        // 1. CREATE PATIENT / CLIENT
        let payload = {};
        const industry = def.industry; // VET, EVENTS, CLINICAL

        if (industry === 'VET') {
            payload = {
                name: `${random(PET_NAMES)} (${random(PET_BREEDS)})`.toUpperCase(),
                birthDate: randomDatePast(60),
                occupation: 'Mascota',
                address: `Dueño: ${random(FIRST_NAMES)} ${random(LAST_NAMES)}`,
                status: 'ACTIVE'
            };
        } else if (industry === 'EVENTS') {
            payload = {
                name: `${random(FIRST_NAMES)} ${random(LAST_NAMES)}`.toUpperCase(),
                birthDate: randomDatePast(400),
                occupation: 'Expositor VIP',
                address: random(COMPANIES), // Company Name
                status: 'ACTIVE'
            };
        } else {
            payload = {
                name: `${random(FIRST_NAMES)} ${random(LAST_NAMES)}`.toUpperCase(),
                birthDate: randomDatePast(500),
                occupation: 'Paciente',
                address: 'Lima, Perú',
                status: 'ACTIVE'
            };
        }

        const pRes = await api('/patients', 'POST', payload);
        if (!pRes.ok) {
            const errTxt = await pRes.text();
            console.log(`\n❌ Error creando paciente: ${pRes.status} - ${errTxt}`);
            continue;
        }
        const patient = await pRes.json();
        console.log(`   👤 Paciente creado: ${patient.name} (ID: ${patient.id})`); // 👈 PRINT ID FOR DEBUG

        // 2. CREATE 5 VISITS & 5 PHOTOS
        for (let j = 1; j <= 5; j++) {
            let note = "";
            let jsonEval = {};

            if (industry === 'VET') {
                note = `Visita de control #${j}. Mascota estable.`;
                jsonEval = {
                    animal_name: random(PET_NAMES),
                    breed: random(PET_BREEDS),
                    last_vaccine_date: randomDatePast(12),
                    weight: `${randomInt(5, 40)}kg`,
                    fur_color: random(["Negro", "Blanco", "Marrón", "Manchado"])
                };
            } else if (industry === 'EVENTS') {
                note = `Ingreso día #${j}. Revisión de stand y materiales.`;
                jsonEval = {
                    booth_number: `A-${randomInt(1, 100)}`,
                    ticket_type: random(["VIP", "General", "Staff"]),
                    check_in_time: new Date().toLocaleTimeString()
                };
            } else {
                note = `Consulta médica #${j}. Paciente refiere mejoría leve.`;
                jsonEval = {
                    blood_pressure: `${randomInt(100, 140)}/${randomInt(60, 90)}`,
                    temp: `${(36.5 + Math.random()).toFixed(1)}°C`,
                    diagnosis: random(["Gripe", "Dermatitis", "Control", "Alergia", "Migraña"]),
                    weight: `${randomInt(50, 100)}kg`
                };
            }

            const recRes = await api(`/patients/${patient.id}/records`, 'POST', {
                title: industry === 'EVENTS' ? `CHECK-IN DÍA ${j}` : `CONSULTA DE SEGUIMIENTO ${j}`,
                date: randomDatePast(j * 2), // Spread dates
                notes: note,
                evaluation: jsonEval
            });

            if (recRes.ok) {
                const record = await recRes.json();

                // 3. CREATE 5 PHOTOS PER VISIT
                if (withPhotos && imgBlob) {
                    for (let k = 0; k < 5; k++) {
                        const fd = new FormData();
                        fd.append('files', imgBlob, `evidencia_${k}.jpg`);
                        await api(`/patients/records/${record.id}/photos`, 'POST', fd);
                    }
                }
            }
        }

        // 4. CREATE 5 APPOINTMENTS
        for (let a = 0; a < 5; a++) { // Start from 0 to include today
            const appDate = new Date();
            appDate.setDate(appDate.getDate() + a); // Today, Tomorrow, etc.
            appDate.setHours(9 + a, 0, 0, 0);

            const endDate = new Date(appDate);
            endDate.setMinutes(endDate.getMinutes() + 30);

            const appPayload = {
                patientId: patient.id,
                title: `Cita de Control #${a + 1}`,
                start: appDate.toISOString(),
                end: endDate.toISOString(),
                type: 'CONSULTA',
                notes: 'Generada automáticamente por Seed.'
            };

            await api('/appointments', 'POST', appPayload);
        }
        process.stdout.write("."); // 1 dot per patient fully processed
    }
    log(`\n✅ ${patientCount} clientes creados en ${tenantSlug} (con 6 visitas y fotos c/u).`);
}

async function cleanData(tenantSlug) {
    const listRes = await fetch(`${API_URL}/tenants`, {
        headers: { 'Authorization': `Bearer ${SUPER_TOKEN}`, 'x-tenant-slug': 'global-admin' }
    });

    if (!listRes.ok) return log(`❌ Error listando tenants: ${listRes.status}`);

    const tenants = await listRes.json();
    const tenant = tenants.find(t => t.slug === tenantSlug);
    if (!tenant) return log("❌ Tenant no encontrado.");

    log(`🗑️ Eliminando pacientes de ${tenantSlug} (ID: ${tenant.id})...`);

    // Usamos el token de Admin del Tenant para limpiar, o del SuperAdmin si tiene permisos cross-tenant (usualmente con x-tenant-id)
    // Para simplificar, obtenemos token del tenant admin.

    const def = TENANTS_DEF.find(d => d.slug === tenantSlug);
    let tokenToUse = SUPER_TOKEN;

    if (def) {
        const tToken = await loginUser(def.adminEmail, '123456');
        if (tToken) tokenToUse = tToken;
    }

    const headers = {
        'Authorization': `Bearer ${tokenToUse}`,
        'x-tenant-slug': tenantSlug
    };

    // 1. Listar (Limitamos a 1000 para esta prueba)
    const res = await fetch(`${API_URL}/patients?limit=1000`, { headers });

    if (!res.ok) {
        log(`❌ Error al listar pacientes para borrar: ${res.status}`);
        return;
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.data || []);

    if (items.length === 0) {
        log("✅ No hay datos para borrar.");
        return;
    }

    log(`⚠️ Encontrados ${items.length} registros. Borrando...`);

    for (const item of items) {
        process.stdout.write("🔥");
        await fetch(`${API_URL}/patients/${item.id}`, { method: 'DELETE', headers });
    }
    log("\n✅ Limpo.");
}

async function seedModules() {
    log("🧩 Verificando Catálogo de Módulos (Marketplace)...");

    // We need to insert into 'marketplace_modules' table via API.
    for (const mod of MODULES_DEF) {
        // We need a super admin token
        const res = await fetch(`${API_URL}/marketplace/modules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPER_TOKEN}`,
                'x-tenant-slug': 'global-admin'
            },
            body: JSON.stringify(mod)
        });

        if (res.ok) {
            process.stdout.write("📦");
        } else {
            // If 409 (Conflict), it means it exists, which is fine.
            if (res.status !== 409) {
                log(`\n⚠️ Error seeding module ${mod.code}: ${res.status}`);
            }
        }
    }
    log("✅ Catálogo de Módulos sincronizado.");
}

// STAFF DEFINITIONS
const STAFF_DEF = [
    { tenantSlug: 'clinica-solderma', email: 'doctor@solderma.com', name: 'Dr. Alejandro G.', role: 'DOCTOR', password: '123456' },
    { tenantSlug: 'dr-pets', email: 'vet@drpets.com', name: 'M.V. Sarah Connor', role: 'DOCTOR', password: '123456' }, // VETERINARIO -> DOCTOR
    { tenantSlug: 'aspeten-events', email: 'staff@aspeten.com', name: 'Lic. Juan Perez', role: 'STAFF', password: '123456' } // COORDINADOR -> STAFF
];

async function seedStaff() {
    log("👥 Creando Staff Operativo (Doctores/Vets)...");

    for (const staff of STAFF_DEF) {
        // 1. Get Tenant Token
        const tenantDef = TENANTS_DEF.find(t => t.slug === staff.tenantSlug);
        if (!tenantDef) continue;

        const tenantToken = await loginUser(tenantDef.adminEmail, '123456');
        if (!tenantToken) {
            log(`⚠️ No se pudo loguear como admin de ${staff.tenantSlug} para crear staff.`);
            continue;
        }

        // 2. Create User
        // Need to know the endpoint for creating users. Usually POST /users within tenant context.
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tenantToken}`,
                'x-tenant-slug': staff.tenantSlug
            },
            body: JSON.stringify({
                email: staff.email,
                password: staff.password,
                fullName: staff.name,
                role: staff.role
            })
        });

        if (res.ok) {
            // log(`   ✅ Staff creado: ${staff.email} en ${staff.tenantSlug}`);
        } else {
            const txt = await res.text();
            if (!txt.includes('Duplicate entry') && !txt.includes('ya existe')) {
                log(`   ⚠️ Error creando staff ${staff.email}: ${res.status}`);
            }
        }
    }
    log("✅ Staff operativo verificado.");
}

// --- MENU ---

async function runAuto() {
    log("🚀 AUTO SEEDING DEMO DATA (PILOT TENANTS)...");
    if (!await waitForBackend()) process.exit(1);

    if (!await loginSuper()) process.exit(1);

    log("--- 1. CREATING TENANTS ---");
    for (const def of TENANTS_DEF) {
        await createTenant(def);
    }
    await seedModules();
    await seedStaff();

    // ... rest of logic
    log("--- 2. SEED DATA GENERATION ---");
    await seedData('clinica-solderma', 5, true);
    await seedData('dr-pets', 5, true);
    await seedData('aspeten-events', 10, false);

    log("✅ AUTO SEED COMPLETED");
    process.exit(0);
}

async function main() {
    // Check for auto flag
    if (process.argv.includes('--auto')) {
        return runAuto();
    }

    log(`
    🌍 SEEDER 2.7 - WORLD BUILDER
    =============================
    `);

    if (!await waitForBackend()) process.exit(1);

    if (!await loginSuper()) {
        log("❌ No se pudo conectar como Super Admin.");
        process.exit(1);
    }

    // Always sync catalog on start? No, only on demand or update.
    // Let's do it quietly at start of menu to ensure integrity
    await seedModules();
    await seedStaff();

    while (true) {
        console.log(`
        1. 🏭 Crear Tenants (Solderma, Dr. Pets, Aspeten)
        2. 👥 Poblar Solderma (Clínica)
        3. 🐾 Poblar Dr. Pets (Veterinaria)
        4. 🎫 Poblar Aspeten (Eventos)
        9. 🚀 Poblar TODAS (Solderma + Pets + Aspeten)
        5. 🧹 Limpiar Data de un Tenant
        0. Salir
        `);

        const ans = await ask("Opción: ");

        if (ans === '0') break;

        if (ans === '1') {
            for (const def of TENANTS_DEF) {
                const want = await ask(`¿Crear ${def.name}? (S/n): `);
                if (want.toLowerCase() !== 'n') {
                    await createTenant(def);
                }
            }
        }

        if (ans === '2') await seedData('clinica-solderma', 5, true);
        if (ans === '3') await seedData('dr-pets', 5, true);
        if (ans === '4') await seedData('el-mundo-de-sara', 10, false); // Events usually no photos

        if (ans === '9') {
            log("🚀 Poblando TODAS las empresas...");
            await seedData('clinica-solderma', 5, true);
            await seedData('dr-pets', 5, true);
            await seedData('el-mundo-de-sara', 10, false);
            log("✅ Carga masiva completada.");
        }

        if (ans === '5') {
            log("\n   🧹 SELECCIONE TENANT A LIMPIAR:");
            TENANTS_DEF.forEach((def, idx) => {
                log(`   ${idx + 1}. ${def.name} (${def.slug})`);
            });
            log("   99. TODAS LAS EMPRESAS");
            log("   0. Cancelar");

            const tOpt = await ask("   Opción: ");
            if (tOpt === '0') continue;

            if (tOpt === '99') {
                for (const def of TENANTS_DEF) {
                    await cleanData(def.slug);
                }
            } else {
                const tIdx = parseInt(tOpt) - 1;

                if (TENANTS_DEF[tIdx]) {
                    await cleanData(TENANTS_DEF[tIdx].slug);
                } else {
                    log("❌ Opción inválida.");
                }
            }
        }
    }

    process.exit(0);
}

main();
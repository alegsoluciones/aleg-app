
const { DataSource } = require('../backend/node_modules/typeorm');
const readline = require('readline');

// CONFIG
const DB_CONFIG = {
    type: 'mysql',
    host: 'localhost',
    port: 3307,
    username: 'root',
    password: 'root',
    database: 'aleg_global',
};

async function sabotage() {
    console.log("🔥 SABOTAGE PROTOCOL INITIATED...");

    const dataSource = new DataSource(DB_CONFIG);
    await dataSource.initialize();
    console.log("✅ DB Connected");

    // 1. Get Tenant
    const tenants = await dataSource.query(`SELECT id, name, slug, config FROM tenant`);

    // 2. Target Config
    const args = process.argv.slice(2);
    const slugArgIndex = args.indexOf('--slug');
    let targetSlug = slugArgIndex !== -1 ? args[slugArgIndex + 1] : null;

    let tenant;
    if (targetSlug) {
        tenant = tenants.find(t => t.slug === targetSlug);
        if (!tenant) {
            console.error(`❌ Tenant with slug '${targetSlug}' not found.`);
            process.exit(1);
        }
    } else {
        console.log("\n🎯 ACTIVE TENANTS:");
        tenants.forEach((t, i) => console.log(`   [${i}] ${t.name} (${t.slug})`));

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        await new Promise(resolve => {
            rl.question('\nSelect Tenant Index to SABOTAGE [0]: ', (idx) => {
                const i = parseInt(idx) || 0;
                tenant = tenants[i];
                rl.close();
                resolve();
            });
        });
    }

    if (!tenant) {
        console.error("❌ Invalid selection");
        process.exit(1);
    }

    console.log(`\n🔪 Target: ${tenant.name} (${tenant.slug})`);
    console.log(`   Removing 'mod_appointments' access...`);

    // A. RELATIONAL DESTRUCTION
    await dataSource.query(`
        DELETE tm FROM tenant_modules tm
        JOIN marketplace_modules mm ON tm.moduleCode = mm.code 
        WHERE tm.tenantId = '${tenant.id}' AND mm.code = 'mod_appointments'
    `).catch(e => console.log("   (Info) Complex delete failed, trying simple..."));

    await dataSource.query(`DELETE FROM tenant_modules WHERE tenantId = '${tenant.id}' AND moduleCode = 'mod_appointments'`).catch(() => { });


    // B. JSON DESTRUCTION
    let config = tenant.config;
    if (typeof config === 'string') config = JSON.parse(config);

    if (config.active_modules && Array.isArray(config.active_modules)) {
        config.active_modules = config.active_modules.filter(m => m !== 'mod_appointments');
        console.log("   (JSON) 'mod_appointments' purged from config.active_modules");

        await dataSource.query(`UPDATE tenant SET config = ? WHERE id = ?`, [JSON.stringify(config), tenant.id]);
        console.log("   ✅ JSON Config Updated");
    } else {
        console.log("   ⚠️ No active_modules array found in config.");
    }

    console.log("\n💀 SABOTAGE COMPLETE. 'mod_appointments' has been removed.");
    await dataSource.destroy();
    process.exit(0);
}

sabotage().catch(console.error);

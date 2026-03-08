const mysql = require('mysql2/promise');

async function checkAdminStatus() {
    console.log('Connecting to database...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'aleg_global',
            port: 3307
        });

        console.log('Connected!');

        const [dbName] = await connection.execute('SELECT DATABASE() as db');
        console.log('Current DB:', dbName[0].db);

        // 1. Get Admin User
        const [users] = await connection.execute(
            `SELECT * FROM users WHERE email = 'superadmin@alegapp.com'`
        ); // Select * to see all columns

        if (users.length === 0) {
            console.error('❌ Super Admin user not found!');
            process.exit(1);
        }

        const user = users[0];
        console.log('👤 User found:', user.email, 'Role:', user.role, 'TenantID:', user.tenantId);

        // 2. Check System Tenant
        // Use backticks for safety
        const [tenants] = await connection.execute(
            `SELECT * FROM \`tenants\` WHERE id = ?`,
            [user.tenantId]
        );

        if (tenants.length === 0) {
            console.error('❌ Tenant not found for this user!');
            // Let's list all tenants to see what's there
            const [allTenants] = await connection.execute('SELECT id, name FROM tenants LIMIT 5');
            console.log('Existing Tenants:', allTenants);
            process.exit(1);
        }

        const tenant = tenants[0];
        console.log('🏢 Tenant:', tenant.name, 'Status:', tenant.status);

        // 3. Check Subscriptions
        const [subs] = await connection.execute(
            `SELECT * FROM \`subscriptions\` WHERE tenantId = ?`,
            [user.tenantId]
        );

        console.log('📜 Subscriptions Count:', subs.length);
        subs.forEach(s => {
            console.log(`- ID: ${s.id}, Status: ${s.status}, End: ${s.endDate}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

checkAdminStatus();

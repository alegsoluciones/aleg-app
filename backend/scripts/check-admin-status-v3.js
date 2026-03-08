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

        // 1. Get Admin User
        const [users] = await connection.execute(
            `SELECT id, email, role, tenantId FROM users WHERE email = 'superadmin@alegapp.com'`
        );

        if (users.length === 0) {
            console.error('❌ Super Admin user not found!');
            process.exit(1);
        }

        const user = users[0];
        console.log('👤 User: ' + user.email + ' | TenantID: ' + user.tenantId);

        // 2. Check System Tenant (Table: tenant)
        const [tenants] = await connection.execute(
            `SELECT id, name, status, slug FROM tenant WHERE id = ?`,
            [user.tenantId]
        );

        if (tenants.length === 0) {
            console.error('❌ Tenant not found!');
            process.exit(1);
        }

        const tenant = tenants[0];
        console.log('🏢 Tenant: ' + tenant.name + ' | Status: ' + tenant.status);

        if (tenant.status !== 'ACTIVE') {
            console.error('❌ Tenant is NOT ACTIVE');
        } else {
            console.log('✅ Tenant is ACTIVE');
        }

        // 3. Check Subscriptions (Table: subscriptions)
        const [subs] = await connection.execute(
            `SELECT id, status, startDate, endDate FROM subscriptions WHERE tenantId = ?`,
            [user.tenantId]
        );

        console.log(`📜 Subscriptions Found: ${subs.length}`);

        let valid = false;
        subs.forEach(s => {
            const endDate = new Date(s.endDate);
            const now = new Date();
            console.log(`- Status: ${s.status} | End: ${s.endDate}`);

            if (s.status === 'ACTIVE' && endDate > now) {
                valid = true;
            }
        });

        if (valid) {
            console.log('✅ System has a VALID, ACTIVE subscription.');
        } else {
            console.error('❌ System Subscription is INVALID or EXPIRED.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}
checkAdminStatus();

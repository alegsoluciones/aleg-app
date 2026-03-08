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
        console.log('👤 User:', user);

        // 2. Check System Tenant
        const systemTenantId = '00000000-0000-0000-0000-000000000000';

        if (user.tenantId !== systemTenantId) {
            console.error(`⚠️ User tenantId IS NOT system tenant! Found: ${user.tenantId}, Expected: ${systemTenantId}`);
            // Fix it? No, just report for now.
        }

        const [tenants] = await connection.execute(
            `SELECT id, name, status, slug FROM tenants WHERE id = ?`,
            [user.tenantId]
        );

        if (tenants.length === 0) {
            console.error('❌ Tenant not found for this user!');
            process.exit(1);
        }

        const tenant = tenants[0];
        console.log('🏢 Tenant:', tenant);

        if (tenant.status !== 'ACTIVE') {
            console.error(`❌ Tenant status is ${tenant.status}! Should be ACTIVE`);
        } else {
            console.log('✅ Tenant status is ACTIVE');
        }

        // 3. Get Subscriptions
        const [subs] = await connection.execute(
            `SELECT id, status, startDate, endDate, planDetails FROM subscriptions WHERE tenantId = ?`,
            [user.tenantId]
        );

        console.log('📜 Subscriptions:', subs);

        const activeSub = subs.find(s => s.status === 'ACTIVE');
        if (activeSub) {
            console.log('✅ Found ACTIVE subscription');
            const now = new Date();
            const endDate = new Date(activeSub.endDate);

            console.log(`📅 Now: ${now.toISOString()}, End: ${endDate.toISOString()}`);

            if (endDate > now) {
                console.log('✅ Subscription is valid (not expired)');
            } else {
                console.error('❌ Subscription is EXPIRED');
            }
        } else {
            console.error('❌ No ACTIVE subscription found!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkAdminStatus();

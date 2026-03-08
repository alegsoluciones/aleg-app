const mysql = require('mysql2/promise');

async function checkAdminRole() {
    console.log('Connecting to database with hardcoded credentials...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'aleg_global',
            port: 3307
        });

        console.log('Connected!');

        const [rows] = await connection.execute(
            `SELECT id, email, role, tenantId FROM users WHERE email = 'superadmin@alegapp.com'`
        );

        console.log('Super Admin User:', rows);

        if (rows.length === 0) {
            console.error('❌ Super Admin user not found!');
        } else {
            const user = rows[0];
            if (user.role === 'SUPER_ADMIN') {
                console.log('✅ User has SUPER_ADMIN role');
            } else {
                console.error(`❌ User has role: ${user.role}, expected SUPER_ADMIN`);
            }
        }

        await connection.end();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAdminRole();

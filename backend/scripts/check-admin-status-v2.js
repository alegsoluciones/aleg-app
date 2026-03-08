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

        const [rows] = await connection.execute('SELECT * FROM users LIMIT 1');
        console.log('User check:', rows);

        const [tenants] = await connection.execute('SELECT * FROM tenants LIMIT 1');
        console.log('Tenant check:', tenants);

    } catch (error) {
        console.error('FULL ERROR:', error);
    } finally {
        if (connection) await connection.end();
    }
}
checkAdminStatus();

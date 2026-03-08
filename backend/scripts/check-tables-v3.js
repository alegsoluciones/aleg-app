const mysql = require('mysql2/promise');

async function check() {
    console.log('Connecting...');
    const conn = await mysql.createConnection({
        host: 'localhost', user: 'root', password: 'root', database: 'aleg_global', port: 3307
    });

    const [files] = await conn.execute('SHOW TABLES');
    console.log('Tables:', files);

    try {
        const [rows] = await conn.execute('SELECT * FROM `tenants` LIMIT 1');
        console.log('Success tenants:', rows);
    } catch (e) {
        console.error('Failed tenants:', e.message);
    }

    try {
        const [rows] = await conn.execute('SELECT * FROM `Tenants` LIMIT 1');
        console.log('Success Tenants (Cap):', rows);
    } catch (e) {
        console.error('Failed Tenants (Cap):', e.message);
    }

    await conn.end();
}
check();

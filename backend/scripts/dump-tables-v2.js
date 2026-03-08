const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: 'localhost', user: 'root', password: 'root', database: 'aleg_global', port: 3307
    });

    const [rows] = await conn.execute('SHOW TABLES');

    console.log('--- TABLES START ---');
    rows.forEach(r => {
        // dynamic key access
        const tableName = Object.values(r)[0];
        console.log(`[${tableName}]`);
    });
    console.log('--- TABLES END ---');

    await conn.end();
}
check();

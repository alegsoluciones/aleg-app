const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: 'localhost', user: 'root', password: 'root', database: 'aleg_global', port: 3307
    });

    const [rows] = await conn.execute('SHOW TABLES');
    console.log(JSON.stringify(rows, null, 2)); // FULL DUMP

    await conn.end();
}
check();

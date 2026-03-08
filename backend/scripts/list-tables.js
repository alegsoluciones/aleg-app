const mysql = require('mysql2/promise');

async function listTables() {
    console.log('Connecting to database...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'aleg_global',
            port: 3307
        });

        console.log('Connected!');

        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables:', rows);

        await connection.end();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listTables();

const mysql = require('mysql2/promise');

async function checkPlans() {
    console.log('Connecting to database...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root_password_segura',
            database: 'aleg_global'
        });
        console.log('Connected!');

        const [rows] = await connection.execute('SELECT * FROM plans');
        console.log('Plans found:', rows.length);
        if (rows.length > 0) {
            console.table(rows);
        } else {
            console.log('No plans found in the database.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkPlans();

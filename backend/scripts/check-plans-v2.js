require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPlans() {
    console.log('Connecting to database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'aleg_global'
        });
        console.log('Connected!');

        const [rows] = await connection.execute('SELECT * FROM plans');
        console.log('Plans found:', rows.length);
        if (rows.length > 0) {
            console.table(rows);
        } else {
            console.log('✅ No plans found in the database. (Expected empty state)');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkPlans();

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkDateType() {
    console.log('Connecting to database...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'aleg_global',
            port: parseInt(process.env.DB_PORT || '3306')
        });

        console.log('Connected!');

        const [rows] = await connection.execute(
            `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME IN ('startDate', 'endDate')`,
            [process.env.DB_NAME || 'aleg_global']
        );

        console.log('Columns found:', rows);

        const endDateRow = rows.find(r => r.COLUMN_NAME === 'endDate');

        if (!endDateRow) {
            console.error('❌ endDate column not found!');
            process.exit(1);
        }

        if (endDateRow.DATA_TYPE === 'datetime') { // OR 'timestamp' but checking for change
            console.log(`✅ endDate is ${endDateRow.DATA_TYPE}`);
            if (endDateRow.DATA_TYPE === 'datetime') {
                console.log('✅ Matches expectation: datetime');
            } else {
                console.log('⚠️ Warning: Still timestamp?');
            }
        } else {
            console.error(`❌ Failure: endDate is ${endDateRow.DATA_TYPE}`);
        }

        await connection.end();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkDateType();

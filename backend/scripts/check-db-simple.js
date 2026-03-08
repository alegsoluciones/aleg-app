const mysql = require('mysql2/promise');

async function checkDateType() {
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
            `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = 'aleg_global' AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME IN ('startDate', 'endDate')`
        );

        console.log('Columns found:', rows);

        const endDateRow = rows.find(r => r.COLUMN_NAME === 'endDate');

        if (!endDateRow) {
            console.error('❌ endDate column not found!');
            process.exit(1);
        }

        console.log(`endDate DATA_TYPE: ${endDateRow.DATA_TYPE}`);

        if (endDateRow.DATA_TYPE === 'datetime') {
            console.log('✅ Success: endDate is datetime');
        } else {
            console.error(`❌ Failure: endDate is ${endDateRow.DATA_TYPE}, expected datetime`);
            process.exit(1);
        }

        await connection.end();

    } catch (error) {
        console.error('Error Stack:', error.stack);
        process.exit(1);
    }
}

checkDateType();

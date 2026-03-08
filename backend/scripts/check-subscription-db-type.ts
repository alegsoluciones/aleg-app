import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkDateType() {
    const connection = await createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'aleg_global',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        const [rows] = await connection.execute(
            `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME IN ('startDate', 'endDate')`,
            [process.env.DB_NAME || 'aleg_global']
        );

        console.log('Columns found:', rows);

        const endDateRow = (rows as any[]).find(r => r.COLUMN_NAME === 'endDate');

        if (!endDateRow) {
            console.error('❌ endDate column not found!');
            process.exit(1);
        }

        if (endDateRow.DATA_TYPE === 'datetime') {
            console.log('✅ Success: endDate is datetime');
        } else {
            console.error(`❌ Failure: endDate is ${endDateRow.DATA_TYPE}, expected datetime`);
            process.exit(1);
        }

    } catch (error) {
        console.error('Error querying database:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

checkDateType();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'aleg_global',
    });

    try {
        console.log('Connected to database.');

        const [rows] = await connection.execute(`
            SELECT TABLE_NAME, CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_NAME = 'marketplace_modules' 
            AND TABLE_SCHEMA = ?;
        `, [process.env.DB_NAME || 'aleg_global']);

        if (rows.length === 0) {
            console.log('No foreign keys found referencing marketplace_modules.');
        } else {
            console.log(`Found ${rows.length} foreign keys referencing marketplace_modules.`);
            for (const row of rows) {
                console.log(`Dropping FK ${row.CONSTRAINT_NAME} on table ${row.TABLE_NAME}...`);
                await connection.execute(`ALTER TABLE \`${row.TABLE_NAME}\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``);
                
                // Also drop the index if it exists and has the same name (common in MySQL)
                // However, we should be careful not to drop other indexes. 
                // Usually dropping FK is enough for the primary key drop on the referenced table to succeed.
            }
            console.log('All conflicting foreign keys dropped.');
        }

    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await connection.end();
    }
}

fixSchema();

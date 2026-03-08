require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedPlans() {
    console.log('Connecting to database...');
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'aleg_global'
    };
    console.log(`Config: ${config.host}:${config.port}, User: ${config.user}, DB: ${config.database}`);

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Connected!');

        // Check using correct table name: saas_plans
        const [rows] = await connection.execute('SELECT * FROM saas_plans');
        console.log(`Current Plans: ${rows.length}`);

        if (rows.length === 0) {
            console.log('🌱 Seeding initial plan...');
            const sql = `
                INSERT INTO saas_plans (id, name, slug, price, currency, billingCycle, features, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            const uuid = require('crypto').randomUUID();
            const features = JSON.stringify(['Multi-Tenant', 'Advanced Analytics', 'Priority Support']);

            await connection.execute(sql, [
                uuid,
                'Pro Plan',
                'pro-monthly',
                '29.99',
                'USD',
                'MONTHLY',
                features,
                true
            ]);
            console.log('✨ Seeded "Pro Plan" successfully!');
        } else {
            console.log('Plans already exist. No action needed.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

seedPlans();

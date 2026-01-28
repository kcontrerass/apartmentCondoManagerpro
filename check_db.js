const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumn() {
    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        const [rows] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'invoices' 
      AND COLUMN_NAME = 'payment_method';
    `);

        console.log('Column check result:', rows);

        const [allColumns] = await connection.execute(`
       SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'railway'
       AND TABLE_NAME = 'invoices';
    `);
        console.log('All columns in invoices:', allColumns.map(r => r.COLUMN_NAME));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkColumn();

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use DATABASE_URL for Postgres/MySQL, or fallback to local MySQL/SQLite
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, { 
      logging: false,
      dialectOptions: process.env.DATABASE_URL.includes('mysql') ? {} : { ssl: { rejectUnauthorized: false } }
    })
  : new Sequelize(
      process.env.DB_NAME || 'aviator',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DATABASE_URL?.includes('postgres') ? 'postgres' : 'mysql',
        logging: false
      }
    );

// Test Connection
sequelize.authenticate()
  .then(() => console.log('✅ MySQL Database Connected Successfully'))
  .catch(err => console.error('❌ Unable to connect to the database:', err.message));

module.exports = sequelize;

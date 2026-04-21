const { User } = require('./src/models');
const sequelize = require('./src/config/db');

async function debug() {
  try {
    await sequelize.authenticate();
    const count = await User.count();
    console.log('--- DEBUG INFO ---');
    console.log('Database Connected Successfully');
    console.log('Total Users in DB:', count);
    const users = await User.findAll({ attributes: ['username'] });
    console.log('Usernames:', users.map(u => u.username));
    process.exit(0);
  } catch (e) {
    console.error('--- DEBUG ERROR ---');
    console.error(e.message);
    process.exit(1);
  }
}

debug();

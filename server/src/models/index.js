const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// User Model
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1000.00 },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Round Model
const Round = sequelize.define('Round', {
  serverSeed: { type: DataTypes.STRING, allowNull: false },
  clientSeed: { type: DataTypes.STRING, allowNull: false },
  crashPoint: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('WAITING', 'FLYING', 'CRASHED'), defaultValue: 'WAITING' }
});

// Bet Model
const Bet = sequelize.define('Bet', {
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cashoutMultiplier: { type: DataTypes.DECIMAL(10, 2) },
  winAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  cashedOut: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Relations
User.hasMany(Bet);
Bet.belongsTo(User);

Round.hasMany(Bet);
Bet.belongsTo(Round);

module.exports = { User, Round, Bet };

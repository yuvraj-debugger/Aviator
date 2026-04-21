const express = require('express');
const router = express.Router();
const { User, Round, Bet } = require('../models');

// Middleware to ensure user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Live Monitor (requires engine instance)
router.get('/live', isAdmin, (req, res) => {
  const engine = req.app.get('gameEngine');
  res.json({
    status: engine.gameState.status,
    multiplier: engine.gameState.multiplier,
    activeBets: engine.gameState.currentBets.map(b => ({
      name: b.name,
      amount: b.amount,
      cashedOut: b.cashedOut
    })),
    totalRoundBets: engine.gameState.currentBets.reduce((acc, b) => acc + b.amount, 0)
  });
});

// User Management
router.get('/users', isAdmin, async (req, res) => {
  const users = await User.findAll({ 
    attributes: ['id', 'username', 'balance', 'isAdmin', 'createdAt'],
    order: [['createdAt', 'DESC']]
  });
  res.json(users);
});

router.post('/users/:id/balance', isAdmin, async (req, res) => {
  const { balance } = req.body;
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  await user.update({ balance });
  res.json(user);
});

// Round History
router.get('/rounds', isAdmin, async (req, res) => {
  const rounds = await Round.findAll({ 
    limit: 50, 
    order: [['createdAt', 'DESC']],
    include: [{ model: Bet }]
  });
  res.json(rounds);
});

module.exports = router;

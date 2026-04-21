const { Round, Bet, User } = require('../models');
const { generateCrashPoint } = require('../utils/provablyFair');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class GameEngine {
  constructor(io) {
    this.io = io;
    this.gameState = {
      status: 'WAITING',
      multiplier: 1.00,
      startTime: Date.now() + 10000,
      currentRound: null,
      history: []
    };
    this.gameLoop = null;
  }

  async init() {
    // Load last 10 rounds for history
    const pastRounds = await Round.findAll({
      where: { status: 'CRASHED' },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    this.gameState.history = pastRounds.map(r => parseFloat(r.crashPoint));
    
    this.startWaiting();
  }

  async startWaiting() {
    this.gameState.status = 'WAITING';
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const clientSeed = 'aviator-main-seed'; // In production, this can be dynamic
    const crashPoint = generateCrashPoint(serverSeed, clientSeed);

    this.gameState.currentRound = await Round.create({
      serverSeed,
      clientSeed,
      crashPoint,
      status: 'WAITING'
    });

    this.gameState.startTime = Date.now() + 10000;
    this.gameState.multiplier = 1.00;

    this.io.emit('gameUpdate', {
      status: 'WAITING',
      timeToStart: 10000,
      history: this.gameState.history,
      roundId: this.gameState.currentRound.id
    });

    setTimeout(() => this.startFlying(), 10000);
  }

  async startFlying() {
    this.gameState.status = 'FLYING';
    this.gameState.startTime = Date.now();
    await this.gameState.currentRound.update({ status: 'FLYING' });

    this.io.emit('gameUpdate', { status: 'FLYING', multiplier: 1.00 });

    this.gameLoop = setInterval(async () => {
      const elapsed = (Date.now() - this.gameState.startTime) / 1000;
      this.gameState.multiplier = parseFloat(Math.pow(Math.E, 0.08 * elapsed).toFixed(2));

      if (this.gameState.multiplier >= parseFloat(this.gameState.currentRound.crashPoint)) {
        clearInterval(this.gameLoop);
        this.crashGame();
      } else {
        this.io.emit('multiplierUpdate', { multiplier: this.gameState.multiplier });
      }
    }, 100);
  }

  async crashGame() {
    this.gameState.status = 'CRASHED';
    await this.gameState.currentRound.update({ 
      status: 'CRASHED',
      crashPoint: this.gameState.multiplier 
    });

    this.gameState.history.unshift(this.gameState.multiplier);
    if (this.gameState.history.length > 10) this.gameState.history.pop();

    this.io.emit('gameUpdate', {
      status: 'CRASHED',
      crashPoint: this.gameState.multiplier,
      history: this.gameState.history
    });

    setTimeout(() => this.startWaiting(), 5000);
  }

  async placeBet(userId, socketId, amount) {
    if (this.gameState.status !== 'WAITING') throw new Error('Round already started');
    
    const user = await User.findByPk(userId);
    if (user.balance < amount) throw new Error('Insufficient balance');

    await user.decrement('balance', { by: amount });
    const bet = await Bet.create({
      UserId: userId,
      RoundId: this.gameState.currentRound.id,
      amount
    });

    return { bet, balance: user.balance - amount };
  }

  async cashOut(userId, socketId) {
    if (this.gameState.status !== 'FLYING') throw new Error('Game not flying');

    const bet = await Bet.findOne({
      where: { 
        UserId: userId, 
        RoundId: this.gameState.currentRound.id,
        cashedOut: false 
      }
    });

    if (!bet) throw new Error('No active bet');

    const winAmount = bet.amount * this.gameState.multiplier;
    await bet.update({
      cashedOut: true,
      cashoutMultiplier: this.gameState.multiplier,
      winAmount
    });

    const user = await User.findByPk(userId);
    await user.increment('balance', { by: winAmount });

    return { bet, winAmount, balance: parseFloat(user.balance) + parseFloat(winAmount) };
  }
}

module.exports = GameEngine;

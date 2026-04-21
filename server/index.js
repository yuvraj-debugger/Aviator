const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.get('/', (req, res) => {
  res.send('<h1>Aviator Server is running</h1><p>Socket.IO is listening on this port.</p>');
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let gameState = {
  status: 'WAITING', // WAITING, FLYING, CRASHED
  multiplier: 1.00,
  startTime: null,
  crashPoint: 0,
  history: [],
  players: {}, // socketId: { name, bet, cashoutAt, balance }
  currentBets: []
};

const GAME_CONFIG = {
  WAITING_TIME: 10000,
  CRASHED_TIME: 5000,
  TICK_RATE: 100,
  GROWTH_RATE: 0.05 // Adjusted for smooth growth
};

function generateCrashPoint() {
  // 3% house edge: 1.00x crash happens 3% of the time
  if (Math.random() < 0.03) return 1.00;
  
  // Standard multiplier distribution formula
  const e = Math.pow(2, 32);
  const h = Math.floor(Math.random() * e);
  const point = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1.0, point);
}

function resetRound() {
  gameState.status = 'WAITING';
  gameState.multiplier = 1.00;
  gameState.startTime = Date.now() + GAME_CONFIG.WAITING_TIME;
  gameState.crashPoint = generateCrashPoint();
  gameState.currentBets = [];
  
  io.emit('gameUpdate', {
    status: gameState.status,
    multiplier: gameState.multiplier,
    timeToStart: GAME_CONFIG.WAITING_TIME,
    history: gameState.history
  });

  setTimeout(startFlying, GAME_CONFIG.WAITING_TIME);
}

function startFlying() {
  gameState.status = 'FLYING';
  gameState.startTime = Date.now();
  
  io.emit('gameUpdate', {
    status: gameState.status,
    multiplier: gameState.multiplier
  });

  const gameLoop = setInterval(() => {
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    // Growth formula: 1.00 * e^(0.06 * elapsed)
    gameState.multiplier = parseFloat(Math.pow(Math.E, 0.08 * elapsed).toFixed(2));

    if (gameState.multiplier >= gameState.crashPoint) {
      clearInterval(gameLoop);
      crashGame();
    } else {
      io.emit('multiplierUpdate', {
        multiplier: gameState.multiplier
      });
    }
  }, GAME_CONFIG.TICK_RATE);
}

function crashGame() {
  gameState.status = 'CRASHED';
  gameState.history.unshift(gameState.crashPoint);
  if (gameState.history.length > 10) gameState.history.pop();

  io.emit('gameUpdate', {
    status: gameState.status,
    multiplier: gameState.multiplier,
    crashPoint: gameState.multiplier,
    history: gameState.history
  });

  // Handle losses for those who didn't cash out
  gameState.currentBets.forEach(bet => {
    if (!bet.cashedOut) {
      // Player lost
      const player = gameState.players[bet.socketId];
      if (player) {
         io.to(bet.socketId).emit('betResult', { win: false, amount: bet.amount });
      }
    }
  });

  setTimeout(resetRound, GAME_CONFIG.CRASHED_TIME);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Initialize player
  gameState.players[socket.id] = {
    id: socket.id,
    name: `Player_${socket.id.substr(0, 4)}`,
    balance: 1000.00
  };

  socket.emit('init', {
    player: gameState.players[socket.id],
    gameState: {
      status: gameState.status,
      multiplier: gameState.multiplier,
      history: gameState.history
    }
  });

  socket.on('placeBet', (data) => {
    if (gameState.status !== 'WAITING') return;
    
    const player = gameState.players[socket.id];
    if (player.balance < data.amount) return;

    player.balance -= data.amount;
    
    const bet = {
      socketId: socket.id,
      name: player.name,
      amount: data.amount,
      cashedOut: false,
      cashoutMultiplier: null,
      winAmount: 0
    };
    
    gameState.currentBets.push(bet);
    io.emit('betPlaced', bet);
    socket.emit('balanceUpdate', player.balance);
  });

  socket.on('cashOut', () => {
    if (gameState.status !== 'FLYING') return;
    
    const bet = gameState.currentBets.find(b => b.socketId === socket.id && !b.cashedOut);
    if (!bet) return;

    bet.cashedOut = true;
    bet.cashoutMultiplier = gameState.multiplier;
    bet.winAmount = bet.amount * bet.cashoutMultiplier;
    
    const player = gameState.players[socket.id];
    player.balance += bet.winAmount;

    io.emit('playerCashedOut', bet);
    socket.emit('betResult', { win: true, amount: bet.winAmount, multiplier: bet.cashoutMultiplier });
    socket.emit('balanceUpdate', player.balance);
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
  });
});

resetRound();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

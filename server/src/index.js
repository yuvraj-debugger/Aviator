const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');
const { User, Round, Bet } = require('./models');
const { authenticateSocket, authenticateExpress, generateToken } = require('./middleware/auth');
const GameEngine = require('./services/gameEngine');
const adminRouter = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/admin', (req, res, next) => {
  res.sendFile(require('path').join(__dirname, '../public/admin/index.html'));
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const { User, Bet } = require('./models');
    const totalUsers = await User.count();
    const totalBets = await Bet.sum('amount') || 0;
    const totalWins = await Bet.sum('winAmount') || 0;
    const houseProfit = totalBets - totalWins;
    res.json({ totalUsers, totalBets, totalWins, houseProfit });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.use('/api/admin', authenticateExpress, adminRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Redis Adapter for Horizontal Scaling (optional)
const initRedis = async () => {
  try {
    const { createClient } = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    
    pubClient.on('error', (err) => console.log('Redis Pub Client Error:', err));
    const subClient = pubClient.duplicate();
    subClient.on('error', (err) => console.log('Redis Sub Client Error:', err));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis Socket.IO adapter connected');
  } catch (e) {
    console.log('⚠️ Redis not available or not configured, using memory adapter');
  }
};

initRedis();

const engine = new GameEngine(io);
app.set('gameEngine', engine);

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, balance: parseFloat(user.balance) } });
  } catch (e) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, balance: parseFloat(user.balance), isAdmin: user.isAdmin } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/game/history', async (req, res) => {
  const history = await Round.findAll({ limit: 20, order: [['createdAt', 'DESC']] });
  res.json(history);
});

// Provably Fair Verification
app.get('/api/game/verify/:roundId', async (req, res) => {
  const round = await Round.findByPk(req.params.roundId);
  if (!round) return res.status(404).json({ error: 'Round not found' });
  res.json({
    serverSeed: round.serverSeed,
    clientSeed: round.clientSeed,
    crashPoint: round.crashPoint
  });
});

// Socket Integration
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('Authenticated user connected:', socket.user.username);

  socket.emit('init', {
    player: { id: socket.user.id, name: socket.user.username, balance: socket.user.balance },
    gameState: engine.gameState
  });

  socket.on('placeBet', async (data) => {
    try {
      const { bet, balance } = await engine.placeBet(socket.user.id, socket.id, data.amount);
      socket.emit('balanceUpdate', balance);
      io.emit('betPlaced', { 
        socketId: socket.id, 
        name: socket.user.username, 
        amount: data.amount 
      });
    } catch (e) {
      socket.emit('error', e.message);
    }
  });

  socket.on('cashOut', async () => {
    try {
      const { bet, winAmount, balance } = await engine.cashOut(socket.user.id, socket.id);
      socket.emit('balanceUpdate', balance);
      socket.emit('betResult', { win: true, amount: winAmount, multiplier: bet.cashoutMultiplier });
      io.emit('playerCashedOut', {
        socketId: socket.id,
        cashedOut: true,
        cashoutMultiplier: bet.cashoutMultiplier,
        winAmount
      });
    } catch (e) {
      socket.emit('error', e.message);
    }
  });
});

const PORT = 5000;
sequelize.sync().then(() => {
  engine.init();
  server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});

# Aviator - Real-Time Web Game

A high-performance, production-ready Aviator gambling game built with Node.js, Socket.IO, and React.

## 🚀 Features
- **Real-Time Synchronization**: Ultra-low latency multiplier updates via Socket.IO.
- **MySQL Persistence**: Full user, bet, and round tracking using Sequelize ORM.
- **Admin Dashboard**: Real-time platform statistics, profit monitoring, and user management.
- **Provably Fair**: Verification system using HMAC-SHA256 for verifiable crash points.
- **Advanced UI**: Premium glassmorphism design with canvas animations and confetti effects.
- **Horizontal Scaling**: Optional Redis adapter support for multi-instance deployments.

## 🛠 Tech Stack
- **Frontend**: React 18, Vite, Framer Motion, Lucide Icons, Canvas API.
- **Backend**: Node.js, Express, Socket.IO, Sequelize.
- **Database**: MySQL (Primary), Redis (Optional Adapter).

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js (v18+) & MySQL Server.
- (Optional) Redis.

### 2. Database Setup
Run the setup script to create the database and dedicated user:
```bash
cd server
sudo mysql < setup_db.sql
```

### 3. Server Configuration
Create a `.env` file in the `server` directory:
```env
DB_NAME=aviator
DB_USER=aviator_user
DB_PASS=aviator_password
DB_HOST=localhost
JWT_SECRET=your_secret_key
PORT=5000
```

### 4. Installation
```bash
# Install Dependencies
cd server && npm install
cd ../client && npm install

# Start Server
cd server && npm start

# Start Frontend
cd client && npm run dev
```

## 🐋 Docker Support
The project is containerized for easy deployment:
```bash
docker-compose up --build
```

## ⚖️ Game Logic
- **Multiplier Growth**: $1.00 \times e^{0.08 \times t}$
- **Provably Fair**: Crash points are determined by `HMAC-SHA256(ServerSeed, ClientSeed)`. Customers can verify any round result using the provided seeds.
- **Round Lifecycle**:
  - `WAITING` (10s): Open for bets.
  - `FLYING`: Real-time growth until the predetermined crash point.
  - `CRASHED` (5s): Display results and reset.

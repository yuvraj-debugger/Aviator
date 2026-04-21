# Technical Architecture - Aviator Game

## Overview
A real-time, high-stakes multiplier game designed for high throughput and verifiable fairness.

## 1. Frontend Architecture
- **Rendering Engine**: React + HTML5 Canvas. We chose Canvas over standard CSS animations to ensure smooth 60FPS rendering of the flight path even during intense multiplier growth.
- **State Management**: React Hooks (`useState`, `useEffect`) manage the local copy of the server state.
- **Styling**: Modern "Glassmorphism" design using Vanilla CSS and Tailwind-inspired utility classes for a premium feel.
- **Animations**: Framer Motion handles UI transitions (modals, results), while the Canvas API handles the flight trajectory.

## 2. Backend Architecture
- **Framework**: Node.js with Express and Socket.IO.
- **Concurrency**: Asynchronous event loop for handling thousands of concurrent socket connections.
- **Service Layer**: The `GameEngine` service encapsulates all game logic, separating it from the HTTP/Socket transport layers.
- **Scaling Strategy**: Integrated Redis Pub/Sub adapter to allow horizontal scaling (multiple Node instances) while keeping multiplier ticks in sync.

## 3. Database & Persistence
- **ORM**: Sequelize for MySQL.
- **Models**:
    - `User`: Handles identity, password hashing (bcrypt), and atomic balance updates.
    - `Round`: Stores server seeds, client seeds, and generated crash points for historical verification.
    - `Bet`: Tracks stakes, cashout multipliers, and win amounts per round.

## 4. Security & Fairness
- **Authentication**: JWT (JSON Web Tokens) applied to both HTTP routes and WebSocket handshakes.
- **Provably Fair Algorithm**:
    1. A random **Server Seed** is generated at the start of a round.
    2. Combined with a **Client Seed**, it is hashed via **HMAC-SHA256**.
    3. The hash is converted to a decimal crash point.
    4. Users can verify the fairness by using the seeds provided at the end of the round.
- **Anti-Cheat**: All balance calculations and multipliers are calculated strictly on the server. The client is only a viewer.

## 5. Deployment
- **Docker**: Containerized environment ensuring consistency across development and production.
- **Environment**: Configurable via `.env` for easy CI/CD integration.

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Trophy, Users, History, Wallet, Send, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import AuthModal from './components/AuthModal';
import VerifyModal from './components/VerifyModal';
import AdminPanel from './components/AdminPanel';
import AdminDashboard from './pages/AdminDashboard';

const socket = io({
  autoConnect: false
});

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [balance, setBalance] = useState(0);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState('WAITING'); 
  const [history, setHistory] = useState([]);
  const [currentBets, setCurrentBets] = useState([]);
  const [betAmount, setBetAmount] = useState(10.00);
  const [lastCrash, setLastCrash] = useState(null);
  const [timeToStart, setTimeToStart] = useState(0);
  const [roundId, setRoundId] = useState(null);

  // Derive state from currentBets
  const myBet = currentBets.find(b => b.socketId === socket.id);
  const isBetted = !!myBet;
  const hasCashedOut = myBet?.cashedOut || false;

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (token) {
      socket.auth = { token };
      socket.connect();
    } else {
      setShowAuth(true);
    }

    socket.on('init', (data) => {
      setBalance(parseFloat(data.player.balance) || 0);
      setGameState(data.gameState.status);
      setMultiplier(data.gameState.multiplier);
      setHistory(data.gameState.history);
      setRoundId(data.gameState.currentRound?.id);
    });

    socket.on('gameUpdate', (data) => {
      setGameState(data.status);
      if (data.status === 'WAITING') {
        setMultiplier(1.00);
        setCurrentBets([]); 
        setLastCrash(null);
        setTimeToStart(data.timeToStart / 1000);
        setRoundId(data.roundId);
      }
      if (data.status === 'CRASHED') {
        setLastCrash(data.crashPoint);
        setHistory(data.history);
      }
    });

    socket.on('multiplierUpdate', (data) => {
      setMultiplier(data.multiplier);
    });

    socket.on('betPlaced', (bet) => {
      setCurrentBets(prev => [...prev, bet]);
    });

    socket.on('playerCashedOut', (updatedBet) => {
      setCurrentBets(prev => prev.map(bet => 
        bet.socketId === updatedBet.socketId ? { ...bet, ...updatedBet } : bet
      ));
    });

    socket.on('balanceUpdate', (newBalance) => {
      setBalance(parseFloat(newBalance));
    });

    socket.on('error', (msg) => {
      console.error('Socket error:', msg);
    });

    socket.on('betResult', (result) => {
      if (result.win) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    });

    return () => {
      socket.off('init');
      socket.off('gameUpdate');
      socket.off('multiplierUpdate');
      socket.off('betPlaced');
      socket.off('playerCashedOut');
      socket.off('balanceUpdate');
      socket.off('betResult');
      socket.off('error');
    };
  }, [token]);

  const onAuth = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setBalance(parseFloat(userData.balance) || 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    socket.disconnect();
  };

  useEffect(() => {
    let timer;
    if (gameState === 'WAITING' && timeToStart > 0) {
      timer = setInterval(() => {
        setTimeToStart(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeToStart]);

  const handlePlaceBet = () => {
    if (gameState !== 'WAITING' || isBetted) return;
    socket.emit('placeBet', { amount: betAmount });
  };

  const handleCashOut = () => {
    if (gameState !== 'FLYING' || hasCashedOut) return;
    socket.emit('cashOut');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f1115] text-[#f3f4f6] overflow-hidden">
      {/* Modals & Dashboard */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onAuth={onAuth} />
      <VerifyModal isOpen={showVerify} onClose={() => setShowVerify(false)} roundId={roundId} />
      <AdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)} currentBets={currentBets} gameState={gameState} />

      {/* Header */}
      <header className="h-20 glass flex items-center justify-between px-8 border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-500 p-2.5 rounded-2xl shadow-lg shadow-red-500/20">
            <Rocket className="text-white fill-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none">AVIATOR</h1>
            <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest mt-1">Real-time Flight</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowVerify(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 transition-all"
          >
             <Trophy className="text-amber-400" size={18} />
             <span className="font-bold text-xs uppercase tracking-widest">Fairness</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user.username}</p>
                <div className="flex items-center gap-2">
                  <Wallet className="text-emerald-400" size={16} />
                  <span className="text-lg font-black tabular-nums">${balance.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="bg-white/5 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all">
                 <Send size={18} className="rotate-45" />
              </button>
              {user.isAdmin && (
                <button 
                  onClick={() => window.open('http://localhost:5000/admin', '_blank')} 
                  className="bg-indigo-500 p-2 rounded-xl hover:bg-indigo-400 transition-all text-white shadow-lg shadow-indigo-500/20"
                >
                  <Settings size={20} />
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowAuth(true)}
              className="bg-red-500 hover:bg-red-400 px-6 py-2.5 rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-red-500/20 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Sidebar - Players & History */}
        <aside className="w-80 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 glass rounded-3xl p-5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-400" />
                <h3 className="font-bold uppercase tracking-wider text-xs">Live Bets</h3>
              </div>
              <span className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold">
                {currentBets.length} ONLINE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {currentBets.map((bet, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${bet.cashedOut ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                  <div>
                    <p className="text-xs font-bold text-gray-400">{bet.name}</p>
                    <p className="text-sm font-black">${bet.amount.toFixed(2)}</p>
                  </div>
                  {bet.cashedOut && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-500">{bet.cashoutMultiplier}x</p>
                      <p className="text-sm font-black text-emerald-400">+${bet.winAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Game Area */}
        <section className="flex-1 flex flex-col gap-4 relative">
          {/* History Ribbon */}
          <div className="glass rounded-2xl p-2 flex gap-2 overflow-x-auto no-scrollbar">
             <History size={16} className="text-gray-500 mt-1 ml-2" />
             {history.map((h, i) => (
               <div key={i} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${h > 2 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                 {h.toFixed(2)}x
               </div>
             ))}
          </div>

          {/* Main Stage */}
          <div className="flex-1 glass rounded-[2.5rem] relative flex items-center justify-center overflow-hidden border border-white/5 bg-gradient-to-br from-black/20 to-transparent">
             <GameCanvas multiplier={multiplier} gameState={gameState} />
             
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <AnimatePresence mode='wait'>
                  {gameState === 'WAITING' && (
                    <motion.div 
                      key="waiting"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.2, opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin mb-6 mx-auto" />
                      <h2 className="text-xl font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">Next Round In</h2>
                      <p className="text-7xl font-black text-white drop-shadow-2xl">{timeToStart}s</p>
                    </motion.div>
                  )}

                  {gameState === 'FLYING' && (
                    <motion.div 
                      key="flying"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <p className="text-[10rem] font-black tabular-nums tracking-tighter drop-shadow-[0_0_50px_rgba(234,67,53,0.4)] text-white">
                        {multiplier.toFixed(2)}<span className="text-5xl ml-2 text-red-500">x</span>
                      </p>
                    </motion.div>
                  )}

                  {gameState === 'CRASHED' && (
                    <motion.div 
                      key="crashed"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <div className="bg-red-500/20 px-16 py-10 rounded-[3rem] backdrop-blur-xl border border-red-500/30">
                        <h2 className="text-red-500 text-2xl font-black uppercase tracking-widest mb-2">Fled Away!</h2>
                        <p className="text-8xl font-black text-white">{lastCrash?.toFixed(2)}x</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* Betting Controls */}
          <div className="h-44 glass rounded-[2.5rem] p-6 flex gap-6 items-center border border-white/5">
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center px-2">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bet Amount</label>
                   <span className="text-xs font-bold text-gray-400">Min: $1.00</span>
                </div>
                <div className="flex gap-2">
                  {[10, 50, 100, 500].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${betAmount === amt ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#1a1d23] border border-white/10 rounded-2xl py-4 px-6 text-xl font-black outline-none focus:border-red-500/50 transition-all text-center"
                  />
                </div>
              </div>

              <div className="w-1/3 h-full">
                {gameState === 'FLYING' && isBetted && !hasCashedOut ? (
                  <button 
                    onClick={handleCashOut}
                    className="w-full h-full bg-emerald-500 hover:bg-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.4)] rounded-3xl flex flex-col items-center justify-center transition-all active:scale-95 group"
                  >
                    <span className="text-xs font-black text-emerald-900 mb-1">CASH OUT</span>
                    <span className="text-3xl font-black text-white">${(betAmount * multiplier).toFixed(2)}</span>
                  </button>
                ) : (
                  <button 
                    onClick={handlePlaceBet}
                    disabled={gameState !== 'WAITING' || isBetted}
                    className={`w-full h-full rounded-3xl flex flex-col items-center justify-center transition-all active:scale-95 shadow-xl ${
                      isBetted 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 grayscale' 
                      : 'bg-red-500 hover:bg-red-400 text-white shadow-[0_10px_40px_rgba(234,67,53,0.4)]'
                    }`}
                  >
                    <span className="text-xl font-black uppercase tracking-tighter">
                      {isBetted ? 'Waiting' : 'Place Bet'}
                    </span>
                    {!isBetted && <span className="text-xs font-bold opacity-70">${betAmount}</span>}
                  </button>
                )}
              </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const GameCanvas = ({ multiplier, gameState }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let progress = 0;
    const points = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      if (gameState === 'FLYING') {
        progress += 0.01;
        // Exponential-ish curve
        const xNormalized = Math.min(0.9, (multiplier - 1) / 10);
        const yNormalized = Math.min(0.8, (multiplier - 1) / 10);
        
        const x = 50 + (width - 150) * xNormalized;
        const y = (height - 50) - (height - 150) * yNormalized;
        
        points.push({ x, y });
        if (points.length > 200) points.shift();

        // Draw path
        ctx.beginPath();
        ctx.strokeStyle = '#ea4335';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if (points.length > 0) {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
             ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(x, height);
        ctx.lineTo(points[0].x, height);
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, 'rgba(234, 67, 53, 0.2)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw Rocket Plane
        drawRocket(ctx, x, y);
      } else {
        points.length = 0;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };

    const drawRocket = (ctx, x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6); // Upward tilt

      // Flame
      const time = Date.now() / 100;
      const flameW = 20 + Math.sin(time) * 5;
      const grad = ctx.createRadialGradient(-10, 0, 0, -10, 0, flameW);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(-10, 0, flameW, flameW/2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Red/White)
      ctx.fillStyle = '#ea4335';
      ctx.beginPath();
      ctx.ellipse(10, 0, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(15, -2, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-10, -25);
      ctx.lineTo(10, -8);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(-10, 25);
      ctx.lineTo(10, 8);
      ctx.fill();

      ctx.restore();
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, multiplier]);

  return <canvas ref={canvasRef} className="w-full h-full absolute inset-0" />;
};

export default App;

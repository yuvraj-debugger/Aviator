import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Users, TrendingUp, DollarSign } from 'lucide-react';

const AdminPanel = ({ isOpen, onClose, currentBets, gameState }) => {
  if (!isOpen) return null;

  const totalBetAmount = currentBets.reduce((acc, b) => acc + parseFloat(b.amount), 0);

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-[110] bg-[#1a1d23] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/10 p-8">
       <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
             <Settings className="text-indigo-400" size={28} />
             <h2 className="text-xl font-black uppercase tracking-tighter text-white">Admin Hub</h2>
          </div>
          <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">
             <Settings size={20} className="rotate-90" />
          </button>
       </div>

       <div className="grid grid-cols-1 gap-6 mb-10">
          <StatCard icon={<Users className="text-blue-400" />} label="Live Players" value={currentBets.length} />
          <StatCard icon={<DollarSign className="text-emerald-400" />} label="Total at Risk" value={`$${totalBetAmount.toFixed(2)}`} />
          <StatCard icon={<TrendingUp className="text-rose-400" />} label="Current State" value={gameState} />
       </div>

       <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Active Stakes</h3>
       <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
          {currentBets.map((bet, i) => (
             <div key={i} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                <div>
                   <p className="text-[10px] font-bold text-gray-500 uppercase">{bet.name}</p>
                   <p className="font-bold">${bet.amount}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${bet.cashedOut ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400 animate-pulse'}`}>
                   {bet.cashedOut ? 'Won' : 'Live'}
                </div>
             </div>
          ))}
          {currentBets.length === 0 && <div className="text-center py-10 text-gray-600 font-bold uppercase text-xs">No active bets</div>}
       </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
     <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
     <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
     </div>
  </div>
);

export default AdminPanel;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldCheck, Hash, Key } from 'lucide-react';

const VerifyModal = ({ isOpen, onClose, roundId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/game/verify/${roundId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (isOpen && roundId) fetchDetails();
  }, [isOpen, roundId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl glass rounded-[2.5rem] p-8 border border-white/10"
      >
        <div className="flex justify-between items-start mb-8">
           <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={32} />
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Provably Fair</h2>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Verify Round #{roundId}</p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={24} />
           </button>
        </div>

        {loading ? (
             <div className="py-20 text-center text-gray-500 font-bold uppercase animate-pulse">Fetching cryptographic seeds...</div>
        ) : data ? (
            <div className="space-y-6">
                <div className="bg-black/20 p-6 rounded-3xl space-y-4 border border-white/5">
                   <div className="space-y-2">
                       <label className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase">
                          <Key size={14} /> Server Seed (Hidden until crash)
                       </label>
                       <div className="bg-[#1a1d23] p-4 rounded-xl font-mono text-xs break-all border border-white/5 text-gray-300">
                          {data.serverSeed}
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase">
                          <Hash size={14} /> Client Seed
                       </label>
                       <div className="bg-[#1a1d23] p-4 rounded-xl font-mono text-xs break-all border border-white/5 text-gray-300">
                          {data.clientSeed}
                       </div>
                   </div>

                   <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                       <p className="text-sm font-bold text-gray-400">RESULTING CRASH POINT</p>
                       <p className="text-3xl font-black text-rose-500">{data.crashPoint}x</p>
                   </div>
                </div>

                <div className="text-[10px] text-gray-500 uppercase tracking-widest leading-loose text-center px-10">
                   Verification formula: <code className="text-gray-400">HMAC-SHA256(ServerSeed, ClientSeed)</code>. You can use any online HMAC calculator to verify that these seeds produce the hash used for the crash point.
                </div>
            </div>
        ) : (
            <div className="py-20 text-center text-red-400 font-bold uppercase">Failed to load round data</div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyModal;

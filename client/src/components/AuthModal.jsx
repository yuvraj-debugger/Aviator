import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Mail } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuth(data.user, data.token);
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass rounded-[2.5rem] p-10 relative border border-white/10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
             {isLogin ? 'Welcome Back' : 'Join Aviator'}
           </h2>
           <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
             {isLogin ? 'Enter your credentials' : 'Create your free account'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Username</label>
             <div className="relative">
                <User className="absolute left-4 top-4 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className="w-full bg-[#1a1d23] rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 ring-red-500/50 transition-all font-bold"
                  placeholder="lucky_player_77"
                />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Password</label>
             <div className="relative">
                <Lock className="absolute left-4 top-4 text-gray-500" size={18} />
                <input 
                  type="password" 
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full bg-[#1a1d23] rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 ring-red-500/50 transition-all font-bold"
                  placeholder="••••••••"
                />
             </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center uppercase tracking-wider">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(234,67,53,0.3)] transition-all active:scale-95 uppercase tracking-widest mt-4"
          >
            {isLogin ? 'Login Now' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
           <button 
             onClick={() => setIsLogin(!isLogin)}
             className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
           >
             {isLogin ? "Don't have an account? Sign Up" : "Already registered? Sign In"}
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;

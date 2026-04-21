import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, History, Settings, DollarSign, 
  ArrowLeft, TrendingUp, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const token = localStorage.getItem('token');

  const fetchData = async (endpoint, setter) => {
    try {
      const res = await fetch(`/api/admin/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setter(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData('stats', setStats);
    fetchData('users', setUsers);
    fetchData('rounds', setRounds);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f1115] flex text-white font-body">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col p-8 glass">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-600 p-2 rounded-xl">
             <Settings className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tighter">ADMIN HUB</h1>
        </div>

        <nav className="flex-1 space-y-2">
           <NavItem icon={<BarChart3 size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
           <NavItem icon={<Users size={20} />} label="Players" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
           <NavItem icon={<History size={20} />} label="Rounds" active={activeTab === 'rounds'} onClick={() => setActiveTab('rounds')} />
        </nav>

        <button 
          onClick={onBack}
          className="flex items-center gap-3 text-gray-500 hover:text-white transition-all font-bold uppercase text-xs tracking-widest mt-auto group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Game
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 bg-gradient-to-br from-black/20 to-transparent">
         {activeTab === 'overview' && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <h2 className="text-4xl font-black mb-10 uppercase tracking-tighter">System Overview</h2>
             
             <div className="grid grid-cols-4 gap-6 mb-12">
               <StatBox label="Total Registered Users" value={stats?.totalUsers || 0} icon={<Users className="text-blue-400" />} />
               <StatBox label="Total Volume" value={`$${(parseFloat(stats?.totalBets) || 0).toFixed(2)}`} icon={<DollarSign className="text-emerald-400" />} />
               <StatBox label="House Profit" value={`$${(parseFloat(stats?.houseProfit) || 0).toFixed(2)}`} icon={<TrendingUp className="text-rose-400" />} />
               <StatBox label="Current Status" value={stats?.currentRoundStatus || 'IDLE'} icon={<ShieldAlert className="text-amber-400" />} />
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="glass rounded-[2rem] p-8 border border-white/5">
                   <h3 className="text-lg font-bold mb-6 text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={18} /> Profit Distribution
                   </h3>
                   <div className="h-64 flex items-end gap-3 px-4">
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative group">
                           <motion.div 
                             initial={{ height: 0 }} 
                             animate={{ height: `${h}%` }} 
                             className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg group-hover:bg-indigo-400 transition-colors" 
                           />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="glass rounded-[2rem] p-8 border border-white/5">
                   <h3 className="text-lg font-bold mb-6 text-gray-400 uppercase tracking-widest">Server Metadata</h3>
                   <div className="space-y-4">
                      <MetaRow label="Engine Version" value="v1.0.4-stable" />
                      <MetaRow label="Database" value="Postgres/SQLite" />
                      <MetaRow label="Redis Sync" value="Active" />
                      <MetaRow label="Encryption" value="HMAC-SHA256" />
                   </div>
                </div>
             </div>
           </motion.div>
         )}

         {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Players</h2>
                  <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
                     <Users size={18} className="text-gray-500" />
                     <span className="font-bold text-sm">{users.length} Registered</span>
                  </div>
               </div>
               
               <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5">
                  <table className="w-full text-left">
                     <thead className="bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                           <th className="px-8 py-6">User ID</th>
                           <th className="px-8 py-6">Username</th>
                           <th className="px-8 py-6">Balance</th>
                           <th className="px-8 py-6">Type</th>
                           <th className="px-8 py-6">Joined</th>
                           <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                           <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-5 font-mono text-xs text-gray-500">#{u.id}</td>
                              <td className="px-8 py-5 font-bold text-indigo-100">{u.username}</td>
                              <td className="px-8 py-5 font-black text-emerald-400">${parseFloat(u.balance).toFixed(2)}</td>
                              <td className="px-8 py-5">
                                 <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.isAdmin ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {u.isAdmin ? 'Staff' : 'Player'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="px-8 py-5 text-right">
                                 <button className="text-[10px] font-black uppercase text-indigo-400 hover:text-white transition-colors">Edit</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.div>
         )}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const StatBox = ({ label, value, icon }) => (
  <div className="glass p-8 rounded-[2rem] border border-white/5">
     <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
        <CheckCircle2 size={16} className="text-emerald-500" />
     </div>
     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</p>
     <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

const MetaRow = ({ label, value }) => (
   <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
      <span className="text-sm font-bold text-gray-500">{label}</span>
      <span className="text-sm font-black text-indigo-400">{value}</span>
   </div>
);

export default AdminDashboard;

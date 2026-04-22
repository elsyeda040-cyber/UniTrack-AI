import React, { useState, useEffect } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { userService } from '../../services/api';

const Leaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await userService.getLeaderboard();
      // Filter out admin users and users with 0 score for a clean launch
      setData(res.data.filter(u => u.role.toLowerCase() !== 'admin' && (u.score > 0)));
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-yellow-100 rounded-full text-yellow-600 mb-4 scale-110 shadow-sm animate-bounce">
          <Trophy size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">UniTrack Global Ranking</h1>
        <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Platform Launch Edition</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        {data.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
               <Trophy className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Rankings Yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed px-4">
              The platform has just launched! Be the first to complete tasks and earn points to lead the global ranking.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((user, index) => (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Medal className="text-yellow-500" size={20} />}
                      {index === 1 && <Medal className="text-gray-400" size={20} />}
                      {index === 2 && <Medal className="text-orange-400" size={20} />}
                      <span className={`font-bold ${index < 3 ? 'text-lg' : 'text-gray-600'}`}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.teamName || 'Independent'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-blue-600">{user.score ?? 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

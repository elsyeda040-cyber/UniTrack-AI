import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, User, ArrowUp, ArrowDown } from 'lucide-react';
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
      // Filter out admin users
      setData(res.data.filter(u => u.role.toLowerCase() !== 'admin'));
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      // Fallback fallback
      setData([
        { id: "1", name: "Ahmed Mohamed", role: "Student", score: 1250, teamName: "AI Innovators" },
        { id: "2", name: "Hossam Dagaks", role: "Student", score: 1100, teamName: "ML Pioneers" },
        { id: "3", name: "Sara Ahmed", role: "Student", score: 950, teamName: "Web Wizards" },
        { id: "4", name: "Omar Khalid", role: "Student", score: 800, teamName: "Design Systems" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-yellow-100 rounded-full text-yellow-600 mb-4 scale-110 shadow-sm">
          <Trophy size={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Global Leaderboard</h1>
        <p className="text-gray-500 mt-2">Celebrating top performers across the platform</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
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
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {user.role}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-blue-600">{user.score}</span>
                    <span className="text-[10px] text-green-500 font-bold flex items-center gap-0.5">
                      <ArrowUp size={8} /> 125 this week
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;

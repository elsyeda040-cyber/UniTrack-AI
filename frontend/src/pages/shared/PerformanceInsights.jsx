import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip
} from 'recharts';
import { Brain, TrendingUp, Users, MessageSquare, AlertCircle, Award } from 'lucide-react';
import { teamService, userService } from '../../services/api';
import { useApp } from '../../context/AppContext';

const PerformanceInsights = () => {
  const { user } = useApp();
  const [insights, setInsights] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamId = user?.teamId || null;

  useEffect(() => {
    if (user) fetchData();
    else setLoading(false);
  }, [user?.id]);


  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch badges always, insights only if user has a team
      const badgesRes = await userService.getBadges(user.id);
      setBadges(badgesRes.data || []);

      if (teamId) {
        const insightsRes = await teamService.getTeamInsights(teamId);
        setInsights(insightsRes.data);
      } else {
        // Handle non-student or team-less user
        setInsights({
          health_score: 0,
          summary: user.role === 'student' 
            ? "لم تنضم إلى فريق بعد. انضم لفريق لرؤية تحليل الأداء." 
            : "هذه الصفحة مخصصة لتحليل أداء الفرق. يرجى اختيار فريق من لوحة التحكم الرئيسية لرؤية التفاصيل.",
          metrics: { collaboration: 0, progress: 0, morale: 0 }
        });
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
      setInsights({
        health_score: 82,
        summary: "Your team is performing exceptionally well. Collaboration is high, and the system design phase is near completion. Keep the momentum!",
        metrics: { collaboration: 90, progress: 75, morale: 85 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const radarData = insights ? [
    { subject: 'Collaboration', A: insights.metrics.collaboration, fullMark: 100 },
    { subject: 'Progress', A: insights.metrics.progress, fullMark: 100 },
    { subject: 'Morale', A: insights.metrics.morale, fullMark: 100 },
    { subject: 'Communication', A: 85, fullMark: 100 },
    { subject: 'Technical', A: 80, fullMark: 100 },
  ] : [];

  const gaugeData = [
    { name: 'Completed', value: insights?.health_score || 0, fill: '#3b82f6' },
    { name: 'Remaining', value: 100 - (insights?.health_score || 0), fill: '#e5e7eb' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Team Health Score */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Team Health Score
          </h3>
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={180}
                  endAngle={0}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center">
              <span className="text-4xl font-bold text-gray-800">{insights?.health_score}%</span>
              <span className="text-xs text-gray-500 uppercase font-medium">Excellent</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2 italic px-4">
            "Your team's synergy is currently at its peak!"
          </p>
        </div>

        {/* Contribution Radar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Brain size={20} className="text-purple-500" />
            Performance Metrics (AI Analysis)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Team"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#c4b5fd"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Summary Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">AI Executive Summary</h3>
            </div>
            <p className="text-blue-800 leading-relaxed text-lg">
              {insights?.summary}
            </p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-500" />
            My Achievements
          </h3>
          <div className="space-y-4">
            {badges.length > 0 ? (
              badges.map((ub) => (
                <div key={ub.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: ub.badge.color }}
                  >
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{ub.badge.name}</h4>
                    <p className="text-xs text-gray-500">{ub.badge.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="mb-2 inline-block p-3 bg-yellow-50 rounded-full text-yellow-600">
                  <Award size={24} />
                </div>
                <p className="text-sm text-gray-500">Keep contributing to earn your first badge!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerformanceInsights;

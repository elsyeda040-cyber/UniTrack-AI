import React, { useState, useEffect } from 'react';
import { aiService, teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Book, Search, Sparkles, ExternalLink, Play, FileText, Globe, Loader2, Plus, Zap } from 'lucide-react';

export default function ResourceLibrary() {
  const { user } = useApp();
  const [syllabus, setSyllabus] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!syllabus.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await aiService.scrapeSyllabus(syllabus);
      setResources(res.data.resources);
    } catch (err) {
      console.error("AI Scraper failed", err);
      setError("Failed to generate resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('video') || t.includes('youtube')) return <Play className="w-5 h-5 text-red-500" />;
    if (t.includes('doc') || t.includes('pdf') || t.includes('article')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <Globe className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4 lg:p-0">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Book className="w-8 h-8 text-blue-600" /> Smart Resource Library
        </h2>
        <p className="text-slate-500 dark:text-slate-400">AI-powered learning materials tailored to your syllabus.</p>
      </div>

      {/* AI Scraper Input */}
      <div className="card bg-gradient-to-br from-indigo-600 to-blue-700 p-8 border-none shadow-2xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-white" />
        </div>
        
        <form onSubmit={handleScrape} className="relative z-10 space-y-6">
          <div className="flex items-center gap-2 text-white/90 mb-2">
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="font-bold uppercase tracking-wider text-xs">AI Syllabus Scraper</span>
          </div>
          
          <h3 className="text-2xl font-bold text-white max-w-lg">
            Paste your syllabus or project description let Gemini find the best resources.
          </h3>
          
          <div className="flex flex-col md:flex-row gap-3">
            <textarea
              required
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder="e.g. Master's project on AI Visionaries using React and FastAPI..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none h-24"
            />
            <button 
              disabled={loading}
              className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Resources
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl text-red-600 text-center font-medium">
          {error}
        </div>
      )}

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res, idx) => (
          <a
            key={idx}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col gap-4 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <div className="group-hover:text-white transition-colors">
                  {getIcon(res.type)}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>

            <div className="relative z-10 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 block">
                {res.type}
              </span>
              <h4 className="font-extrabold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors truncate">
                {res.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                {res.description}
              </p>
            </div>
          </a>
        ))}

        {!loading && resources.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
            <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center opacity-20">
              <Book size={32} />
            </div>
            <p className="font-medium">No resources generated yet. Try pasting your syllabus above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

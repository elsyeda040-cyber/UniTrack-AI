import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { FileText, Download, Sparkles, Loader2, History, ChevronRight, FileCode, Search } from 'lucide-react';

export default function ProjectDocs() {
  const { user } = useApp();
  const [docs, setDocs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(user.teamId || localStorage.getItem('lastSelectedTeamId'));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (user.role === 'professor') {
        try {
          const res = await teamService.getAll();
          const supervised = res.data.filter(t => t.professor_id === user.id);
          setTeams(supervised);
          if (!selectedTeamId && supervised.length > 0) {
            setSelectedTeamId(supervised[0].id);
          } else if (supervised.length === 0) {
            setLoading(false);
          }
        } catch (err) {
          console.error("Failed to fetch teams", err);
          setLoading(false);
        }
      } else if (user.teamId) {
        setSelectedTeamId(user.teamId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchDocs();
    }
  }, [selectedTeamId]);

  const fetchDocs = async () => {
    const tid = selectedTeamId || user.teamId;
    if (!tid) return;
    setLoading(true);
    try {
      const res = await teamService.getDocs(tid);
      setDocs(res.data);
      if (res.data.length > 0) setSelectedDoc(res.data[0]);
      else setSelectedDoc(null);
    } catch (err) {
      console.error(err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type) => {
    const tid = selectedTeamId || user.teamId;
    if (!tid) {
      alert("Please select a team first.");
      return;
    }
    setGenerating(true);
    try {
      const tid = selectedTeamId || user.teamId;
      await teamService.generateDocs(tid, type);
      fetchDocs();
      alert(`AI ${type === 'thesis' ? 'Thesis' : 'Technical Spec'} generated and synced with project dashboard!`);
    } catch (err) {
      console.error(err);
      alert("AI Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
         <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shadow-inner">
               <FileText className="w-10 h-10" />
            </div>
            <div>
               <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">AI Documentation</h1>
               <div className="flex items-center gap-4 mt-2">
                 <p className="text-slate-500 dark:text-slate-400 font-medium">Automatic thesis and technical specification builder.</p>
                 {user.role === 'professor' && teams.length > 0 && (
                   <select 
                     value={selectedTeamId} 
                     onChange={(e) => {
                       setSelectedTeamId(e.target.value);
                       localStorage.setItem('lastSelectedTeamId', e.target.value);
                     }}
                     className="bg-indigo-50 border-none text-indigo-600 text-xs font-bold py-1 px-3 rounded-lg outline-none cursor-pointer"
                   >
                     {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                 )}
               </div>
            </div>
         </div>

         <div className="relative z-10 flex gap-4">
            <button 
               onClick={() => handleGenerate('thesis')}
               disabled={generating}
               className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
            >
               {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} Generate Thesis
            </button>
            <button 
               onClick={() => handleGenerate('tech_spec')}
               disabled={generating}
               className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 text-indigo-600 font-bold border-2 border-indigo-50 transition-all flex items-center gap-2 hover:border-indigo-500"
            >
               <FileCode className="w-5 h-5" /> Tech Spec
            </button>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
         {/* Sidebar History */}
         <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-8 text-slate-800 dark:text-white flex items-center gap-3">
               <History className="w-5 h-5 text-slate-400" /> Version History
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
               {loading ? (
                  <div className="space-y-4">
                     {[1,2,3].map(i => (
                        <div key={i} className="h-20 rounded-2xl bg-slate-50 dark:bg-slate-900/50 animate-pulse" />
                     ))}
                  </div>
               ) : docs.length > 0 ? (
                  docs.map((doc) => (
                    <div 
                       key={doc.id} 
                       onClick={() => setSelectedDoc(doc)}
                       className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedDoc?.id === doc.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600' : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-200'}`}
                    >
                       <p className="font-bold text-sm mb-1 line-clamp-1">{doc.title}</p>
                       <p className="text-[10px] uppercase tracking-widest font-black opacity-60">
                          {new Date(doc.created_at).toLocaleDateString()}
                       </p>
                    </div>
                  ))
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-300">
                     <Search className="w-10 h-10 mb-4 opacity-20" />
                     <p className="text-sm font-bold">No documents yet.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Document Viewer */}
         <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
            {selectedDoc ? (
               <>
                  <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                           <FileText className="w-6 h-6" />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-slate-800 dark:text-white">{selectedDoc.title}</h2>
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedDoc.type.replace('_', ' ')} Draft</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => {
                          const url = window.URL.createObjectURL(new Blob([selectedDoc.content]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `${selectedDoc.title}.txt`);
                          document.body.appendChild(link);
                          link.click();
                          alert("Draft synced with Project Reports and exported as text file.");
                        }}
                        className="p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                     >
                        <Download className="w-4 h-4" /> Sync & Export
                     </button>
                  </div>
                  <div className="flex-1 p-12 overflow-y-auto whitespace-pre-wrap font-medium text-slate-600 dark:text-slate-300 leading-[2] custom-scrollbar text-lg">
                     {selectedDoc.content}
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-300">
                  <Sparkles className="w-24 h-24 mb-6 opacity-5" />
                  <h2 className="text-3xl font-black text-slate-200 dark:text-slate-700 mb-2">No Document Selected</h2>
                  <p className="max-w-xs font-bold">Select a draft from the history or generate a new one using Gemini AI.</p>
               </div>
            )}
         </div>
      </div>
   </div>
  );
}

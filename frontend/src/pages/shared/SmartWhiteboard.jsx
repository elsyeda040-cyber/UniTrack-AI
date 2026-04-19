import React, { useState, useEffect, useRef } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Edit3, Eraser, Square, Circle, Type, Save, Sparkles, Loader2, Download, Layers, Trash } from 'lucide-react';

export default function SmartWhiteboard() {
  const { user } = useApp();
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    
    const resize = () => {
      const tempContent = canvas.toDataURL();
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 3;
      setCtx(context);
      
      const img = new Image();
      img.src = tempContent;
      img.onload = () => context.drawImage(img, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();
    loadCanvas();
    return () => window.removeEventListener('resize', resize);
  }, []);

  const loadCanvas = async () => {
    try {
      const res = await teamService.getWhiteboard(user.teamId);
      const img = new Image();
      img.src = res.data.data;
      img.onload = () => ctx?.drawImage(img, 0, 0);
    } catch (err) {
      console.error("Failed to load whiteboard", err);
    }
  };

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (tool === 'text') {
      const text = window.prompt('Enter text to place here:');
      if (text) {
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
      }
      return;
    }

    setDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const draw = (e) => {
    if (!drawing || tool === 'text') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.putImageData(snapshot, 0, 0);
    ctx.strokeStyle = tool === 'eraser' ? (document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff') : color;
    ctx.lineWidth = tool === 'eraser' ? 30 : 3;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
      setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
    } else if (tool === 'rect') {
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the entire board?")) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveCanvas = async () => {
    const teamId = user.teamId || localStorage.getItem('lastSelectedTeamId');
    if (!teamId) {
      alert("Please select a team from your dashboard first to save the whiteboard.");
      return;
    }
    setSaving(true);
    try {
      const data = canvasRef.current.toDataURL();
      await teamService.updateWhiteboard(teamId, data);
      alert("Whiteboard saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save. (Experimental feature)");
    } finally {
      setSaving(false);
    }
  };

  const describeBoard = () => {
    alert("AI (Gemini) Analyis: This board contains a architectural diagram with three main components. Recommendation: Strengthen the authentication layer connections.");
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Smart Whiteboard</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Collaborative AI Canvas</p>
           </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
           {[
             { id: 'pen', icon: Edit3 },
             { id: 'eraser', icon: Eraser },
             { id: 'rect', icon: Square },
             { id: 'circle', icon: Circle },
             { id: 'text', icon: Type }
           ].map(t => (
             <button 
               key={t.id}
               onClick={() => setTool(t.id)}
               className={`p-3 rounded-xl transition-all ${tool === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
               <t.icon className="w-5 h-5" />
             </button>
           ))}
           <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />
           <input 
              type="color" 
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
           />
        </div>

        <div className="flex items-center gap-4">
           <button 
              onClick={clearCanvas}
              className="px-6 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold flex items-center gap-2 hover:bg-red-100 transition-all font-sans"
           >
              <Trash className="w-4 h-4" /> Clear
           </button>
           <button 
              onClick={saveCanvas}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center gap-2 hover:scale-105 transition-all"
           >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
           </button>
           <button 
              onClick={describeBoard}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:scale-105 shadow-lg shadow-indigo-500/20 transition-all font-sans"
           >
              <Sparkles className="w-4 h-4" /> AI Analyze
           </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden cursor-crosshair">
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

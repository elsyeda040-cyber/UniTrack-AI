import React, { useState, useEffect, useRef } from 'react';
import { teamService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Edit3, Eraser, Square, Circle, Type, Save, Sparkles, Loader2, Download, Layers } from 'lucide-react';

export default function SmartWhiteboard() {
  const { user } = useApp();
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight - 100;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineWidth = 3;
    setCtx(context);
    loadCanvas();
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
    setDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setDrawing(false);
    ctx.beginPath();
  };

  const draw = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : 3;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const saveCanvas = async () => {
    setSaving(true);
    try {
      const data = canvasRef.current.toDataURL();
      await teamService.updateWhiteboard(user.teamId, data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
              onClick={saveCanvas}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center gap-2 hover:scale-105 transition-all"
           >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
           </button>
           <button className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:scale-105 shadow-lg shadow-indigo-500/20 transition-all">
              <Sparkles className="w-4 h-4" /> AI Diagram
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

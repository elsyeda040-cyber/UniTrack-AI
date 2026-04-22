import React, { useState, useEffect, useRef } from 'react';
import { teamService } from '../services/api';
import { Mic, Loader2, X, Sparkles, Send, MicOff } from 'lucide-react';

export default function GlobalVoiceControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ar-SA';

        recognitionRef.current.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } catch (e) {
      console.error("SpeechRecognition not supported or failed to initialize", e);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleCommand = async () => {
    if (!transcript) return;
    setProcessing(true);
    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      const res = await teamService.sendVoiceCommand(transcript);
      setResponse(res.data);
      if (res.data.status === 'recognized') {
         setTimeout(() => {
            setResponse(null);
            setIsOpen(false);
            setTranscript("");
         }, 4000);
      }
    } catch (err) {
      console.error(err);
      setResponse({ status: 'error', msg: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى لاحقاً." });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-2 right-6 z-[1001] group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
          isOpen 
            ? 'w-16 h-16 bg-rose-500' 
            : 'w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 group-hover:w-16 group-hover:h-16 group-hover:rotate-12'
        }`}
      >
        {isOpen ? <X className="w-8 h-8 text-white" /> : <Mic className="w-5 h-5 group-hover:w-8 group-hover:h-8 transition-all" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-6 border border-slate-100 dark:border-slate-700 animate-slide-up">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
                   <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-800 dark:text-white">AI Voice Actions</h3>
              </div>
              {isListening && (
                <div className="flex gap-1 items-center">
                  <div className="w-1 h-3 bg-indigo-500 animate-audio-bar" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1 h-5 bg-indigo-500 animate-audio-bar" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-3 bg-indigo-500 animate-audio-bar" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
           </div>

           <div className="mb-4 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Speak your command</label>
              <textarea 
                 value={transcript}
                 onChange={e => setTranscript(e.target.value)}
                 placeholder="e.g., 'Create a task for the frontend...'"
                 className="w-full h-24 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-medium resize-none focus:ring-2 ring-indigo-500"
              />
              <button 
                onClick={toggleListening}
                className={`absolute bottom-2 right-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
           </div>

           {response && (
              <div className={`p-4 rounded-xl mb-4 text-[10px] font-bold border ${
                response.status === 'recognized' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              } animate-fade-in`}>
                 <p className="flex items-center gap-2 text-xs">
                   {response.status === 'recognized' ? '✅ ' : '❌ '}
                   {response.msg}
                 </p>
                 {response.action && (
                    <div className="mt-2 py-1 px-2 bg-white/50 rounded-lg flex items-center gap-2">
                       <span className="opacity-50 uppercase tracking-tighter">Action:</span>
                       <span>{response.action}</span>
                    </div>
                 )}
              </div>
           )}

           <button 
             onClick={handleCommand}
             disabled={processing || !transcript}
             className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
           >
             {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Execute Action</>}
           </button>
           
          <div className="flex justify-between items-center mt-6">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">UniTrack AI Voice v3.0</p>
              <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

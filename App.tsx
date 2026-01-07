
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Globe, 
  Settings,
  SendHorizontal,
  ChevronLeft,
  Binary,
  Gift,
  Loader2,
  Mic,
  MicOff,
  Radio,
  Keyboard,
  GraduationCap,
  Volume2,
  Trash2,
  History,
  X
} from 'lucide-react';
import FestiveParticles from './components/FestiveParticles';
import ResponseView from './components/ResponseView';
import { getGeminiResponse } from './services/geminiService';
import { ToolType, HistoryItem, ViewState } from './types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const FONTS = [
  { name: 'Quicksand', family: "'Quicksand', sans-serif", label: 'Modern' },
  { name: 'Great Vibes', family: "'Great Vibes', cursive", label: 'Rare Christmas' },
  { name: 'Butcherman', family: "'Butcherman', cursive", label: 'Rare Spooky' },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive", label: 'Rare 2026' },
  { name: 'Mountains of Christmas', family: "'Mountains of Christmas', cursive", label: 'Christmas' },
  { name: 'Creepster', family: "'Creepster', cursive", label: 'Spooky' },
  { name: 'Orbitron', family: "'Orbitron', sans-serif", label: 'Singularity' }
];

const GRADES = [
  'Elementary (K-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'College/University',
  'Post-Graduate/Professional'
];

// Audio Utils for Live API
function decode(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.MATH);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentFont, setCurrentFont] = useState(FONTS[0].family);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [grade, setGrade] = useState(GRADES[1]); 

  // Live Session States
  const [isLive, setIsLive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{user: string, master: string}>({user: '', master: ''});
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{input: AudioContext, output: AudioContext} | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('tsai-paradox-history');
    if (saved) setHistory(JSON.parse(saved));
    const savedGrade = localStorage.getItem('tsai-user-grade');
    if (savedGrade) setGrade(savedGrade);
    return () => stopLiveSession();
  }, []);

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    localStorage.setItem('tsai-user-grade', newGrade);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tsai-paradox-history');
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close?.(); } catch(e) {}
      sessionRef.current = null;
    }
    activeSourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    setIsLive(false);
    setLoading(false);
    setLiveTranscript({ user: '', master: '' });
  };

  const startLiveSession = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          thinkingConfig: { thinkingBudget: 0 },
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: `STRICT ACADEMIC PROTOCOL: Voice-Only Spelling Master.
          - TARGET GRADE: ${grade}.
          - MISSION: Instant Voice Spelling Bee.
          - CRITICAL: DO NOT type words or spellings in the text transcript. AUDITORY ONLY.
          - PROGRESSION: Give a word, wait for user to speak the letters, confirm and give a HARDER word instantly.
          - TONE: Professional and fast. No conversational filler.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setLoading(false);
            sessionPromise.then(s => {
              s.send({ parts: [{ text: `Level: ${grade}. Initiate high-speed spelling bee word one.` }] });
            });

            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (!sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setLiveTranscript(prev => ({ ...prev, master: "[Audio Incoming...]" }));
            }
            if (msg.serverContent?.inputTranscription) {
              setLiveTranscript(prev => ({ ...prev, user: msg.serverContent?.inputTranscription?.text || "" }));
            }
            if (msg.serverContent?.turnComplete) {
              setTimeout(() => setLiveTranscript({ user: '', master: '' }), 1500);
            }

            const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioBase64 && audioContextsRef.current) {
              const { output } = audioContextsRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, output.currentTime);
              const buffer = await decodeAudioData(decode(audioBase64), output, 24000, 1);
              const source = output.createBufferSource();
              source.buffer = buffer;
              source.connect(output.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            }

            if (msg.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsLive(false),
          onerror: (e) => {
            console.error("Live Stream Error:", e);
            setIsLive(false);
          },
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Live Init Error:", err);
      setIsLive(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setResponse('');
    setSources([]);

    try {
      const result = await getGeminiResponse(input, activeTab, grade);
      setResponse(result.text);
      setSources(result.sources || []);
      
      const newItem = { 
        id: Date.now().toString(), 
        type: activeTab, 
        query: input, 
        response: result.text, 
        timestamp: Date.now() 
      };
      const updated = [newItem, ...history].slice(0, 50);
      setHistory(updated);
      localStorage.setItem('tsai-paradox-history', JSON.stringify(updated));
    } catch (err) {
      setResponse("Fatal Paradox: Connection with the academic archive was lost.");
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (type: ToolType) => {
    switch(type) {
      case ToolType.MATH: return { bg: 'bg-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400' };
      case ToolType.KNOWLEDGE: return { bg: 'bg-green-600/10', border: 'border-green-500/20', text: 'text-green-400' };
      case ToolType.SPELLING_BEE: return { bg: 'bg-yellow-600/10', border: 'border-yellow-500/20', text: 'text-yellow-400' };
      case ToolType.GIFT: return { bg: 'bg-red-600/10', border: 'border-red-500/20', text: 'text-red-400' };
      default: return { bg: 'bg-slate-800', border: 'border-white/10', text: 'text-white' };
    }
  };

  const openTool = (type: ToolType) => {
    if (activeTab === ToolType.SPELLING_BEE) stopLiveSession();
    setActiveTab(type);
    setView(ViewState.TOOL);
    setResponse('');
    setSources([]);
    setInput('');
    if (type === ToolType.SPELLING_BEE) {
      startLiveSession();
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden" style={{ fontFamily: currentFont }}>
      <FestiveParticles density={50} />
      
      <header className="z-10 p-8 pt-16 flex flex-col items-center">
        <h1 className="text-7xl md:text-9xl paradox-title uppercase tracking-tighter cursor-default select-none">TSAI</h1>
        <div className="flex gap-4 mt-2">
           <span className="christmas-font text-red-500 text-xl">Merry</span>
           <span className="halloween-font text-orange-500 text-xl">Spooky</span>
           <span className="newyear-font text-yellow-500 text-sm flex items-center">2026</span>
        </div>

        <div className="mt-8 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
          <GraduationCap className="w-5 h-5 text-amber-500" />
          <select 
            value={grade} 
            onChange={(e) => handleGradeChange(e.target.value)}
            className="bg-transparent text-slate-300 text-sm font-bold outline-none cursor-pointer focus:text-white transition-colors"
          >
            {GRADES.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 z-10 w-full max-w-4xl mx-auto px-6 pb-32">
        {view === ViewState.HOME ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            {[
              { type: ToolType.MATH, title: "Math Solver", icon: Binary, desc: "Step-by-Step" },
              { type: ToolType.KNOWLEDGE, title: "Knowledge AI", icon: Globe, desc: "Global Archive" },
              { type: ToolType.SPELLING_BEE, title: "Spelling Practice", icon: Radio, desc: "Voice Master" }
            ].map((t) => (
              <button 
                key={t.type} 
                onClick={() => openTool(t.type)}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all text-left group backdrop-blur-md"
              >
                <t.icon className={`w-12 h-12 mb-4 ${getColorClasses(t.type).text}`} />
                <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
                <p className="text-slate-400 text-sm uppercase tracking-widest">{t.desc}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <button onClick={() => { stopLiveSession(); setView(ViewState.HOME); }} className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
                <ChevronLeft className="w-4 h-4" /> Home
              </button>
              <div className="flex gap-2">
                <div className={`px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-black uppercase flex items-center gap-2`}>
                   {grade}
                </div>
                <div className={`px-4 py-2 rounded-xl border ${getColorClasses(activeTab).bg} ${getColorClasses(activeTab).border} ${getColorClasses(activeTab).text} font-bold`}>
                  {activeTab} MODE
                </div>
              </div>
            </div>

            {activeTab === ToolType.SPELLING_BEE ? (
              <div className="flex flex-col gap-6">
                <div className={`p-12 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-3xl shadow-2xl relative overflow-hidden flex flex-col items-center gap-8 text-center`}>
                  {isLive && (
                    <div className="absolute top-4 right-6 flex items-center gap-2">
                       <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Academic Link Active</span>
                       <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                    </div>
                  )}
                  
                  <div className="p-8 rounded-full bg-yellow-500/10 border-2 border-yellow-500/20 animate-pulse">
                    <Volume2 className="w-16 h-16 text-yellow-500" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Listen & Speak</h3>
                    <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                      {loading ? 'Booting Academic Master...' : 'Master is speaking. Listen for the word, then spell it out loud clearly.'}
                    </p>
                  </div>

                  {liveTranscript.user && (
                    <div className="flex flex-col gap-2 items-center animate-in zoom-in duration-300 w-full">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Voice Detected</span>
                      <p className="text-2xl text-blue-300 font-black bg-blue-500/10 px-8 py-4 rounded-3xl border border-blue-500/20 tracking-[0.2em] uppercase">
                        {liveTranscript.user}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3 text-red-500 text-sm font-black uppercase tracking-widest bg-red-500/5 px-6 py-3 rounded-2xl border border-red-500/10">
                    <Mic className="w-4 h-4 animate-bounce" /> Mic Active
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={input} 
                    disabled={loading}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder={activeTab === ToolType.MATH ? `Professional Math (${grade})...` : `Direct Knowledge Archive (${grade})...`}
                    className="w-full bg-slate-900 border border-white/10 p-6 rounded-2xl text-white text-lg focus:ring-2 focus:ring-amber-500/50 outline-none placeholder:text-slate-600 transition-all group-hover:border-white/20"
                  />
                  <button 
                    onClick={() => handleSubmit()} 
                    disabled={loading || !input.trim()}
                    className="absolute right-4 top-4 p-2 bg-amber-600 rounded-xl hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <SendHorizontal className="w-6 h-6" />}
                  </button>
                </div>
                <ResponseView content={response} loading={loading} sources={sources} />
              </>
            )}
          </div>
        )}
      </main>

      {/* Fixed UI Components */}
      <footer className="p-10 flex flex-col items-center gap-4 fixed bottom-0 left-0 right-0 pointer-events-none z-50">
        <button 
          onClick={() => { setActiveTab(ToolType.GIFT); setView(ViewState.TOOL); setInput('Festive fact request.'); handleSubmit(); }}
          className="bg-red-600 p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce border-2 border-white/20 pointer-events-auto"
        >
          <Gift className="w-8 h-8 text-white" />
        </button>
        <p className="text-[10px] font-black tracking-[1em] text-slate-600 uppercase select-none">TSAI // ACADEMIC PROTOCOL 2026</p>
      </footer>

      {/* Memory Saver (History) Corner Component */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
        {showHistory && (
          <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 w-80 max-h-[70vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-4">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <History className="w-3 h-3" /> Memory Vault
              </h3>
              <div className="flex gap-2">
                <button onClick={clearHistory} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-white/10 text-slate-400 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center py-8">No academic traces found.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-default group">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${getColorClasses(item.type).bg} ${getColorClasses(item.type).text}`}>
                        {item.type}
                      </span>
                      <span className="text-[8px] text-slate-600">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-bold line-clamp-1">{item.query}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{item.response}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          className="p-4 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-amber-500 hover:bg-white/10 transition-all shadow-xl backdrop-blur-md"
        >
          <History className={`w-5 h-5 ${showHistory ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>

      {/* Settings Panel */}
      <div className="fixed bottom-4 left-4 z-[70]">
        <button onClick={() => setShowFontSettings(!showFontSettings)} className="p-4 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all shadow-xl backdrop-blur-md">
          <Settings className={`w-5 h-5 ${showFontSettings ? 'rotate-90' : ''} transition-transform`} />
        </button>
        {showFontSettings && (
          <div className="absolute bottom-16 left-0 bg-slate-900/95 backdrop-blur-3xl p-4 rounded-2xl border border-white/10 w-48 shadow-2xl flex flex-col gap-2 overflow-hidden animate-in slide-in-from-bottom-2">
            {FONTS.map(f => (
              <button 
                key={f.name} 
                onClick={() => { setCurrentFont(f.family); setShowFontSettings(false); }} 
                className={`text-left p-2 rounded-lg text-sm transition-colors ${currentFont === f.family ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

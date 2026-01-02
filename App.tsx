
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Globe, 
  Compass, 
  History as HistoryIcon, 
  Star,
  ChevronLeft,
  ChevronRight,
  Settings,
  SendHorizontal,
  ArrowRight,
  GraduationCap,
  Timer,
  Mic,
  Volume2,
  X,
  Binary,
  Ghost,
  CandyCane,
  Gift,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import FestiveParticles from './components/FestiveParticles';
import ResponseView from './components/ResponseView';
import { getGeminiResponse, getSpellingVoice } from './services/geminiService';
import { ToolType, HistoryItem, ViewState } from './types';
import { GoogleGenAI, Modality } from '@google/genai';

const FONTS = [
  { name: 'Quicksand', family: "'Quicksand', sans-serif", label: 'Modern' },
  { name: 'Great Vibes', family: "'Great Vibes', cursive", label: 'Rare Christmas' },
  { name: 'Butcherman', family: "'Butcherman', cursive", label: 'Rare Spooky' },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive", label: 'Rare 2026' },
  { name: 'Mountains of Christmas', family: "'Mountains of Christmas', cursive", label: 'Christmas' },
  { name: 'Creepster', family: "'Creepster', cursive", label: 'Spooky' },
  { name: 'Orbitron', family: "'Orbitron', sans-serif", label: 'Singularity' }
];

const GRADES = Array.from({ length: 12 }, (_, i) => `Tier ${i + 1}`);

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
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
  const [grade, setGrade] = useState('Tier 6');
  const [futureLevel, setFutureLevel] = useState(20);

  const [targetWord, setTargetWord] = useState('');
  const [spellingStreak, setSpellingStreak] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tsai-paradox-history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    if (activeTab === ToolType.SPELLING_BEE && targetWord) {
      const correct = input.trim().toLowerCase() === targetWord.toLowerCase();
      if (correct) {
        setSpellingStreak(s => s + 1);
        setResponse(`✨ SYNCED: "${targetWord.toUpperCase()}" is the word! Paradox stability increased.`);
        setTargetWord('');
        setInput('');
        setTimeout(() => startVoiceChallenge(), 1500);
      } else {
        setSpellingStreak(0);
        setResponse(`👻 GLITCH: Mistake detected. The Void consumes "${input.toUpperCase()}". Target was "${targetWord.toUpperCase()}".`);
        setTargetWord('');
      }
      setLoading(false);
      return;
    }

    try {
      const result = await getGeminiResponse(input, activeTab, grade);
      setResponse(result.text);
      if (result.sources) setSources(result.sources);
      const newItem = { id: Date.now().toString(), type: activeTab, query: input, response: result.text, timestamp: Date.now() };
      const updated = [newItem, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('tsai-paradox-history', JSON.stringify(updated));
    } catch (err) {
      setResponse("The Paradox is collapsing. Refresh to stabilize. 🌀");
    } finally {
      setLoading(false);
    }
  };

  const startVoiceChallenge = async () => {
    setLoading(true);
    try {
      const { word, base64Audio } = await getSpellingVoice(grade, 1);
      setTargetWord(word);
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        setResponse("🎧 Listening to the Midnight Transmission... Spell the word.");
      }
    } catch (err) { setResponse("Audio stream corrupted by ghosts. 🦇"); }
    finally { setLoading(false); }
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

  return (
    <div className="min-h-screen relative flex flex-col" style={{ fontFamily: currentFont }}>
      <FestiveParticles density={50} />
      
      <header className="z-10 p-8 pt-16 flex flex-col items-center">
        <h1 className="text-7xl md:text-9xl paradox-title uppercase tracking-tighter">TSAI</h1>
        <div className="flex gap-4 mt-2">
           <span className="christmas-font text-red-500 text-xl">Merry</span>
           <span className="halloween-font text-orange-500 text-xl">Spooky</span>
           <span className="newyear-font text-yellow-500 text-sm flex items-center">2026</span>
        </div>
      </header>

      <main className="flex-1 z-10 w-full max-w-4xl mx-auto px-6">
        {view === ViewState.HOME ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            {[
              { type: ToolType.MATH, title: "2+0+2+6= 2026", icon: Binary, desc: "Spooky Logic Core" },
              { type: ToolType.KNOWLEDGE, title: "General Knowledge", icon: Globe, desc: "Christmas Data Archive" },
              { type: ToolType.SPELLING_BEE, title: "Lexicon Bee", icon: Zap, desc: "Midnight Decryption" }
            ].map((t) => (
              <button 
                key={t.type} 
                onClick={() => { setActiveTab(t.type); setView(ViewState.TOOL); setResponse(''); setInput(''); }}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all text-left group"
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
              <button onClick={() => setView(ViewState.HOME)} className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
                <ChevronLeft className="w-4 h-4" /> Home
              </button>
              <div className={`px-4 py-2 rounded-xl border ${getColorClasses(activeTab).bg} ${getColorClasses(activeTab).border} ${getColorClasses(activeTab).text} font-bold`}>
                {activeTab} MODE
              </div>
            </div>

            {activeTab === ToolType.SPELLING_BEE && (
              <button onClick={startVoiceChallenge} className="bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/20 flex items-center justify-between hover:bg-yellow-500/20 transition-all group">
                <div className="flex items-center gap-4">
                  <Mic className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-yellow-400 font-black uppercase text-xs">Astra-9 Link</p>
                    <p className="text-white text-lg font-bold">Start Midnight Spelling Challenge</p>
                  </div>
                </div>
                {spellingStreak > 0 && <div className="text-yellow-500 font-black">Streak: {spellingStreak}</div>}
              </button>
            )}

            <div className="relative">
              <input 
                type="text" 
                value={input} 
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={activeTab === ToolType.MATH ? "2026 Math Sequence..." : "Enter Inquiry..."}
                className="w-full bg-slate-900 border border-white/10 p-6 rounded-2xl text-white text-lg focus:ring-2 focus:ring-amber-500/50 outline-none"
              />
              <button 
                onClick={() => handleSubmit()} 
                className="absolute right-4 top-4 p-2 bg-amber-600 rounded-xl hover:bg-amber-500 transition-colors"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <SendHorizontal className="w-6 h-6" />}
              </button>
            </div>

            <ResponseView content={response} loading={loading} sources={sources} />
          </div>
        )}
      </main>

      <footer className="p-10 flex flex-col items-center gap-4">
        <button 
          onClick={() => { setActiveTab(ToolType.GIFT); setView(ViewState.TOOL); setInput('Opening...'); handleSubmit(); }}
          className="bg-red-600 p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform animate-bounce border-2 border-white/20"
        >
          <Gift className="w-8 h-8 text-white" />
        </button>
        <p className="text-[10px] font-black tracking-[1em] text-slate-600 uppercase">TSAI // FESTIVE PARADOX 2026</p>
      </footer>

      {/* Font Settings */}
      <div className="fixed bottom-4 left-4 z-[70]">
        <button onClick={() => setShowFontSettings(!showFontSettings)} className="p-4 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all shadow-xl">
          <Settings className={`w-5 h-5 ${showFontSettings ? 'rotate-90' : ''} transition-transform`} />
        </button>
        {showFontSettings && (
          <div className="absolute bottom-16 left-0 bg-slate-900/90 backdrop-blur-3xl p-4 rounded-2xl border border-white/10 w-48 shadow-2xl flex flex-col gap-2">
            {FONTS.map(f => (
              <button 
                key={f.name} 
                onClick={() => setCurrentFont(f.family)} 
                className={`text-left p-2 rounded-lg text-sm ${currentFont === f.family ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
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

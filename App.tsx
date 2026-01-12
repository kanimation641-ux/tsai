import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  SendHorizontal,
  ChevronLeft,
  Binary,
  Loader2,
  GraduationCap,
  Trash2,
  History,
  X,
  LogIn,
  Mail,
  AlertCircle,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import ResponseView from './components/ResponseView.tsx';
import BackgroundEffect from './components/BackgroundEffect.tsx';
import { getGeminiResponse } from './services/geminiService.ts';
import { ToolType, HistoryItem, ViewState } from './types.ts';

const GRADES = [
  'Elementary (K-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'College/University',
  'Professional'
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.MATH);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auth States
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [grade, setGrade] = useState(GRADES[1]); 
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tsai-history');
    if (saved) setHistory(JSON.parse(saved));
    const savedGrade = localStorage.getItem('tsai-grade');
    if (savedGrade) setGrade(savedGrade);
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        (v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Victoria')) && v.lang.startsWith('en')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 0.85;
      utterance.pitch = 1.25;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError('');
    
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
    if (!email.trim()) {
      setEmailError('Please enter your email');
      return;
    }

    if (!gmailRegex.test(email)) {
      setEmailError('Type existing gmail please');
      return;
    }

    setAuthLoading(true);
    
    setTimeout(() => {
      setAuthLoading(false);
      setUserEmail(email);
      setView(ViewState.HOME);
      setShowWelcome(true);
      
      const welcomeMsg = "Welcome to T S A I, which stands for The Smartest Artificial Intelligence. I am your artificial intelligence assistant. What can I help you with today?";
      speak(welcomeMsg);
      
      setTimeout(() => setShowWelcome(false), 6000);
    }, 1200);
  };

  const handleLogout = () => {
    setUserEmail('');
    setEmail('');
    setView(ViewState.AUTH);
    window.speechSynthesis.cancel();
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    localStorage.setItem('tsai-grade', newGrade);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tsai-history');
  };

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || input;
    if (!queryToUse.trim() || loading) return;
    
    setLoading(true);
    setResponse('');
    setSources([]);

    try {
      const result = await getGeminiResponse(queryToUse, activeTab, grade);
      setResponse(result.text);
      setSources(result.sources || []);
      
      const newItem: HistoryItem = { 
        id: Date.now().toString(), 
        type: activeTab, 
        query: queryToUse, 
        response: result.text, 
        timestamp: Date.now() 
      };
      const updated = [newItem, ...history].slice(0, 50);
      setHistory(updated);
      localStorage.setItem('tsai-history', JSON.stringify(updated));
    } catch (err) {
      setResponse("System Error: Academic uplink failed.");
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (type: ToolType) => {
    switch(type) {
      case ToolType.MATH: return { bg: 'bg-slate-900/5', border: 'border-slate-900/10', text: 'text-slate-900' };
      case ToolType.KNOWLEDGE: return { bg: 'bg-slate-900/5', border: 'border-slate-900/10', text: 'text-slate-900' };
      case ToolType.FACT: return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-700' };
      default: return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-900' };
    }
  };

  const openTool = (type: ToolType) => {
    setActiveTab(type);
    setView(ViewState.TOOL);
    setResponse('');
    setSources([]);
    
    if (type === ToolType.FACT) {
      const q = "Tell me a hilarious, weird, and absolutely true daily fact.";
      setInput(q);
      // Trigger automatically for the daily fact
      setTimeout(() => handleSubmit(undefined, q), 100);
    } else {
      setInput('');
    }
  };

  const getUsername = (email: string) => {
    return email.split('@')[0];
  };

  // Auth Screen Component
  if (view === ViewState.AUTH) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
        <BackgroundEffect density={30} />
        <div className="z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
          <div className="glass-panel p-8 sm:p-12 rounded-[3rem] text-center shadow-2xl relative">
            <h1 className="text-7xl sm:text-8xl ai-title-text mb-2">TSAI</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mb-10">Secure Gateway</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group text-left">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-4">Gmail Identity</label>
                <div className={`flex items-center bg-white border ${emailError ? 'border-red-200 shadow-red-50' : 'border-slate-100'} p-4 rounded-3xl transition-all focus-within:ring-4 focus-within:ring-slate-100`}>
                  <Mail className={`w-5 h-5 mr-3 ${emailError ? 'text-red-400' : 'text-slate-300'}`} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="bg-transparent w-full text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none"
                    autoFocus
                  />
                </div>
                {emailError && (
                  <div className="flex items-center gap-1.5 mt-3 ml-4 text-red-500 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{emailError}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full group relative flex items-center justify-center gap-3 bg-slate-900 text-white p-5 rounded-3xl font-bold hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                ) : (
                  <>
                    Initialize Connection
                    <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            <p className="mt-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
              Academic Intelligence Stream<br/>Standard Protocol v3.1
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-slate-900 antialiased pb-safe">
      <BackgroundEffect density={window.innerWidth < 640 ? 20 : 40} />
      
      {/* User Account Box - Top Right */}
      <div className="fixed top-4 right-4 sm:top-8 sm:right-8 z-[80] animate-in slide-in-from-right-4 duration-500">
        <div className="glass-panel px-4 py-3 sm:px-6 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-white/60 flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Identity Verified</p>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">{getUsername(userEmail)}</h4>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg">
            <User className="w-4 h-4 sm:w-5 h-5" />
          </div>
          <div className="h-8 w-[1px] bg-slate-100 mx-1 sm:mx-2 hidden sm:block"></div>
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-2 sm:p-2.5 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
          >
            <LogOut className="w-4 h-4 sm:w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Welcome Notification */}
      {showWelcome && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-500 w-[90%] sm:w-auto">
          <div className="bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Welcome back, {getUsername(userEmail)}</span>
          </div>
        </div>
      )}

      <header className="z-10 px-6 py-12 sm:pt-24 flex flex-col items-center">
        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] ai-title-text select-none mb-2 sm:mb-4">TSAI</h1>
        <p className="text-slate-400 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.5em] sm:tracking-[0.7em] mb-8 sm:mb-12 text-center">Industrial Intelligence Core</p>

        <div className="flex items-center gap-2 sm:gap-3 bg-white/60 border border-white/80 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm backdrop-blur-xl transition-all">
          <GraduationCap className="w-3.5 h-3.5 sm:w-4 h-4 text-slate-400" />
          <select 
            value={grade} 
            onChange={(e) => handleGradeChange(e.target.value)}
            className="bg-transparent text-slate-600 text-xs sm:text-sm font-bold outline-none cursor-pointer focus:text-slate-900 transition-colors"
          >
            {GRADES.map(g => <option key={g} value={g} className="bg-white">{g}</option>)}
          </select>
        </div>
      </header>

      <main className="flex-1 z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        {view === ViewState.HOME ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-5xl mx-auto">
            <button 
              onClick={() => openTool(ToolType.MATH)}
              className="group glass-panel p-8 sm:p-10 rounded-[2.5rem] hover:translate-y-[-6px] active:scale-[0.98] transition-all text-left relative overflow-hidden"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-slate-900/10">
                <Binary className="w-6 h-6 sm:w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">Math Solver</h2>
              <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest font-extrabold">Advanced Logic Core</p>
            </button>

            <button 
              onClick={() => openTool(ToolType.KNOWLEDGE)}
              className="group glass-panel p-8 sm:p-10 rounded-[2.5rem] hover:translate-y-[-6px] active:scale-[0.98] transition-all text-left relative overflow-hidden"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-slate-900/10">
                <Globe className="w-6 h-6 sm:w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">Knowledge AI</h2>
              <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest font-extrabold">Global Archive Link</p>
            </button>

            <button 
              onClick={() => openTool(ToolType.FACT)}
              className="group glass-panel p-8 sm:p-10 rounded-[2.5rem] hover:translate-y-[-6px] active:scale-[0.98] transition-all text-left relative overflow-hidden border-amber-100"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-amber-500/10">
                <Sparkles className="w-6 h-6 sm:w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">Daily Fact</h2>
              <p className="text-amber-500 text-[10px] sm:text-xs uppercase tracking-widest font-extrabold">Funny Intelligence</p>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => setView(ViewState.HOME)} className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all font-bold text-slate-400 hover:text-slate-900 shadow-sm shrink-0">
                <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Return</span>
              </button>
              <div className="flex gap-2 sm:gap-3 overflow-hidden">
                <div className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-100 bg-white/80 text-slate-400 text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-2 shadow-sm whitespace-nowrap`}>
                   <span className="truncate">{grade}</span>
                </div>
                <div className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border ${getColorClasses(activeTab).border} ${getColorClasses(activeTab).bg} ${getColorClasses(activeTab).text} font-black text-[9px] sm:text-[10px] uppercase shadow-sm`}>
                  {activeTab}
                </div>
              </div>
            </div>

            <div className="relative group">
              <input 
                type="text" 
                value={input} 
                disabled={loading}
                autoFocus
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={activeTab === ToolType.MATH ? `State problem...` : activeTab === ToolType.FACT ? `Requesting oddities...` : `Access archives...`}
                className="w-full bg-white/95 border border-slate-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-slate-900 text-lg sm:text-xl font-medium focus:ring-4 focus:ring-slate-100 outline-none placeholder:text-slate-300 transition-all shadow-xl sm:shadow-2xl shadow-slate-200/40"
              />
              <button 
                onClick={() => handleSubmit()} 
                disabled={loading || !input.trim()}
                className="absolute right-3 top-3 sm:right-5 sm:top-5 p-3 sm:p-3.5 bg-slate-900 text-white rounded-xl sm:rounded-[1.25rem] hover:bg-black active:scale-95 transition-all shadow-lg sm:shadow-xl shadow-slate-900/20"
              >
                {loading ? <Loader2 className="w-5 h-5 sm:w-7 h-7 animate-spin" /> : <SendHorizontal className="w-5 h-5 sm:w-7 h-7" />}
              </button>
            </div>
            <ResponseView content={response} loading={loading} sources={sources} />
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[70] flex flex-col items-end gap-3 sm:gap-5">
        {showHistory && (
          <div className="glass-panel w-[calc(100vw-3rem)] sm:w-80 max-h-[60vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between bg-white/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" /> Archive
              </h3>
              <div className="flex gap-2">
                <button onClick={clearHistory} className="p-1.5 sm:p-2 hover:bg-red-50 text-red-400 rounded-lg sm:rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowHistory(false)} className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-400 rounded-lg sm:rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-12 sm:py-16">No records found.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-50 hover:border-slate-200 transition-all cursor-default shadow-sm group">
                    <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                      <span className={`text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-full uppercase ${getColorClasses(item.type).bg} ${getColorClasses(item.type).text} border border-slate-100`}>
                        {item.type}
                      </span>
                      <span className="text-[8px] text-slate-300 font-bold">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-900 font-bold line-clamp-1">{item.query}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{item.response}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          className={`p-4 sm:p-6 rounded-full transition-all shadow-2xl border-2 active:scale-90 ${showHistory ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-white text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}
        >
          <History className={`w-6 h-6 sm:w-8 h-8 ${showHistory ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>

      <footer className="p-6 sm:p-12 flex justify-center fixed bottom-0 left-0 right-0 pointer-events-none">
        <p className="text-[8px] sm:text-[10px] font-black tracking-[0.8em] sm:tracking-[1.2em] text-slate-300 uppercase select-none text-center">TSAI INDUSTRIAL INTELLIGENCE</p>
      </footer>
    </div>
  );
};

export default App;
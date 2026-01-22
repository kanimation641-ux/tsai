import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Sparkles, 
  Clock, 
  Calendar, 
  Edit2, 
  Check, 
  BookOpen, 
  Star, 
  Ban, 
  Mic, 
  MicOff, 
  UserCheck,
  RefreshCw,
  Play,
  RotateCcw,
  FlaskConical,
  Code2,
  Flame,
  TrendingUp,
  Diamond,
  Files,
  Search,
  Layout,
  Settings,
  ArrowLeft
} from 'lucide-react';
import ResponseView from './components/ResponseView.tsx';
import BackgroundEffect from './components/BackgroundEffect.tsx';
import { getGeminiResponse } from './services/geminiService.ts';
import { ToolType, HistoryItem, ViewState, PersonalityType } from './types.ts';

const GRADES = [
  'Elementary (K-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'College/University',
  'Professional'
];

const PERSONALITIES = Object.values(PersonalityType);

const FORBIDDEN_WORDS = ['badword1', 'badword2', 'idiot', 'stupid', 'fuck', 'shit', 'asshole', 'bitch'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.MATH);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [banUntil, setBanUntil] = useState<number>(() => {
    const saved = localStorage.getItem('tsai-ban-until');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeRemaining, setBanTimeRemaining] = useState(0);

  const [examName, setExamName] = useState(() => localStorage.getItem('tsai-exam-name') || 'Strategic Assessment');
  const [examDate, setExamDate] = useState(() => localStorage.getItem('tsai-exam-date') || '');
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [tempExamName, setTempExamName] = useState(examName);
  const [tempDays, setTempDays] = useState('1');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [grade, setGrade] = useState(GRADES[3]); 
  const [personality, setPersonality] = useState<PersonalityType>(PersonalityType.TEACHER);

  const [wordOfDay, setWordOfDay] = useState<string>('');
  const [wordCountry, setWordCountry] = useState<string>('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [isWordLoading, setIsWordLoading] = useState(false);

  const [motivation, setMotivation] = useState<string>('');
  const [isMotivationLoading, setIsMotivationLoading] = useState(false);

  // Code Astro specific state
  const [codeContent, setCodeContent] = useState(''); 
  const [isPreviewing, setIsPreviewing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tsai-history');
    if (saved) setHistory(JSON.parse(saved));
    const savedGrade = localStorage.getItem('tsai-grade');
    if (savedGrade) setGrade(savedGrade);
    const savedPersonality = localStorage.getItem('tsai-personality') as PersonalityType;
    if (savedPersonality) setPersonality(savedPersonality);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    const speechInterval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
    }, 200);

    return () => clearInterval(speechInterval);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string, options: { rate?: number; gender?: 'male' | 'female' } = {}) => {
    const { rate = 1.0, gender = 'female' } = options;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const sanitizedText = text.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      if (!sanitizedText) return;
      const utterance = new SpeechSynthesisUtterance(sanitizedText);
      const voices = window.speechSynthesis.getVoices();
      
      let voice;
      if (gender === 'male') {
        voice = voices.find(v => 
          (v.name.includes('Male') || v.name.includes('Guy') || v.name.includes('Daniel') || v.name.includes('Alex')) && v.lang.startsWith('en')
        );
      } else {
        voice = voices.find(v => 
          (v.name.includes('Female') || v.name.includes('Samantha')) && v.lang.startsWith('en')
        );
      }

      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const fetchWordOfDay = async (country?: string) => {
    setIsWordLoading(true);
    setIsTranslated(false);
    try {
      const targetCountry = country || wordCountry || "international linguistic archive";
      const prompt = `Give me a beautiful word from ${targetCountry}. Only provide the response in the specified format without extra chatter.`;
      const res = await getGeminiResponse(prompt, ToolType.WORD, grade, personality, (t) => setWordOfDay(t));
      setWordOfDay(res.text);
    } catch (e) {
      setWordOfDay("Archive momentarily unavailable.");
    } finally {
      setIsWordLoading(false);
    }
  };

  const fetchMotivation = async () => {
    setIsMotivationLoading(true);
    try {
      const prompt = "Provide a high-level motivational insight for an elite strategic mind.";
      const res = await getGeminiResponse(prompt, ToolType.MOTIVATION, grade, personality, (t) => setMotivation(t));
      setMotivation(res.text);
    } catch (e) {
      setMotivation("Excellence is the only objective.");
    } finally {
      setIsMotivationLoading(false);
    }
  };

  useEffect(() => {
    const checkBan = () => {
      const now = Date.now();
      if (banUntil > now) {
        setIsBanned(true);
        setBanTimeRemaining(Math.ceil((banUntil - now) / 1000));
      } else {
        setIsBanned(false);
        setBanTimeRemaining(0);
      }
    };
    checkBan();
    const interval = setInterval(checkBan, 1000);
    return () => clearInterval(interval);
  }, [banUntil]);

  useEffect(() => {
    if (!examDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(examDate).getTime();
      const difference = target - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [examDate]);

  const triggerBan = () => {
    const end = Date.now() + 3 * 60 * 1000;
    setBanUntil(end);
    localStorage.setItem('tsai-ban-until', end.toString());
    speak("Inappropriate language detected. Session protocol suspended. Please maintain standards of excellence.", { rate: 0.85, gender: 'male' });
  };

  const containsForbidden = (text: string) => {
    const lower = text.toLowerCase();
    return FORBIDDEN_WORDS.some(word => lower.includes(word));
  };

  const getUsername = (email: string) => email.split('@')[0];

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError('');
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!email.trim()) {
      setEmailError('Identity verification required');
      return;
    }
    if (!gmailRegex.test(email)) {
      setEmailError('Gmail Identity required');
      return;
    }
    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      setUserEmail(email);
      setView(ViewState.HOME);
      fetchWordOfDay();
      fetchMotivation();
    }, 1000);
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
    if (view === ViewState.HOME) {
      fetchWordOfDay();
      fetchMotivation();
    }
  };

  const handlePersonalityChange = (newPers: PersonalityType) => {
    setPersonality(newPers);
    localStorage.setItem('tsai-personality', newPers);
    if (view === ViewState.HOME) {
      fetchWordOfDay();
      fetchMotivation();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('tsai-history');
  };

  const handleSaveExam = () => {
    const days = parseFloat(tempDays) || 0;
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString();
    setExamName(tempExamName);
    setExamDate(dateStr);
    localStorage.setItem('tsai-exam-name', tempExamName);
    localStorage.setItem('tsai-exam-date', dateStr);
    setIsEditingExam(false);
  };

  const parsedWord = useMemo(() => {
    if (!wordOfDay) return null;
    const lines = wordOfDay.split('\n').map(l => l.trim()).filter(l => l);
    const wordLine = lines.find(l => l.startsWith('#')) || '';
    const wordMatch = wordLine.match(/#\s*(.*?)\s*\((.*?)\)/);
    
    return {
      word: wordMatch ? wordMatch[1] : (wordLine.replace('#', '').trim() || 'Insight'),
      origin: wordMatch ? wordMatch[2] : (lines.find(l => l.toLowerCase().includes('origin'))?.split(':')?.slice(1).join(':').trim() || 'Global'),
      pronunciation: lines.find(l => l.toLowerCase().includes('pronunciation'))?.split(':')?.slice(1).join(':').trim() || '',
      definition: lines.find(l => l.toLowerCase().includes('definition'))?.split(':')?.slice(1).join(':').trim() || 'Connecting to archive...',
    };
  }, [wordOfDay]);

  const parsedMotivation = useMemo(() => {
    if (!motivation) return null;
    const lines = motivation.split('\n').map(l => l.trim()).filter(l => l);
    return {
      title: lines.find(l => l.startsWith('#'))?.replace('#', '').trim() || 'Directive',
      quote: lines.find(l => l.startsWith('"'))?.replace(/"/g, '').trim() || 'Excellence is a choice.',
      commentary: lines.find(l => l.startsWith('-'))?.replace('-', '').trim() || 'Maintain focus.'
    };
  }, [motivation]);

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || input;
    if (!queryToUse.trim() || loading || isBanned) return;
    if (containsForbidden(queryToUse)) {
      triggerBan();
      return;
    }
    setLoading(true);
    setResponse('');
    setSources([]);
    try {
      // Use streaming to make answers feel much faster
      const result = await getGeminiResponse(queryToUse, activeTab, grade, personality, (t) => {
        setResponse(t);
      });
      
      setResponse(result.text);
      setSources(result.sources || []);
      
      if (activeTab === ToolType.MATH) {
        const lines = result.text.split('\n');
        const finalAnswerLine = lines.reverse().find(line => line.toLowerCase().includes('final answer'));
        speak(finalAnswerLine || lines[0] || result.text);
      } else if (activeTab !== ToolType.MOTIVATION) {
        speak(result.text);
      }
      
      const newItem: HistoryItem = { id: Date.now().toString(), type: activeTab, query: queryToUse, response: result.text, timestamp: Date.now() };
      const updated = [newItem, ...history].slice(0, 50);
      setHistory(updated);
      localStorage.setItem('tsai-history', JSON.stringify(updated));
    } catch (err) {
      setResponse("Archives accessible signal low. Retrying connection...");
    } finally {
      setLoading(false);
    }
  };

  const openTool = (type: ToolType) => {
    setActiveTab(type);
    setView(ViewState.TOOL);
    setResponse('');
    setSources([]);
    setInput('');
    setIsPreviewing(false); 
    if (type === ToolType.FACT) {
      const q = "Provide a high-level general knowledge fact.";
      setTimeout(() => handleSubmit(undefined, q), 100);
    } else if (type === ToolType.MOTIVATION) {
      const q = "Provide a high-level motivational insight.";
      setTimeout(() => handleSubmit(undefined, q), 100);
    }
  };

  const lineNumbers = useMemo(() => {
    const lines = codeContent.split('\n').length;
    return Array.from({ length: lines || 1 }, (_, i) => i + 1);
  }, [codeContent]);

  if (isBanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <BackgroundEffect density={30} />
        <div className="z-50 glass-panel p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 sm:w-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Ban className="w-8 h-8 text-amber-600" /></div>
          <h2 className="text-2xl sm:text-4xl font-black ai-title-text uppercase tracking-tighter premium-font">PROTOCOL SUSPENDED</h2>
          <div className="bg-slate-50 p-4 sm:p-6 rounded-3xl border border-slate-200 mb-6 mt-4">
            <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-widest">Restoring In</p>
            <div className="text-3xl sm:text-5xl font-black text-amber-600 tabular-nums">{Math.floor(banTimeRemaining / 60)}:{String(banTimeRemaining % 60).padStart(2, '0')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === ViewState.AUTH) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <BackgroundEffect density={40} />
        <div className="z-30 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
          <div className="glass-panel p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] text-center shadow-2xl relative">
            <div className="absolute -top-6 sm:-top-10 left-1/2 -translate-x-1/2 bg-white p-3 sm:p-4 rounded-full shadow-lg border border-slate-200"><Diamond className="w-6 h-6 text-amber-500" /></div>
            <h1 className="text-5xl sm:text-8xl ai-title-text premium-font mb-1 sm:mb-2 mt-4 sm:mt-6">TSAI</h1>
            <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-10">Premium Intelligence Gateway</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group text-left">
                <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-4">Elite Identity</label>
                <div className={`flex items-center bg-white border ${emailError ? 'border-red-500' : 'border-slate-200'} p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl transition-all focus-within:ring-4 focus-within:ring-amber-50`}>
                  <Mail className={`w-4 h-4 sm:w-5 h-5 mr-3 ${emailError ? 'text-red-400' : 'text-slate-300'}`} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@gmail.com" className="bg-transparent w-full text-sm font-medium text-slate-900 outline-none" autoFocus />
                </div>
                {emailError && <div className="flex items-center gap-1.5 mt-2 ml-4 text-red-400 text-[9px] font-bold uppercase">{emailError}</div>}
              </div>
              <button type="submit" disabled={authLoading} className="w-full premium-button-gold p-4 sm:p-5 rounded-2xl sm:rounded-3xl font-bold transition-all active:scale-95 disabled:opacity-50 mt-2 text-sm sm:text-base">
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Initialize Connection"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-slate-600 antialiased pb-safe overflow-x-hidden">
      <BackgroundEffect density={50} />
      
      <div className="fixed top-3 right-3 sm:top-8 sm:right-8 z-[80] animate-in slide-in-from-right-4 duration-500">
        <div className="glass-panel px-3 py-2 sm:px-6 sm:py-4 rounded-[1.25rem] sm:rounded-[2rem] shadow-xl border-slate-200 flex items-center gap-3">
          <div className="flex flex-col items-end">
            <p className="text-[7px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest leading-tight">Verified</p>
            <h4 className="text-[10px] sm:text-sm font-bold text-slate-800 tracking-tight truncate max-w-[80px] sm:max-w-none">{getUsername(userEmail)}</h4>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center shadow-sm border border-slate-200">
            <User className="w-3.5 h-3.5 sm:w-5 h-5" />
          </div>
          <button onClick={handleLogout} className="p-2 sm:p-2.5 bg-white text-slate-400 rounded-xl sm:rounded-2xl hover:text-red-500 transition-all active:scale-90 border border-slate-200">
            <LogOut className="w-3.5 h-3.5 sm:w-5 h-5" />
          </button>
        </div>
      </div>

      <header className="z-10 px-4 py-8 sm:py-12 sm:pt-24 flex flex-col items-center">
        <h1 className="text-5xl sm:text-8xl md:text-9xl ai-title-text premium-font select-none mb-1">TSAI</h1>
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-slate-400 text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.3em]">Advanced Intelligence Core</p>
            <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full max-w-2xl px-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm backdrop-blur-xl transition-all">
            <GraduationCap className="w-3 h-3 text-amber-600" />
            <select value={grade} onChange={(e) => handleGradeChange(e.target.value)} className="bg-transparent text-slate-800 text-[10px] sm:text-sm font-bold outline-none cursor-pointer">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-sm backdrop-blur-xl transition-all">
            <UserCheck className="w-3 h-3 text-amber-600" />
            <select value={personality} onChange={(e) => handlePersonalityChange(e.target.value as PersonalityType)} className="bg-transparent text-slate-800 text-[10px] sm:text-sm font-bold outline-none cursor-pointer">
              {PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        {view === ViewState.HOME ? (
          <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 sm:gap-8">
              <div className="glass-panel p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl overflow-hidden relative group flex flex-col justify-between min-h-[280px] sm:min-h-[320px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -translate-y-24 translate-x-24 blur-3xl opacity-30"></div>
                <div className="flex flex-col items-center gap-4 sm:gap-6 relative z-10 py-2 sm:py-4">
                  <div className="flex flex-col text-center w-full">
                    <div className="flex items-center justify-center gap-1.5 mb-2 sm:mb-3">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Target ETA</span>
                    </div>
                    {isEditingExam ? (
                      <div className="flex flex-col gap-2.5 mt-1 sm:mt-2 animate-in fade-in slide-in-from-left-2 w-full max-w-xs mx-auto">
                        <input type="text" value={tempExamName} onChange={(e) => setTempExamName(e.target.value)} className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none" />
                        <div className="flex gap-2">
                          <input type="number" min="1" value={tempDays} onChange={(e) => setTempDays(e.target.value)} className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-900" />
                          <button onClick={handleSaveExam} className="premium-button-gold px-4 py-2 rounded-xl"><Check className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center group/title">
                        <h2 className="text-xl sm:text-4xl font-black ai-title-text premium-font tracking-tight flex items-center gap-2 mb-0.5 sm:mb-1">
                          {examName}
                          <button onClick={() => setIsEditingExam(true)} className="opacity-0 group-hover/title:opacity-100 p-1.5 hover:bg-slate-50 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5 text-slate-300" /></button>
                        </h2>
                        <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">{examDate ? `ETA ${new Date(examDate).toLocaleDateString(undefined, { dateStyle: 'long' })}` : 'Objective Counter'}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-8 justify-center py-2">
                    {[{ label: 'DAYS', value: timeLeft.days }, { label: 'HOURS', value: timeLeft.hours }, { label: 'MINS', value: timeLeft.mins }].map((unit, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-16 h-16 sm:w-24 bg-white border border-slate-200 rounded-[1.25rem] sm:rounded-[2rem] flex items-center justify-center shadow-sm mb-2 transform group-hover:translate-y-[-4px] transition-all">
                          <span className="text-xl sm:text-4xl font-black ai-title-text premium-font">{unit.value.toString().padStart(2, '0')}</span>
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{unit.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {!examDate && !isEditingExam && (<button onClick={() => setIsEditingExam(true)} className="absolute inset-0 bg-slate-50/20 backdrop-blur-[1px] flex items-center justify-center text-slate-400 font-black uppercase tracking-[0.2em] text-xs sm:text-sm hover:bg-slate-100/50 transition-all z-20"><Calendar className="w-4 h-4 mr-3" /> Set Assessment</button>)}
              </div>
              
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl flex flex-col justify-between relative group overflow-hidden flex-1">
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Linguistic Insight</span>
                      </div>
                      <input type="text" placeholder="Archive..." value={wordCountry} onChange={(e) => setWordCountry(e.target.value)} className="bg-transparent text-[8px] sm:text-[10px] font-bold text-slate-600 placeholder:text-slate-300 outline-none w-16 sm:w-20 border-b border-slate-100" />
                    </div>
                    {isWordLoading ? (
                      <div className="py-8 sm:py-12 flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>
                    ) : parsedWord ? (
                      <div className="animate-in fade-in">
                        {!isTranslated ? (
                          <div className="min-w-0">
                            <h3 className="text-2xl sm:text-3xl font-black ai-title-text premium-font leading-tight mb-1">{parsedWord.word}</h3>
                            <p className="text-[10px] text-slate-400 italic mb-4">{parsedWord.pronunciation} • {parsedWord.origin}</p>
                          </div>
                        ) : (
                          <div className="py-2 animate-in fade-in">
                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 mb-0.5">Translation</p>
                            <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">{parsedWord.definition}</p>
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <button onClick={() => fetchWordOfDay()} disabled={isWordLoading} className="flex-1 py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest premium-button-silver flex items-center justify-center gap-2">
                            <RefreshCw className={`w-3 h-3 ${isWordLoading ? 'animate-spin' : ''}`} /> Switch Word
                          </button>
                          <button onClick={() => setIsTranslated(!isTranslated)} className={`flex-1 py-2.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${isTranslated ? 'premium-button-silver' : 'premium-button-gold'}`}>
                            {isTranslated ? "Show Original" : "Translate to English"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl relative overflow-hidden flex-1">
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">Directive</span>
                    </div>
                    {isMotivationLoading ? (
                      <div className="py-6 sm:py-8 flex flex-col items-center"><Loader2 className="w-5 h-5 text-amber-500 animate-spin" /></div>
                    ) : parsedMotivation ? (
                      <div className="animate-in fade-in">
                        <h4 className="text-[8px] sm:text-[10px] font-black ai-title-text uppercase mb-1">{parsedMotivation.title}</h4>
                        <p className="text-base sm:text-lg font-black text-slate-900 premium-font italic leading-tight mb-2">"{parsedMotivation.quote}"</p>
                      </div>
                    ) : null}
                  </div>
                  <button onClick={() => fetchMotivation()} disabled={isMotivationLoading} className="mt-2 text-[8px] sm:text-[9px] font-black uppercase text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1.5 ml-auto">REFRESH <RefreshCw className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <button onClick={() => openTool(ToolType.MATH)} className="group glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all text-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 tool-icon-silver rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:border-amber-400 group-hover:scale-105 transition-all">
                  <Binary className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <h2 className="text-xs sm:text-sm font-black ai-title-text premium-font leading-tight">Math Solver</h2>
                <p className="text-slate-400 text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold mt-1">Logic</p>
              </button>
              <button onClick={() => openTool(ToolType.KNOWLEDGE)} className="group glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all text-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 tool-icon-silver rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:border-amber-400 group-hover:scale-105 transition-all">
                  <Globe className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <h2 className="text-xs sm:text-sm font-black ai-title-text premium-font leading-tight">Global Core</h2>
                <p className="text-slate-400 text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold mt-1">Archive</p>
              </button>
              <button onClick={() => openTool(ToolType.SCIENCE)} className="group glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all text-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 tool-icon-silver rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:border-amber-400 group-hover:scale-105 transition-all">
                  <FlaskConical className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <h2 className="text-xs sm:text-sm font-black ai-title-text premium-font leading-tight">Science Lab</h2>
                <p className="text-slate-400 text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold mt-1">Research</p>
              </button>
              <button onClick={() => openTool(ToolType.CODING)} className="group glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all text-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 tool-icon-silver rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:border-amber-400 group-hover:scale-105 transition-all">
                  <Code2 className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <h2 className="text-xs sm:text-sm font-black ai-title-text premium-font leading-tight">Code Astro</h2>
                <p className="text-slate-400 text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold mt-1">Forge</p>
              </button>
              <button onClick={() => openTool(ToolType.MOTIVATION)} className="group glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all text-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 tool-icon-silver rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:border-amber-400 group-hover:scale-105 transition-all">
                  <Flame className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <h2 className="text-xs sm:text-sm font-black ai-title-text premium-font leading-tight">Motivation</h2>
                <p className="text-slate-400 text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold mt-1">Drive</p>
              </button>
              <button onClick={() => openTool(ToolType.STORY)} className="group glass-panel p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] hover:translate-y-[-8px] transition-all text-center">
                <div className="w-12 sm:w-16 h-12 sm:h-16 tool-icon-silver rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-sm group-hover:border-amber-400 group-hover:scale-105 transition-all">
                  <BookOpen className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <h2 className="text-xs sm:text-sm font-black ai-title-text premium-font leading-tight">Tales</h2>
                <p className="text-slate-400 text-[7px] sm:text-[8px] uppercase tracking-widest font-extrabold mt-1">Narrate</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button onClick={() => setView(ViewState.HOME)} className="premium-button-silver p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-bold shrink-0">
                <ChevronLeft className="w-4 h-4" /> <span>Back to Hub</span>
              </button>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-400 text-[8px] sm:text-[10px] font-black uppercase whitespace-nowrap"><span className="truncate">{grade}</span></div>
                <div className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-400 text-[8px] sm:text-[10px] font-black uppercase whitespace-nowrap"><span className="truncate">{personality}</span></div>
                <div className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border border-amber-200 bg-white text-slate-800 font-black text-[8px] sm:text-[10px] uppercase shadow-sm">{activeTab}</div>
              </div>
            </div>

            {activeTab === ToolType.CODING ? (
              <div className="flex flex-col gap-4 animate-in fade-in duration-700">
                <div className="glass-panel overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative min-h-[600px] flex border border-slate-200 bg-[#fefefe]">
                  
                  {/* VS Code Inspired Sidebar */}
                  <div className="w-12 sm:w-16 bg-[#f3f3f3] border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0">
                    <Files className="w-5 h-5 sm:w-6 sm:h-6 text-[#858585] cursor-pointer hover:text-amber-600 transition-colors" />
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#858585] cursor-pointer hover:text-amber-600 transition-colors" />
                    <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-[#858585] cursor-pointer hover:text-amber-600 transition-colors" />
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[#858585] cursor-pointer mt-auto mb-2" />
                  </div>

                  <div className="flex-1 flex flex-col relative">
                    {!isPreviewing ? (
                      <>
                        {/* Editor Header */}
                        <div className="h-10 bg-[#f3f3f3] border-b border-slate-200 flex items-center px-4 justify-between">
                          <div className="flex items-center gap-1 bg-white h-full px-4 border-r border-slate-200">
                            <Code2 className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] font-bold text-slate-600">index.html</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setCodeContent('')} 
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                              title="Reset Forge"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setIsPreviewing(true)} 
                              className="premium-button-gold px-5 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 shadow-sm"
                            >
                              <Play className="w-3 h-3 fill-current" /> Run Forge
                            </button>
                          </div>
                        </div>

                        {/* Editor Content Area */}
                        <div className="flex-1 flex bg-white font-mono text-sm sm:text-base relative group">
                          {/* Line Numbers gutter */}
                          <div className="w-10 sm:w-14 bg-[#f8f8f8] border-r border-slate-100 flex flex-col items-end py-4 pr-3 text-[#afafaf] select-none text-[11px] leading-[1.6]">
                            {lineNumbers.map(num => (
                              <div key={num} className="h-[1.6em]">{num}</div>
                            ))}
                          </div>
                          {/* Main Textarea */}
                          <textarea 
                            ref={editorRef}
                            value={codeContent} 
                            onChange={(e) => setCodeContent(e.target.value)}
                            placeholder="Start writing excellence from line 1..."
                            className="flex-1 p-4 bg-transparent text-slate-800 outline-none resize-none leading-[1.6] custom-scrollbar"
                            spellCheck={false}
                            autoFocus
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 bg-white relative animate-in zoom-in-95 duration-500">
                        {/* Back to Code Button - Top Right Overlay */}
                        <button 
                          onClick={() => setIsPreviewing(false)} 
                          className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl flex items-center gap-2 text-slate-600 hover:text-amber-600 hover:bg-white transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest"
                        >
                          <ArrowLeft className="w-4 h-4" /> Back to Forge
                        </button>
                        <iframe 
                          title="Forge Result"
                          srcDoc={codeContent}
                          className="w-full h-full border-none"
                          sandbox="allow-scripts"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative group flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      value={input} 
                      disabled={loading} 
                      autoFocus 
                      onChange={(e) => setInput(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} 
                      placeholder={activeTab === ToolType.STORY ? "Construct narrative..." : activeTab === ToolType.MATH ? `Process equation...` : activeTab === ToolType.SCIENCE ? "Analyze objective..." : `Consult Global Core...`} 
                      className="w-full bg-white border border-slate-200 p-5 sm:p-8 rounded-[1.25rem] sm:rounded-[2rem] text-slate-900 text-base sm:text-xl font-medium focus:ring-4 focus:ring-amber-50 outline-none placeholder:text-slate-300 transition-all shadow-xl backdrop-blur-md pr-12 sm:pr-40" 
                    />
                    <div className="absolute right-2 top-2 sm:right-4 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-1.5">
                      <button onClick={toggleListening} className={`p-2 sm:p-3.5 rounded-lg sm:rounded-[1.25rem] transition-all shadow-lg flex items-center justify-center ${isListening ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                        {isListening ? <MicOff className="w-5 h-5 sm:w-7 h-7" /> : <Mic className="w-5 h-5 sm:w-7 h-7" />}
                      </button>
                      <button onClick={() => handleSubmit()} disabled={loading || !input.trim()} className="p-2 sm:p-3.5 premium-button-gold rounded-lg sm:rounded-[1.25rem] active:scale-95 transition-all">
                        {loading ? <Loader2 className="w-5 h-5 sm:w-7 h-7 animate-spin" /> : <SendHorizontal className="w-5 h-5 sm:w-7 h-7" />}
                      </button>
                    </div>
                  </div>
                </div>
                <ResponseView content={response} loading={loading} sources={sources} onSpeak={() => { if (activeTab === ToolType.MATH) { const lines = response.split('\n'); const finalAnswerLine = lines.reverse().find(line => line.toLowerCase().includes('final answer')); speak(finalAnswerLine || response); } else { speak(response); } }} onStopSpeak={stopSpeaking} isSpeaking={isSpeaking} />
              </>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-[70] flex flex-col items-end gap-3">
        {showHistory && (
          <div className="glass-panel w-[calc(100vw-2rem)] sm:w-80 max-h-[60vh] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300 border-slate-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest ai-title-text premium-font flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" /> Session Logs
              </h3>
              <div className="flex gap-2">
                <button onClick={clearHistory} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-12">No current logs.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 hover:border-amber-400 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase bg-slate-50 border border-slate-100">{item.type}</span>
                      <span className="text-[8px] text-slate-300">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] font-bold ai-title-text premium-font line-clamp-1">{item.query}</p>
                    <p className="text-[9px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{item.response}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <button onClick={() => setShowHistory(!showHistory)} className={`p-4 sm:p-6 rounded-full transition-all shadow-2xl border active:scale-90 ${showHistory ? 'premium-button-gold border-amber-500' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600'}`}>
          <History className={`w-5 h-5 sm:w-8 h-8 ${showHistory ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>
      
      <footer className="p-4 sm:p-12 flex justify-center fixed bottom-0 left-0 right-0 pointer-events-none">
        <p className="text-[7px] sm:text-[10px] font-black tracking-[0.4em] sm:tracking-[1.2em] ai-title-text opacity-30 uppercase select-none">TSAI PREMIUM INTELLIGENCE CORE</p>
      </footer>
    </div>
  );
};

export default App;
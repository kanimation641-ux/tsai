import React from 'react';
import { Volume2, Square } from 'lucide-react';

interface ResponseViewProps {
  content: string;
  sources?: { title: string; uri: string }[];
  loading: boolean;
  onSpeak?: () => void;
  onStopSpeak?: () => void;
  isSpeaking?: boolean;
}

const ResponseView: React.FC<ResponseViewProps> = ({ 
  content, 
  sources, 
  loading, 
  onSpeak, 
  onStopSpeak,
  isSpeaking = false
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-20 bg-white/50 rounded-[1.5rem] sm:rounded-[3rem] border border-slate-200 animate-pulse shadow-sm backdrop-blur-md">
        <div className="flex gap-2 mb-6 sm:mb-8">
           <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-200 rounded-full animate-bounce"></div>
           <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-amber-400 rounded-full animate-bounce delay-100"></div>
           <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-200 rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">Consulting Core...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="glass-panel rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-12 md:p-16 shadow-xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000 relative group/view">
      {content && (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex gap-2 z-20">
          {isSpeaking ? (
            <button 
              onClick={onStopSpeak}
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl premium-button-gold animate-pulse shadow-lg"
              title="Stop Audio"
            >
              <Square className="w-4 h-4 sm:w-5 h-5 fill-current" />
            </button>
          ) : (
            <button 
              onClick={onSpeak}
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200 text-amber-600 hover:bg-slate-50 transition-all shadow-lg"
              title="Speak Intel"
            >
              <Volume2 className="w-4 h-4 sm:w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="prose prose-slate prose-sm sm:prose-base lg:prose-lg max-w-none text-slate-700 font-medium overflow-wrap-break-word">
        {content.split('\n').map((line, i) => (
          <p key={i} className={`mb-3 sm:mb-6 last:mb-0 leading-relaxed ${line.startsWith('#') || line.toLowerCase().includes('final answer') ? 'ai-title-text font-black text-lg sm:text-2xl' : ''}`}>
            {line}
          </p>
        ))}
      </div>
      
      {sources && sources.length > 0 && (
        <div className="mt-8 sm:mt-16 pt-6 sm:pt-12 border-t border-slate-100">
          <h4 className="text-[8px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Verified Sources
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            {sources.map((s, idx) => (
              <a 
                key={idx} 
                href={s.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-3xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3 sm:gap-5 text-[10px] sm:text-xs font-bold text-slate-600 hover:text-slate-900 group"
              >
                <span className="w-7 h-7 sm:w-10 sm:h-10 shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-lg sm:rounded-2xl text-[8px] sm:text-[10px] font-black group-hover:bg-amber-500 group-hover:text-white transition-all">{idx + 1}</span>
                <span className="truncate">{s.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseView;
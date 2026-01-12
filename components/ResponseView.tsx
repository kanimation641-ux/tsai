import React from 'react';

interface ResponseViewProps {
  content: string;
  sources?: { title: string; uri: string }[];
  loading: boolean;
}

const ResponseView: React.FC<ResponseViewProps> = ({ content, sources, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-20 bg-white/70 rounded-[2rem] sm:rounded-[3rem] border border-slate-50 animate-pulse shadow-sm">
        <div className="flex gap-2 mb-6 sm:mb-8">
           <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-900 rounded-full animate-bounce"></div>
           <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-900/60 rounded-full animate-bounce delay-100"></div>
           <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-slate-900/30 rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] sm:tracking-[1em] text-slate-900/30 text-center">Computing Result...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="bg-white/95 border border-white rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-16 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="prose prose-slate prose-sm sm:prose-base lg:prose-lg max-w-none text-slate-700 font-medium">
        {content.split('\n').map((line, i) => (
          <p key={i} className="mb-4 sm:mb-6 last:mb-0 leading-relaxed">{line}</p>
        ))}
      </div>
      
      {sources && sources.length > 0 && (
        <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-slate-50">
          <h4 className="text-[9px] sm:text-[11px] font-black text-slate-300 uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-900"></span>
            Intelligence Verification
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {sources.map((s, idx) => (
              <a 
                key={idx} 
                href={s.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-slate-50/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-slate-900/10 hover:bg-white transition-all flex items-center gap-4 sm:gap-5 text-xs font-bold text-slate-500 hover:text-slate-900 group shadow-sm overflow-hidden"
              >
                <span className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white border border-slate-100 flex items-center justify-center rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black group-hover:bg-slate-900 group-hover:text-white transition-all">{idx + 1}</span>
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
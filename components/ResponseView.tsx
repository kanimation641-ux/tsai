
import React from 'react';

interface ResponseViewProps {
  content: string;
  sources?: { title: string; uri: string }[];
  loading: boolean;
}

const ResponseView: React.FC<ResponseViewProps> = ({ content, sources, loading }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10 animate-pulse">
        <div className="flex gap-2 mb-4">
           <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
           <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce delay-100"></div>
           <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/50">Processing Paradox Streams...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed text-lg">
        {content}
      </div>
      
      {sources && sources.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Paradox Grounding</h4>
          <div className="grid grid-cols-1 gap-2">
            {sources.map((s, idx) => (
              <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-all flex items-center gap-3 text-sm font-bold text-blue-400 group">
                <span className="w-6 h-6 bg-blue-500/10 flex items-center justify-center rounded text-[10px] group-hover:bg-blue-500/20">{idx + 1}</span>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseView;

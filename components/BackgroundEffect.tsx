import React, { useMemo } from 'react';

const BackgroundEffect: React.FC<{ density?: number }> = ({ density = 60 }) => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: density }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * -100}vh`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * -20}s`,
      size: `${Math.random() * 3 + 1}px`,
      opacity: 0.2 + Math.random() * 0.4,
      drift: `${Math.random() * 30 - 15}px`,
    }));
  }, [density]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <style>
        {`
          @keyframes subtleSnow {
            0% { transform: translateY(-10vh) translateX(0) rotate(0deg); }
            50% { transform: translateY(50vh) translateX(var(--drift)) rotate(180deg); }
            100% { transform: translateY(110vh) translateX(0) rotate(360deg); }
          }
          .animate-snow {
            animation: subtleSnow linear infinite;
          }
        `}
      </style>
      {snowflakes.map((s) => (
        <div
          key={s.id}
          className="absolute animate-snow rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDuration: s.duration,
            animationDelay: s.delay,
            filter: 'blur(1px)',
            // @ts-ignore
            '--drift': s.drift,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/10" />
    </div>
  );
};

export default BackgroundEffect;
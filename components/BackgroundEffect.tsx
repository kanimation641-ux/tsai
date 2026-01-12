import React, { useMemo } from 'react';

const BackgroundEffect: React.FC<{ density?: number }> = ({ density = 40 }) => {
  const stars = useMemo(() => {
    return Array.from({ length: density }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 15}s`,
      delay: `${Math.random() * 10}s`,
      size: `${1.5 + Math.random() * 3}px`,
      twinkleDuration: `${2 + Math.random() * 3}s`,
      glowOpacity: 0.4 + Math.random() * 0.6,
    }));
  }, [density]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="particle absolute top-0 animate-fall"
          style={{
            left: s.left,
            animationDuration: s.duration,
            animationDelay: s.delay,
          }}
        >
          <div 
            className="rounded-full bg-white animate-twinkle"
            style={{
              width: s.size,
              height: s.size,
              animationDuration: s.twinkleDuration,
              boxShadow: `0 0 10px rgba(255, 255, 255, ${s.glowOpacity}), 0 0 20px rgba(255, 255, 255, 0.3)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default BackgroundEffect;
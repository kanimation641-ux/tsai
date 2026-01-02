
import React, { useMemo } from 'react';

const PARTICLE_TYPES = ['❄', '🎃', '✨', '🎁', '🦇', '🎆'];

const FestiveParticles: React.FC<{ density?: number }> = ({ density = 40 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: density }).map((_, i) => ({
      id: i,
      char: PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)],
      left: `${Math.random() * 100}%`,
      // Fix: the time unit 's' was incorrectly placed inside the expression interpolation ${...}.
      duration: `${7 + Math.random() * 12}s`,
      delay: `${Math.random() * 10}s`,
      size: `${15 + Math.random() * 25}px`,
      opacity: 0.2 + Math.random() * 0.6,
    }));
  }, [density]);

  // Ensure component returns the fragment containing the mapped particles.
  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.size,
            opacity: p.opacity,
          }}
        >
          {p.char}
        </div>
      ))}
    </>
  );
};

export default FestiveParticles;

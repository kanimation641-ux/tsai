
import React, { useMemo } from 'react';

interface SnowfallProps {
  density?: number;
}

const Snowfall: React.FC<SnowfallProps> = ({ density = 50 }) => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: density }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${5 + Math.random() * 10}s`,
      delay: `${Math.random() * 5}s`,
      size: `${10 + Math.random() * 20}px`,
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, [density]);

  return (
    <>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDuration: flake.duration,
            animationDelay: flake.delay,
            fontSize: flake.size,
            opacity: flake.opacity,
          }}
        >
          ❄
        </div>
      ))}
    </>
  );
};

export default Snowfall;

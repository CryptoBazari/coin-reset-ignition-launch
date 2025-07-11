import { useEffect, useRef } from "react";

export const AnimatedBackground3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const rotateX = y * 10;
      const rotateY = -x * 10;

      container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ 
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* 3D Floating Coins */}
      <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl animate-[spin_6s_linear_infinite] transform-gpu"
           style={{ 
             transform: 'translateZ(100px) rotateY(45deg)',
             animation: 'spin 6s linear infinite, float 4s ease-in-out infinite'
           }}>
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
          BTC
        </div>
      </div>

      <div className="absolute top-3/4 right-1/4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-2xl animate-[spin_8s_linear_infinite_reverse] transform-gpu"
           style={{ 
             transform: 'translateZ(80px) rotateX(30deg)',
             animation: 'spin 8s linear infinite reverse, float 3s ease-in-out infinite 1s'
           }}>
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-300 to-purple-400 flex items-center justify-center text-white font-bold text-xs">
          ETH
        </div>
      </div>

      <div className="absolute top-1/2 left-3/4 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-2xl animate-[spin_5s_linear_infinite] transform-gpu"
           style={{ 
             transform: 'translateZ(60px) rotateZ(60deg)',
             animation: 'spin 5s linear infinite, float 5s ease-in-out infinite 2s'
           }}>
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-green-300 to-emerald-400 flex items-center justify-center text-white font-bold text-xs">
          ADA
        </div>
      </div>

      {/* 3D Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full gap-1 transform-gpu"
             style={{ 
               transform: 'rotateX(60deg) translateZ(-200px)',
               transformStyle: 'preserve-3d'
             }}>
          {Array.from({ length: 64 }).map((_, i) => (
            <div 
              key={i}
              className="border border-white/20 bg-white/5"
              style={{
                transform: `translateZ(${Math.sin(i) * 20}px)`,
                animation: `pulse ${2 + (i % 3)}s ease-in-out infinite ${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `translateZ(${Math.random() * 200 - 100}px)`,
            animation: `float ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}

      {/* Custom animations styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateZ(var(--z, 0)); }
          50% { transform: translateY(-20px) translateZ(var(--z, 0)); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
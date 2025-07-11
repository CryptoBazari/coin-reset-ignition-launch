export const ConnectingSection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
      {/* Animated connecting waves */}
      <div className="absolute inset-0">
        <svg className="absolute top-0 left-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path 
            d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,0 L0,0 Z" 
            fill="url(#gradient1)"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
        </svg>
        
        <svg className="absolute bottom-0 left-0 w-full h-32 rotate-180" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path 
            d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,0 L0,0 Z" 
            fill="url(#gradient2)"
            className="animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Transform Your Crypto Investment Journey
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            Join thousands of investors who have revolutionized their crypto strategy with our comprehensive platform
          </p>
        </div>
      </div>
    </section>
  );
};
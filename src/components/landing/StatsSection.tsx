export const StatsSection = () => {
  return (
    <section className="py-20 px-6 md:px-8 bg-gradient-to-b from-primary to-primary/90">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-accent-foreground mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-accent-foreground/80 text-lg">
            Join our growing community of successful crypto investors
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-3 group-hover:scale-110 transition-transform duration-300">10,000+</div>
            <div className="text-accent-foreground/80 font-medium">Active Users</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-3 group-hover:scale-110 transition-transform duration-300">$50M+</div>
            <div className="text-accent-foreground/80 font-medium">Assets Analyzed</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-3 group-hover:scale-110 transition-transform duration-300">25k+</div>
            <div className="text-accent-foreground/80 font-medium">Portfolios Created</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl md:text-5xl font-bold text-accent mb-3 group-hover:scale-110 transition-transform duration-300">99.9%</div>
            <div className="text-accent-foreground/80 font-medium">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};
export const StatsSection = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">10,000+</div>
        <div className="text-muted-foreground">Active Users</div>
      </div>
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">$50M+</div>
        <div className="text-muted-foreground">Assets Analyzed</div>
      </div>
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">25k+</div>
        <div className="text-muted-foreground">Portfolios Created</div>
      </div>
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">99.9%</div>
        <div className="text-muted-foreground">Uptime</div>
      </div>
    </div>
  );
};
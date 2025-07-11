import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Zap, Users, LogIn } from "lucide-react";

export const WhyChooseSection = () => {
  return (
    <section className="relative py-32 bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Why Choose CoinPlatform?
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-blue-500/30">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">Bank-Grade Security</h3>
                  <p className="text-slate-300 leading-relaxed">Your data is encrypted and secured with industry-leading protocols and multi-layer protection systems.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-green-500/30">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-white mb-2 group-hover:text-green-400 transition-colors duration-300">Lightning Fast</h3>
                  <p className="text-slate-300 leading-relaxed">Real-time analysis and portfolio updates with sub-second response times powered by advanced algorithms.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm border border-purple-500/30">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">Expert Support</h3>
                  <p className="text-slate-300 leading-relaxed">24/7 support from crypto investment professionals with years of market experience.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-10 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-400 transition-colors duration-300">Ready to get started?</h3>
              <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                Join the community of smart crypto investors who use data-driven analysis to make better investment decisions.
              </p>
              
              <div className="space-y-4">
                <Link to="/auth">
                  <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 text-lg py-4 group-hover:scale-105 transition-all duration-300">
                    <LogIn className="h-5 w-5 mr-2" />
                    Start Free Account
                  </Button>
                </Link>
                <Link to="/learning">
                  <Button variant="outline" size="lg" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-blue-500/50 text-lg py-4 group-hover:scale-105 transition-all duration-300">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
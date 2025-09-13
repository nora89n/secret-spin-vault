import { Trophy, TrendingUp, Users } from "lucide-react";

export const PrizePool = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-casino-black to-casino-charcoal">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-gold bg-clip-text text-transparent">
            Current Prize Pool
          </h2>
          <div className="text-7xl md:text-8xl font-bold text-casino-gold animate-glow mb-4">
            $2,450,000
          </div>
          <p className="text-xl text-muted-foreground">
            Growing with every ticket purchased
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <Trophy className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">$2.4M</div>
            <div className="text-lg text-muted-foreground">Total Prize Pool</div>
          </div>
          
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <Users className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">1,247</div>
            <div className="text-lg text-muted-foreground">Active Players</div>
          </div>
          
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <TrendingUp className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">72h</div>
            <div className="text-lg text-muted-foreground">Until Next Draw</div>
          </div>
        </div>
      </div>
    </section>
  );
};
import { Trophy, TrendingUp, Users } from "lucide-react";
import { useGetTicketPrice, useGetTotalTickets, useGetCurrentDraw } from '@/hooks/useLottery';
import { useAccount } from 'wagmi';

export const PrizePool = () => {
  const { ticketPrice, isLoading: priceLoading } = useGetTicketPrice();
  const { totalTickets, isLoading: ticketsLoading } = useGetTotalTickets();
  const { currentDrawId, isLoading: drawLoading } = useGetCurrentDraw();
  const { address } = useAccount();

  // Calculate prize pool based on tickets sold
  const calculatePrizePool = () => {
    if (!ticketPrice || !totalTickets) return 0;
    const totalValue = Number(ticketPrice) * Number(totalTickets);
    return totalValue / 1e18; // Convert from wei to ETH
  };

  const prizePoolETH = calculatePrizePool();
  const prizePoolUSD = prizePoolETH * 2500; // Approximate ETH price

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const formatETH = (eth: number) => {
    return `${eth.toFixed(2)} ETH`;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-casino-black to-casino-charcoal">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-gold bg-clip-text text-transparent">
            Current Prize Pool
          </h2>
          <div className="text-7xl md:text-8xl font-bold text-casino-gold animate-glow mb-4">
            {priceLoading || ticketsLoading ? (
              <div className="animate-pulse">Loading...</div>
            ) : (
              formatNumber(prizePoolUSD)
            )}
          </div>
          <p className="text-xl text-muted-foreground">
            {priceLoading || ticketsLoading ? (
              'Calculating prize pool...'
            ) : (
              `${formatETH(prizePoolETH)} • Growing with every ticket purchased`
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <Trophy className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">
              {priceLoading || ticketsLoading ? (
                <div className="animate-pulse">...</div>
              ) : (
                formatNumber(prizePoolUSD)
              )}
            </div>
            <div className="text-lg text-muted-foreground">Total Prize Pool</div>
          </div>
          
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <Users className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">
              {ticketsLoading ? (
                <div className="animate-pulse">...</div>
              ) : (
                totalTickets ? Number(totalTickets).toLocaleString() : '0'
              )}
            </div>
            <div className="text-lg text-muted-foreground">Tickets Sold</div>
          </div>
          
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <TrendingUp className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">
              {drawLoading ? (
                <div className="animate-pulse">...</div>
              ) : (
                currentDrawId ? `#${Number(currentDrawId)}` : '#0'
              )}
            </div>
            <div className="text-lg text-muted-foreground">Current Draw</div>
          </div>
        </div>
      </div>
    </section>
  );
};
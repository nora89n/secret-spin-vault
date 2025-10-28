import { Trophy, TrendingUp, Users, Calendar } from "lucide-react";
import { useGetTicketPrice, useGetTotalTickets, useGetCurrentDraw } from '@/hooks/useLottery';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export const PrizePool = () => {
  const { ticketPrice, isLoading: priceLoading } = useGetTicketPrice();
  const { totalTickets, isLoading: ticketsLoading } = useGetTotalTickets();
  const { currentDrawId, isLoading: drawLoading } = useGetCurrentDraw();
  const { address } = useAccount();

  // 计算下次开奖时间 (每周日晚上8点)
  const getNextDrawTime = () => {
    const now = new Date();
    const nextSunday = new Date();
    
    // 计算到下一个周日的天数
    const daysUntilSunday = (7 - now.getDay()) % 7;
    const daysToAdd = daysUntilSunday === 0 ? 7 : daysUntilSunday; // 如果今天是周日，则下周
    
    nextSunday.setDate(now.getDate() + daysToAdd);
    nextSunday.setHours(20, 0, 0, 0); // 晚上8点
    
    return nextSunday;
  };

  const [nextDrawTime, setNextDrawTime] = useState(getNextDrawTime());
  const [timeUntilDraw, setTimeUntilDraw] = useState('');

  // 更新倒计时
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextDrawTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        // 如果时间已过，计算下一个周日
        const newNextDraw = getNextDrawTime();
        setNextDrawTime(newNextDraw);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeUntilDraw(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeUntilDraw(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilDraw(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // 每分钟更新

    return () => clearInterval(interval);
  }, [nextDrawTime]);

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
    return `${eth.toFixed(3)} ETH`;
  };

  return (
    <section className="py-20 bg-gradient-to-b from-casino-black to-casino-charcoal">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-gold bg-clip-text text-transparent">
            Weekly Prize Pool
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
              `${formatETH(prizePoolETH)} • Weekly draws every Sunday at 8:00 PM`
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
            <Calendar className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">
              {timeUntilDraw || 'Calculating...'}
            </div>
            <div className="text-lg text-muted-foreground">Until Next Draw</div>
          </div>
          
          <div className="text-center p-8 bg-card rounded-xl border border-casino-red/20 hover:border-casino-red/40 transition-all duration-300 hover:shadow-casino">
            <TrendingUp className="h-16 w-16 text-casino-red mx-auto mb-4" />
            <div className="text-3xl font-bold text-casino-gold mb-2">0.005</div>
            <div className="text-lg text-muted-foreground">ETH per Ticket</div>
          </div>
        </div>
      </div>
    </section>
  );
};
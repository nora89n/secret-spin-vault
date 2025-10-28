import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trophy, Users } from "lucide-react";
import { useGetCurrentDraw, useGetTotalTickets, useGetDrawInfo } from '@/hooks/useLottery';
import { useAccount } from 'wagmi';

export const WeeklyDrawSchedule = () => {
  const { address } = useAccount();
  const { currentDrawId, isLoading: drawLoading } = useGetCurrentDraw();
  const { totalTickets, isLoading: ticketsLoading } = useGetTotalTickets();
  const { drawInfo, isLoading: infoLoading } = useGetDrawInfo(currentDrawId || 0n);

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

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const calculatePrizePool = () => {
    if (!totalTickets) return 0;
    return Number(totalTickets) * 0.005; // 0.005 ETH per ticket
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Next Draw Info */}
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-casino-gold">
            <Calendar className="h-5 w-5" />
            Next Weekly Draw
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-casino-gold mb-2">
              {timeUntilDraw || 'Calculating...'}
            </div>
            <div className="text-sm text-muted-foreground">
              Until next draw
            </div>
          </div>
          
          <div className="bg-casino-black/50 rounded-lg p-4 border border-casino-gold/20">
            <div className="text-sm text-muted-foreground mb-2">Draw Time</div>
            <div className="font-medium text-casino-gold">
              {formatDateTime(nextDrawTime)}
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Weekly draws every Sunday at 8:00 PM
          </div>
        </CardContent>
      </Card>

      {/* Current Prize Pool */}
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-casino-gold">
            <Trophy className="h-5 w-5" />
            Current Prize Pool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-casino-gold mb-2">
              {ticketsLoading ? (
                <div className="animate-pulse">Loading...</div>
              ) : (
                formatNumber(prizePoolUSD)
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {ticketsLoading ? (
                'Calculating...'
              ) : (
                `${prizePoolETH.toFixed(3)} ETH`
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-casino-black/50 rounded-lg p-3 border border-casino-gold/20 text-center">
              <div className="text-sm text-muted-foreground">Tickets Sold</div>
              <div className="font-bold text-casino-gold">
                {ticketsLoading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  totalTickets ? Number(totalTickets).toLocaleString() : '0'
                )}
              </div>
            </div>
            
            <div className="bg-casino-black/50 rounded-lg p-3 border border-casino-gold/20 text-center">
              <div className="text-sm text-muted-foreground">Ticket Price</div>
              <div className="font-bold text-casino-gold">0.005 ETH</div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Prize pool grows with every ticket purchased
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

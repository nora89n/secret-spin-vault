import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, Coins } from "lucide-react";
import { 
  useGetCurrentRound,
  useGetRoundInfo
} from '@/hooks/useLotterySimple';
import { useState, useEffect } from 'react';

interface DrawResult {
  round: number;
  winningNumber: number;
  prizePool: string;
  ticketCount: number;
  isCompleted: boolean;
}

export const DrawResultsDisplay = () => {
  const { currentRound } = useGetCurrentRound();
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get round info for current round and previous rounds
  const { roundInfo: currentRoundInfo, isLoading: currentRoundLoading } = useGetRoundInfo(currentRound || 0n);
  const { roundInfo: prevRoundInfo, isLoading: prevRoundLoading } = useGetRoundInfo((currentRound || 1n) - 1n);

  useEffect(() => {
    const loadDrawResults = async () => {
      if (!currentRound) return;

      setIsLoading(true);
      const results: DrawResult[] = [];

      // Add previous round if it exists
      if (currentRound > 1n && prevRoundInfo) {
        results.push({
          round: Number((currentRound || 1n) - 1n),
          winningNumber: prevRoundInfo.isDrawn ? Number(prevRoundInfo.winningNumber) : 0,
          prizePool: formatPrizePool(prevRoundInfo.prizePool),
          ticketCount: Number(prevRoundInfo.totalTickets),
          isCompleted: prevRoundInfo.isDrawn
        });
      }

      // Add current round
      if (currentRoundInfo) {
        results.push({
          round: Number(currentRound),
          winningNumber: currentRoundInfo.isDrawn ? Number(currentRoundInfo.winningNumber) : 0,
          prizePool: formatPrizePool(currentRoundInfo.prizePool),
          ticketCount: Number(currentRoundInfo.totalTickets),
          isCompleted: currentRoundInfo.isDrawn
        });
      }

      setDrawResults(results);
      setIsLoading(false);
    };

    loadDrawResults();
  }, [currentRound, currentRoundInfo?.isDrawn, currentRoundInfo?.winningNumber, currentRoundInfo?.prizePool, currentRoundInfo?.totalTickets, prevRoundInfo?.isDrawn, prevRoundInfo?.winningNumber, prevRoundInfo?.prizePool, prevRoundInfo?.totalTickets]);

  const formatPrizePool = (pool: bigint | undefined) => {
    if (!pool) return "0.000 ETH";
    return `${(Number(pool) / 1e18).toFixed(3)} ETH`;
  };

  const formatDate = (round: number) => {
    // Mock date based on round number
    const baseDate = new Date('2025-01-27T14:00:00Z');
    const roundDate = new Date(baseDate.getTime() + (round - 1) * 30 * 60 * 1000); // 30 minutes per round
    return roundDate.toLocaleString();
  };

  if (isLoading || currentRoundLoading) {
    return (
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Draw Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading draw results...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-luxury border-casino-gold/20">
      <CardHeader>
        <CardTitle className="text-casino-gold flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Draw Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {drawResults.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-semibold mb-2">No Draws Yet</div>
            <div className="text-sm">Draw results will appear here after lottery rounds are completed</div>
          </div>
        ) : (
          drawResults.map((result) => (
            <div key={result.round} className="border border-casino-gold/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-casino-gold/20 rounded-full flex items-center justify-center text-sm font-semibold">
                    {result.round}
                  </div>
                  <div>
                    <div className="font-semibold">Round {result.round}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(result.round)}
                    </div>
                  </div>
                </div>
                <Badge 
                  className={result.isCompleted 
                    ? "bg-green-500/20 text-green-600 border-green-500/30" 
                    : "bg-blue-500/20 text-blue-600 border-blue-500/30"
                  }
                >
                  {result.isCompleted ? "Completed" : "Pending"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Winning Number</div>
                  <div className="text-2xl font-bold text-casino-gold">
                    {result.isCompleted ? result.winningNumber : "???"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
                  <div className="text-lg font-semibold flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {result.prizePool}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-casino-gold/10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{result.ticketCount} tickets sold</span>
                </div>
              </div>

              {result.isCompleted && (
                <div className="mt-3 p-3 bg-casino-gold/10 border border-casino-gold/30 rounded-lg">
                  <div className="flex items-center gap-2 text-casino-gold">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-semibold">Draw Complete</span>
                  </div>
                  <div className="text-sm text-casino-gold/80 mt-1">
                    Winning number: {result.winningNumber}
                  </div>
                </div>
              )}

              {!result.isCompleted && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-semibold">Draw Pending</span>
                  </div>
                  <div className="text-sm text-blue-600/80 mt-1">
                    Waiting for owner to draw lottery
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Current Round Status */}
        {currentRound && currentRoundInfo && (
          <div className="mt-4 p-4 bg-gradient-to-r from-casino-gold/10 to-casino-gold/5 border border-casino-gold/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-casino-gold" />
              <span className="font-semibold text-casino-gold">Current Round: {currentRound.toString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="font-semibold">
                  {currentRoundInfo.isDrawn ? "Drawn" : "Active"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Prize Pool</div>
                <div className="font-semibold">
                  {formatPrizePool(currentRoundInfo.prizePool)}
                </div>
              </div>
            </div>
            {currentRoundInfo.isDrawn && currentRoundInfo.winningNumber > 0 && (
              <div className="mt-2 p-2 bg-casino-gold/20 rounded text-center">
                <div className="text-sm text-muted-foreground">Winning Number</div>
                <div className="text-2xl font-bold text-casino-gold">
                  {currentRoundInfo.winningNumber.toString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

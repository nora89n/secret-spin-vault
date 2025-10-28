import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Trophy, Clock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { useAccount } from 'wagmi';
import { 
  useGetCurrentRound,
  useGetUserTicketCount,
  useGetRoundInfo
} from '@/hooks/useLotterySimple';
import { useDecryptTicket } from '@/hooks/useDecryptTicket';
import { useState, useEffect } from 'react';

interface TicketInfo {
  round: number;
  ticketIndex: number;
  number: number | null; // null means not decrypted yet
  isWinner?: boolean;
  isDecrypted: boolean;
}

export const UserTicketsDisplay = () => {
  const { address } = useAccount();
  const { currentRound } = useGetCurrentRound();
  const [userTickets, setUserTickets] = useState<TicketInfo[]>([]);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decryptingRounds, setDecryptingRounds] = useState<Set<number>>(new Set());
  const [decryptingTickets, setDecryptingTickets] = useState<Set<string>>(new Set());

  // Get user ticket counts for current and previous rounds
  const { ticketCount: currentTicketCount } = useGetUserTicketCount(address || '0x0', currentRound || 0n);
  const { ticketCount: prevTicketCount } = useGetUserTicketCount(address || '0x0', (currentRound || 1n) - 1n);
  
  // Get round info for determining winner status
  const { roundInfo: currentRoundInfo } = useGetRoundInfo(currentRound || 0n);
  const { roundInfo: prevRoundInfo } = useGetRoundInfo((currentRound || 1n) - 1n);

  // Decrypt hook
  const { decryptTicket, decryptUserTickets, isDecrypting, isReady, error: decryptError } = useDecryptTicket();

  useEffect(() => {
    const loadUserTickets = async () => {
      if (!address || !currentRound) {
        setUserTickets([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const tickets: TicketInfo[] = [];

      // Add previous round tickets if they exist
      if (currentRound > 1n && prevTicketCount && prevTicketCount > 0n) {
        const prevRound = Number(currentRound) - 1;
        
        for (let i = 0; i < Number(prevTicketCount); i++) {
          tickets.push({
            round: prevRound,
            ticketIndex: i,
            number: null, // Not decrypted yet
            isWinner: undefined,
            isDecrypted: false
          });
        }
      }

      // Add current round tickets if they exist
      if (currentTicketCount && currentTicketCount > 0n) {
        for (let i = 0; i < Number(currentTicketCount); i++) {
          tickets.push({
            round: Number(currentRound),
            ticketIndex: i,
            number: null, // Not decrypted yet
            isWinner: undefined,
            isDecrypted: false
          });
        }
      }

      setUserTickets(tickets);
      setIsLoading(false);
    };

    loadUserTickets();
  }, [address, currentRound, currentTicketCount, prevTicketCount]);

  // Update winner status when round info changes
  useEffect(() => {
    if (userTickets.length === 0) return;

    setUserTickets(prevTickets => 
      prevTickets.map(ticket => {
        let isWinner: boolean | undefined = undefined;
        
        // Check if this ticket's round has been drawn
        const isTicketRoundDrawn = ticket.round === Number(currentRound) 
          ? currentRoundInfo?.isDrawn 
          : ticket.round === Number(currentRound) - 1 
            ? prevRoundInfo?.isDrawn 
            : false;
            
        const winningNumber = ticket.round === Number(currentRound)
          ? currentRoundInfo?.winningNumber
          : ticket.round === Number(currentRound) - 1
            ? prevRoundInfo?.winningNumber
            : undefined;

        // Only calculate winner status if:
        // 1. The round has been drawn
        // 2. The ticket has been decrypted (number is not null)
        if (isTicketRoundDrawn && ticket.number !== null && winningNumber !== undefined) {
          isWinner = ticket.number === Number(winningNumber);
        }

        return { ...ticket, isWinner };
      })
    );
  }, [currentRoundInfo?.isDrawn, currentRoundInfo?.winningNumber, prevRoundInfo?.isDrawn, prevRoundInfo?.winningNumber, currentRound, userTickets.some(t => t.isDecrypted)]);

  const handleDecryptRound = async (round: number) => {
    if (!isReady || isDecrypting) return;

    setDecryptingRounds(prev => new Set(prev).add(round));
    
    try {
      const roundTickets = userTickets.filter(t => t.round === round);
      const ticketCount = roundTickets.length;
      
      if (ticketCount === 0) {
        console.log(`No tickets found for round ${round}`);
        return;
      }

      console.log(`🔓 Decrypting ${ticketCount} tickets for round ${round}`);
      
      // Decrypt all tickets for this round
      const decryptedNumbers = await decryptUserTickets(round, ticketCount);
      
      setUserTickets(prevTickets => 
        prevTickets.map(ticket => {
          if (ticket.round === round) {
            const decryptedNumber = decryptedNumbers[ticket.ticketIndex];
            return {
              ...ticket,
              number: decryptedNumber,
              isDecrypted: decryptedNumber !== null
            };
          }
          return ticket;
        })
      );
    } catch (error) {
      console.error('Failed to decrypt round:', error);
    } finally {
      setDecryptingRounds(prev => {
        const newSet = new Set(prev);
        newSet.delete(round);
        return newSet;
      });
    }
  };

  const handleDecryptSingleTicket = async (round: number, ticketIndex: number) => {
    if (!isReady || isDecrypting) return;

    const ticketKey = `${round}-${ticketIndex}`;
    setDecryptingTickets(prev => new Set(prev).add(ticketKey));
    
    try {
      console.log(`🔓 Decrypting single ticket: Round ${round}, Index ${ticketIndex}`);
      
      // Decrypt this single ticket
      const decryptedNumber = await decryptTicket(round, ticketIndex);
      
      setUserTickets(prevTickets => 
        prevTickets.map(ticket => {
          if (ticket.round === round && ticket.ticketIndex === ticketIndex) {
            return {
              ...ticket,
              number: decryptedNumber,
              isDecrypted: decryptedNumber !== null
            };
          }
          return ticket;
        })
      );
    } catch (error) {
      console.error(`Failed to decrypt ticket ${ticketIndex} in round ${round}:`, error);
    } finally {
      setDecryptingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketKey);
        return newSet;
      });
    }
  };

  // Group tickets by round
  const ticketsByRound = userTickets.reduce((acc, ticket) => {
    if (!acc[ticket.round]) {
      acc[ticket.round] = [];
    }
    acc[ticket.round].push(ticket);
    return acc;
  }, {} as Record<number, TicketInfo[]>);

  const getRoundStatus = (round: number) => {
    const roundTickets = ticketsByRound[round];
    if (!roundTickets || roundTickets.length === 0) return 'no-tickets';
    
    const hasUndefinedWinner = roundTickets.some(t => t.isWinner === undefined);
    if (hasUndefinedWinner) return 'pending';
    
    const hasWinner = roundTickets.some(t => t.isWinner === true);
    return hasWinner ? 'won' : 'lost';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'lost':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'won':
        return 'Won';
      case 'lost':
        return 'Lost';
      case 'pending':
        return 'Pending';
      default:
        return 'No Tickets';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'lost':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'pending':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  if (!address) {
    return (
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Your Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Connect your wallet to view your tickets
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Your Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading your tickets...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userTickets.length === 0) {
    return (
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Your Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-semibold mb-2">No Tickets Yet</div>
            <div className="text-sm">Purchase your first lottery ticket to get started!</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-luxury border-casino-gold/20">
      <CardHeader>
        <CardTitle className="text-casino-gold flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Your Tickets ({userTickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(ticketsByRound)
          .sort(([a], [b]) => Number(b) - Number(a)) // Sort by round number descending
          .map(([roundStr, tickets]) => {
            const round = Number(roundStr);
            const status = getRoundStatus(round);
            const isExpanded = expandedRound === round;
            const isCurrentRound = round === Number(currentRound);
            const isDecryptingRound = decryptingRounds.has(round);
            const hasDecryptedTickets = tickets.some(t => t.isDecrypted);
            
            return (
              <div key={round} className="border border-casino-gold/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="font-semibold">Round {round}</span>
                      {isCurrentRound && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRound(isExpanded ? null : round)}
                    >
                      {isExpanded ? 'Hide' : 'Show'} ({tickets.length} tickets)
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-2">
                    {tickets.map((ticket, index) => (
                      <div
                        key={`${ticket.round}-${ticket.ticketIndex}`}
                        className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-casino-gold/20 rounded-full flex items-center justify-center text-sm font-semibold">
                            {ticket.ticketIndex + 1}
                          </div>
                          <div className="text-lg font-semibold">
                            {ticket.isDecrypted ? (
                              `Number: ${ticket.number}`
                            ) : (
                              <span className="text-muted-foreground flex items-center gap-2">
                                <EyeOff className="h-4 w-4" />
                                Encrypted
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!ticket.isDecrypted && isReady && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDecryptSingleTicket(ticket.round, ticket.ticketIndex)}
                              disabled={decryptingTickets.has(`${ticket.round}-${ticket.ticketIndex}`) || isDecrypting}
                              className="text-xs"
                            >
                              {decryptingTickets.has(`${ticket.round}-${ticket.ticketIndex}`) ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Decrypting...
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Decrypt
                                </>
                              )}
                            </Button>
                          )}
                          
                          {ticket.isDecrypted && ticket.isWinner === true && (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-semibold">Winner!</span>
                            </div>
                          )}
                          {ticket.isDecrypted && ticket.isWinner === false && (
                            <div className="flex items-center gap-1 text-red-500">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Lost</span>
                            </div>
                          )}
                          {!ticket.isDecrypted && getRoundStatus(ticket.round) === 'won' && (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <EyeOff className="h-4 w-4" />
                              <span className="text-sm">Decrypt to see result</span>
                            </div>
                          )}
                          {ticket.isWinner === undefined && getRoundStatus(ticket.round) !== 'won' && (
                            <div className="flex items-center gap-1 text-blue-500">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {status === 'won' && hasDecryptedTickets && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Trophy className="h-5 w-5" />
                          <span className="font-semibold">Congratulations! You won this round!</span>
                        </div>
                        <div className="text-sm text-yellow-600/80 mt-1">
                          You can claim your prize from the contract
                        </div>
                      </div>
                    )}

                    {!hasDecryptedTickets && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600">
                          <EyeOff className="h-4 w-4" />
                          <span className="text-sm font-semibold">Tickets Encrypted</span>
                        </div>
                        <div className="text-sm text-blue-600/80 mt-1">
                          {status === 'won' 
                            ? 'Round completed! Click "Decrypt" to see if you won'
                            : 'Click "Decrypt" to view your ticket numbers'
                          }
                        </div>
                        {decryptError && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-600 text-xs">
                            <div className="font-semibold">Decryption Error:</div>
                            <div>{decryptError}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
};
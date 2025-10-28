import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, EyeOff, Plus, Trophy } from "lucide-react";
import { useAccount } from 'wagmi';
import { 
  usePurchaseTicket, 
  useGetTicketPrice, 
  useGetCurrentRound,
  useGetUserTicketCount,
  useGetPrizePool,
  useIsRoundDrawn,
  useGetWinningNumber,
  useDrawLottery
} from '@/hooks/useLotterySimple';
import { useZamaInstance } from '@/hooks/useZamaInstance';
import { useState } from 'react';
import { toast } from 'sonner';

export const TicketSectionSimple = () => {
  const { address } = useAccount();
  const { ticketPrice, isLoading: priceLoading } = useGetTicketPrice();
  const { currentRound, isLoading: roundLoading } = useGetCurrentRound();
  const { ticketCount, isLoading: countLoading } = useGetUserTicketCount(address || '0x0', currentRound || 0n);
  const { prizePool, isLoading: poolLoading } = useGetPrizePool(currentRound || 0n);
  const { isRoundDrawn, isLoading: drawnLoading } = useIsRoundDrawn(currentRound || 0n);
  const { winningNumber, isLoading: winningLoading } = useGetWinningNumber(currentRound || 0n);
  
  const { purchaseTicket, isLoading: purchaseLoading, isConfirmed, error: purchaseError, hash } = usePurchaseTicket();
  const { drawLottery, isLoading: drawLoading } = useDrawLottery();
  const { instance, isLoading: fheLoading, error: fheError } = useZamaInstance();
  
  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleNumberChange = (number: number) => {
    setSelectedNumber(number);
  };

  const handlePurchaseClick = () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (fheLoading) {
      toast.error('FHE encryption service is still loading. Please wait...');
      return;
    }
    
    if (fheError) {
      toast.error(`FHE encryption error: ${fheError}`);
      return;
    }
    
    if (!instance) {
      toast.error('FHE encryption service not available. Please refresh the page.');
      return;
    }
    
    if (isRoundDrawn) {
      toast.error('Current round has already been drawn. Please wait for the next round.');
      return;
    }
    
    setShowBuyModal(true);
  };

  const handlePurchaseConfirm = async () => {
    try {
      await purchaseTicket(selectedNumber);
      toast.success('Ticket purchased successfully!');
      setShowBuyModal(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDrawLottery = async () => {
    try {
      await drawLottery();
      toast.success('Lottery drawn successfully!');
    } catch (error) {
      console.error('Draw failed:', error);
      toast.error(`Draw failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatTicketPrice = (price: bigint | undefined) => {
    if (!price) return '0.005 ETH';
    return `${Number(price) / 1e18} ETH`;
  };

  const formatPrizePool = (pool: bigint | undefined) => {
    if (!pool) return '0 ETH';
    return `${Number(pool) / 1e18} ETH`;
  };

  return (
    <div className="space-y-6">
      {/* Current Round Info */}
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Current Round Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-casino-gold">
                {roundLoading ? '...' : currentRound?.toString() || '1'}
              </div>
              <div className="text-sm text-muted-foreground">Round</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {poolLoading ? '...' : formatPrizePool(prizePool)}
              </div>
              <div className="text-sm text-muted-foreground">Prize Pool</div>
            </div>
          </div>
          
          {isRoundDrawn && winningNumber && (
            <div className="text-center p-4 bg-casino-gold/10 rounded-lg">
              <div className="text-lg font-semibold text-casino-gold">Winning Number</div>
              <div className="text-3xl font-bold text-casino-gold mt-2">{winningNumber}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Purchase */}
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Buy Lottery Ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Number Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-casino-gold">
              Select Your Lucky Number (1-49)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="49"
                value={selectedNumber}
                onChange={(e) => handleNumberChange(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-casino-gold/30 rounded-lg bg-background text-foreground"
                disabled={isRoundDrawn || purchaseLoading}
              />
              <div className="text-sm text-muted-foreground">
                Your number will be encrypted and kept private
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          <Button 
            variant="casino" 
            className="w-full"
            onClick={handlePurchaseClick}
            disabled={!address || purchaseLoading || fheLoading || isRoundDrawn}
          >
            {fheLoading ? (
              'Loading FHE...'
            ) : purchaseLoading ? (
              'Purchasing...'
            ) : isRoundDrawn ? (
              'Round Already Drawn'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Buy Ticket for {formatTicketPrice(ticketPrice)}
              </>
            )}
          </Button>

          {/* Your Tickets */}
          {address && (
            <div className="text-center text-sm text-muted-foreground">
              Your tickets in this round: {countLoading ? '...' : ticketCount?.toString() || '0'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Draw Lottery (Owner Only) */}
      {address && (
        <Card className="bg-gradient-luxury border-casino-gold/20">
          <CardHeader>
            <CardTitle className="text-casino-gold flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Draw Lottery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="casino" 
              className="w-full"
              onClick={handleDrawLottery}
              disabled={!address || drawLoading || isRoundDrawn}
            >
              {drawLoading ? (
                'Drawing...'
              ) : isRoundDrawn ? (
                'Round Already Drawn'
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Draw Lottery
                </>
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Only the contract owner can draw the lottery
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Confirmation Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-casino-gold">Confirm Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Your Lucky Number</div>
                <div className="text-3xl font-bold text-casino-gold mt-2">{selectedNumber}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  This number will be encrypted and kept private
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">Ticket Price</div>
                <div className="text-2xl font-bold text-casino-gold mt-2">
                  {formatTicketPrice(ticketPrice)}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowBuyModal(false)}
                  disabled={purchaseLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="casino" 
                  className="flex-1"
                  onClick={handlePurchaseConfirm}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? 'Purchasing...' : 'Confirm Purchase'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Status */}
      {hash && (
        <Card className="bg-gradient-luxury border-casino-gold/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Transaction Hash</div>
              <div className="font-mono text-xs break-all mt-1">{hash}</div>
              {isConfirmed && (
                <div className="text-green-500 text-sm mt-2">✅ Transaction Confirmed</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {purchaseError && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <div className="font-semibold">Purchase Error</div>
              <div className="text-sm mt-1">{purchaseError.message}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

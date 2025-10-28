import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, EyeOff, Plus } from "lucide-react";
import { useAccount } from 'wagmi';
import { useGetPlayerTickets, useGetTicketInfo, usePurchaseTicket, useGetTicketPrice, useNeedsDrawTrigger, useTriggerNextDraw } from '@/hooks/useLottery';
import { useDecryptNumbers, useZamaInstance } from '@/hooks/useZamaInstance';
import { NumberSelector } from './NumberSelector';
import { PurchaseConfirmation } from './PurchaseConfirmation';
import { FHEStatusDebug } from './FHEStatusDebug';
import { useState } from 'react';
import { toast } from 'sonner';

export const TicketSection = () => {
  const { address } = useAccount();
  const { playerTickets, isLoading: ticketsLoading } = useGetPlayerTickets(address || '0x0');
  const { ticketPrice, isLoading: priceLoading } = useGetTicketPrice();
  const { purchaseTicket, isLoading: purchaseLoading, isConfirmed, error: purchaseError, hash } = usePurchaseTicket();
  const { instance, isLoading: fheLoading, error: fheError } = useZamaInstance();
  const { needsDrawTrigger, timeUntilNextDraw, isLoading: drawStatusLoading } = useNeedsDrawTrigger();
  const { triggerNextDraw, isLoading: triggerLoading } = useTriggerNextDraw();
  
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const handleNumbersSelected = (numbers: number[]) => {
    setSelectedNumbers(numbers);
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
    
    // Check if we need to trigger a draw first
    if (needsDrawTrigger) {
      toast.error('No active draw available. Please trigger next draw first.');
      return;
    }
    
    setShowBuyModal(true);
  };

  const handleTriggerDraw = async () => {
    try {
      await triggerNextDraw();
      toast.success('Next draw triggered successfully! You can now purchase tickets.');
    } catch (error) {
      console.error('Failed to trigger draw:', error);
      toast.error('Failed to trigger draw. Please try again.');
    }
  };

  const handlePurchaseConfirm = async () => {
    try {
      await purchaseTicket(selectedNumbers);
      setShowConfirmation(false);
      setShowBuyModal(false);
      setSelectedNumbers([]);
      toast.success('Ticket purchased successfully!');
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Failed to purchase ticket. Please try again.');
    }
  };

  const handleCloseModals = () => {
    setShowBuyModal(false);
    setShowConfirmation(false);
    setSelectedNumbers([]);
  };

  const formatTicketPrice = (price: bigint | undefined) => {
    if (!price) return '0.005 ETH';
    return `${Number(price) / 1e18} ETH`;
  };

  return (
    <section className="py-20 bg-casino-charcoal">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 text-foreground">
            Your Encrypted Tickets
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your lottery numbers are safely encrypted and will only be revealed after the draw is complete
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {ticketsLoading ? (
            <div className="col-span-full text-center text-muted-foreground">
              Loading your tickets...
            </div>
          ) : playerTickets && playerTickets.length > 0 ? (
            playerTickets.map((ticketId) => (
              <TicketCard key={ticketId.toString()} ticketId={ticketId} />
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              No tickets found. Connect your wallet and purchase your first ticket!
            </div>
          )}
          
          {/* Add New Ticket Card */}
          <Card className="bg-gradient-luxury border-casino-gold/20 hover:border-casino-gold/40 transition-all duration-300 hover:shadow-gold border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="text-6xl text-casino-gold/30 mb-4">+</div>
              
              {needsDrawTrigger ? (
                <Button 
                  variant="casino" 
                  className="w-full"
                  onClick={handleTriggerDraw}
                  disabled={!address || triggerLoading || fheLoading}
                >
                  {triggerLoading ? (
                    'Triggering Draw...'
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Trigger Next Draw
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  variant="casino" 
                  className="w-full"
                  onClick={handlePurchaseClick}
                  disabled={!address || purchaseLoading || fheLoading || drawStatusLoading}
                >
                  {fheLoading ? (
                    'Loading FHE...'
                  ) : purchaseLoading ? (
                    'Purchasing...'
                  ) : drawStatusLoading ? (
                    'Checking Draw Status...'
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Buy New Ticket
                    </>
                  )}
                </Button>
              )}
              
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {needsDrawTrigger ? (
                  'No active draw - trigger first'
                ) : (
                  `${formatTicketPrice(ticketPrice)} per ticket`
                )}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          {/* Draw Status Display */}
          <div className="bg-card rounded-xl p-6 border border-casino-gold/20 max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-casino-gold mb-4">Current Draw Status</h3>
            {drawStatusLoading ? (
              <p className="text-muted-foreground">Loading draw status...</p>
            ) : needsDrawTrigger ? (
              <div className="text-center">
                <p className="text-casino-red font-semibold mb-2">⚠️ No Active Draw</p>
                <p className="text-sm text-muted-foreground">
                  The current draw period has ended. Please trigger the next draw to start purchasing tickets.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-green-500 font-semibold mb-2">✅ Active Draw Available</p>
                <p className="text-sm text-muted-foreground">
                  You can purchase tickets for the current draw.
                </p>
                {timeUntilNextDraw && timeUntilNextDraw > 0n && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Next draw in: {Math.floor(Number(timeUntilNextDraw) / 86400)} days
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-xl p-8 border border-casino-gold/20 max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-casino-gold mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="w-8 h-8 bg-gradient-casino rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">1</div>
                <p className="text-muted-foreground">Choose your numbers and purchase ticket</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-gradient-casino rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">2</div>
                <p className="text-muted-foreground">Numbers are encrypted and stored securely</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-gradient-casino rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">3</div>
                <p className="text-muted-foreground">After draw, numbers are revealed and winners paid</p>
              </div>
            </div>
          </div>
          
          {/* FHE Debug Component */}
          <FHEStatusDebug />
        </div>
      </div>

      {/* Number Selection Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-luxury rounded-xl border border-casino-gold/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-casino-gold">Choose Your Lucky Numbers</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCloseModals}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
              
              <NumberSelector
                onNumbersSelected={handleNumbersSelected}
                onPurchase={async (numbers) => {
                  setSelectedNumbers(numbers);
                  setShowBuyModal(false);
                  setShowConfirmation(true);
                }}
                isLoading={purchaseLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmation
        isOpen={showConfirmation}
        onClose={handleCloseModals}
        onConfirm={handlePurchaseConfirm}
        selectedNumbers={selectedNumbers}
        ticketPrice={formatTicketPrice(ticketPrice)}
        isLoading={purchaseLoading}
        error={purchaseError?.message}
        hash={hash}
        isConfirmed={isConfirmed}
      />
    </section>
  );
};

const TicketCard = ({ ticketId }: { ticketId: bigint }) => {
  const { ticketInfo, isLoading } = useGetTicketInfo(ticketId);
  const { decryptNumbers, isDecrypting } = useDecryptNumbers();
  const [decryptedNumbers, setDecryptedNumbers] = useState<number[] | null>(null);
  const [showDecrypted, setShowDecrypted] = useState(false);

  const handleDecrypt = async () => {
    try {
      // In a real implementation, you would get the encrypted numbers from the contract
      // For now, we'll use a mock implementation
      const mockEncryptedNumbers = [
        '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
        '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
        '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
        '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
        '0x' + Math.random().toString(16).substring(2).padStart(64, '0'),
        '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
      ];
      
      const decrypted = await decryptNumbers(mockEncryptedNumbers);
      setDecryptedNumbers(decrypted);
      setShowDecrypted(true);
    } catch (error) {
      console.error('Failed to decrypt numbers:', error);
      toast.error('Failed to decrypt numbers');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-casino-gold/20 rounded mb-4"></div>
            <div className="h-20 bg-casino-black/20 rounded mb-4"></div>
            <div className="h-8 bg-casino-gold/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ticketInfo) return null;

  const [owner, purchaseTime, isActive, isWinner] = ticketInfo;

  return (
    <Card className="bg-gradient-luxury border-casino-gold/20 hover:border-casino-gold/40 transition-all duration-300 hover:shadow-gold">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-casino-gold" />
            <span className="font-semibold text-casino-gold">Ticket #{ticketId.toString()}</span>
          </div>
          <span className="text-sm text-muted-foreground">0.005 ETH</span>
        </div>
        
        <div className="bg-casino-black/50 rounded-lg p-4 mb-4 border border-casino-red/20">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-casino-red" />
            <span className="text-sm font-medium text-casino-red">ENCRYPTED</span>
          </div>
          {showDecrypted && decryptedNumbers ? (
            <div className="space-y-2">
              <div className="text-sm text-casino-gold font-medium">Decrypted Numbers:</div>
              <div className="flex flex-wrap gap-2">
                {decryptedNumbers.map((number, index) => (
                  <span key={index} className="bg-casino-gold text-casino-black px-2 py-1 rounded text-sm font-bold">
                    {number}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="font-mono text-sm text-muted-foreground break-all">
              {Array.from({ length: 6 }, (_, i) => 
                '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
              ).join('\n')}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ticket" 
            size="sm" 
            className="flex-1"
            onClick={handleDecrypt}
            disabled={isDecrypting}
          >
            {isDecrypting ? (
              'Decrypting...'
            ) : showDecrypted ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Decrypted
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Decrypt
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDecrypted(!showDecrypted)}
            disabled={!decryptedNumbers}
          >
            {showDecrypted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground">
          Status: {isActive ? 'Active' : 'Inactive'} | 
          Purchased: {new Date(Number(purchaseTime) * 1000).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};
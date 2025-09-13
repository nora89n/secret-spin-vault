import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, EyeOff, Plus } from "lucide-react";
import { useAccount } from 'wagmi';
import { useGetPlayerTickets, useGetTicketInfo, usePurchaseTicket, useGetTicketPrice } from '@/hooks/useLottery';
import { useState } from 'react';

export const TicketSection = () => {
  const { address } = useAccount();
  const { playerTickets, isLoading: ticketsLoading } = useGetPlayerTickets(address || '0x0');
  const { ticketPrice, isLoading: priceLoading } = useGetTicketPrice();
  const { purchaseTicket, isLoading: purchaseLoading } = usePurchaseTicket();
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleBuyTicket = async () => {
    if (!address) return;
    
    try {
      // For now, we'll use placeholder encrypted numbers
      // In a real implementation, these would be generated client-side using FHE
      const encryptedNumbers = [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xabcdef1234567890abcdef1234567890abcdef12',
        '0x567890abcdef1234567890abcdef1234567890ab',
        '0x90abcdef1234567890abcdef1234567890abcdef',
        '0xcdef1234567890abcdef1234567890abcdef1234',
        '0x34567890abcdef1234567890abcdef1234567890'
      ];
      
      await purchaseTicket({
        args: [encryptedNumbers, '0x'], // Placeholder proof
      });
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
    }
  };

  const formatTicketPrice = (price: bigint | undefined) => {
    if (!price) return '0.1 ETH';
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
              <Button 
                variant="casino" 
                className="w-full"
                onClick={handleBuyTicket}
                disabled={!address || purchaseLoading}
              >
                {purchaseLoading ? (
                  'Purchasing...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Buy New Ticket
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {formatTicketPrice(ticketPrice)} per ticket
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <div className="bg-card rounded-xl p-8 border border-casino-gold/20 max-w-2xl mx-auto">
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
        </div>
      </div>
    </section>
  );
};

const TicketCard = ({ ticketId }: { ticketId: bigint }) => {
  const { ticketInfo, isLoading } = useGetTicketInfo(ticketId);

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
          <span className="text-sm text-muted-foreground">0.1 ETH</span>
        </div>
        
        <div className="bg-casino-black/50 rounded-lg p-4 mb-4 border border-casino-red/20">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-casino-red" />
            <span className="text-sm font-medium text-casino-red">ENCRYPTED</span>
          </div>
          <div className="font-mono text-sm text-muted-foreground break-all">
            a7f8e9d2c4b6a1f3e8d9c2b5a6f7e2d1c9b8a7f6e5d4c3b2a1f9e8d7c6b5a4f3
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ticket" size="sm" className="flex-1">
            <EyeOff className="h-4 w-4 mr-2" />
            {isWinner ? 'Winner!' : 'Hidden'}
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
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
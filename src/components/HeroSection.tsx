import { Button } from "@/components/ui/button";
import { Wallet, Shield, Timer } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import casinoHero from "@/assets/casino-hero.jpg";

export const HeroSection = () => {
  const { isConnected } = useAccount();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${casinoHero})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-casino-black/80 via-casino-black/60 to-casino-black/90" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="animate-float">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-gold bg-clip-text text-transparent">
            Play Big,
          </h1>
          <h2 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-casino bg-clip-text text-transparent">
            Keep It Secret
          </h2>
        </div>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Experience the ultimate private lottery system where your numbers remain encrypted until the draw. 
          Anonymous. Secure. Thrilling.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button 
                          onClick={openConnectModal} 
                          variant="wallet" 
                          size="lg" 
                          className="text-lg px-8 py-4 h-auto"
                        >
                          <Wallet className="mr-2 h-6 w-6" />
                          Connect Wallet
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button 
                          onClick={openChainModal} 
                          variant="destructive" 
                          size="lg" 
                          className="text-lg px-8 py-4 h-auto"
                        >
                          Wrong network
                        </Button>
                      );
                    }

                    return (
                      <div className="flex gap-4">
                        <Button
                          onClick={openChainModal}
                          variant="outline"
                          size="lg"
                          className="text-lg px-8 py-4 h-auto"
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                overflow: 'hidden',
                                marginRight: 4,
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  style={{ width: 12, height: 12 }}
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </Button>

                        <Button
                          onClick={openAccountModal}
                          variant="wallet"
                          size="lg"
                          className="text-lg px-8 py-4 h-auto"
                        >
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ''}
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
          
          {isConnected && (
            <Button variant="casino" size="lg" className="text-lg px-8 py-4 h-auto">
              <Shield className="mr-2 h-6 w-6" />
              Buy Encrypted Ticket
            </Button>
          )}
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center p-6 bg-gradient-luxury rounded-xl border border-casino-gold/20 hover:border-casino-gold/40 transition-all duration-300 hover:shadow-gold">
            <Shield className="h-12 w-12 text-casino-gold mx-auto mb-4" />
            <h3 className="text-xl font-bold text-casino-gold mb-2">Encrypted Numbers</h3>
            <p className="text-muted-foreground">Your lottery numbers are encrypted and hidden until the draw</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-luxury rounded-xl border border-casino-gold/20 hover:border-casino-gold/40 transition-all duration-300 hover:shadow-gold">
            <Timer className="h-12 w-12 text-casino-gold mx-auto mb-4" />
            <h3 className="text-xl font-bold text-casino-gold mb-2">Fair Draw</h3>
            <p className="text-muted-foreground">Transparent and verifiable random number generation</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-luxury rounded-xl border border-casino-gold/20 hover:border-casino-gold/40 transition-all duration-300 hover:shadow-gold">
            <Wallet className="h-12 w-12 text-casino-gold mx-auto mb-4" />
            <h3 className="text-xl font-bold text-casino-gold mb-2">Instant Payout</h3>
            <p className="text-muted-foreground">Winners receive automatic payouts to their wallets</p>
          </div>
        </div>
      </div>
    </section>
  );
};
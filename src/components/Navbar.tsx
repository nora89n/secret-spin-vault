import React from 'react';
import { Logo } from './Logo';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-casino-black/95 backdrop-blur-md border-b border-casino-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size="md" showText={true} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#home"
                className="text-casino-gold hover:text-casino-red px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-casino-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                How It Works
              </a>
              <a
                href="#prizes"
                className="text-muted-foreground hover:text-casino-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Prizes
              </a>
              <a
                href="#tickets"
                className="text-muted-foreground hover:text-casino-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                My Tickets
              </a>
            </div>
          </div>

          {/* Desktop Wallet Connection */}
          <div className="hidden md:block">
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
                            size="sm"
                          >
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button 
                            onClick={openChainModal} 
                            variant="destructive" 
                            size="sm"
                          >
                            Wrong network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={openChainModal}
                            variant="outline"
                            size="sm"
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
                            size="sm"
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
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-casino-gold hover:text-casino-red"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-casino-black/98 backdrop-blur-md border-t border-casino-gold/20">
            <a
              href="#home"
              className="text-casino-gold hover:text-casino-red block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-casino-gold block px-3 py-2 rounded-md text-base font-medium"
            >
              How It Works
            </a>
            <a
              href="#prizes"
              className="text-muted-foreground hover:text-casino-gold block px-3 py-2 rounded-md text-base font-medium"
            >
              Prizes
            </a>
            <a
              href="#tickets"
              className="text-muted-foreground hover:text-casino-gold block px-3 py-2 rounded-md text-base font-medium"
            >
              My Tickets
            </a>
            <div className="px-3 py-2">
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
                              size="sm"
                              className="w-full"
                            >
                              Connect Wallet
                            </Button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <Button 
                              onClick={openChainModal} 
                              variant="destructive" 
                              size="sm"
                              className="w-full"
                            >
                              Wrong network
                            </Button>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            <Button
                              onClick={openChainModal}
                              variant="outline"
                              size="sm"
                              className="w-full"
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
                              size="sm"
                              className="w-full"
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
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

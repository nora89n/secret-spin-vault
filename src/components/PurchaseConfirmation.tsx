import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionStatus } from './TransactionStatus';

interface PurchaseConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  selectedNumbers: number[];
  ticketPrice: string;
  isLoading?: boolean;
  error?: string;
  hash?: `0x${string}`;
  isConfirmed?: boolean;
}

export const PurchaseConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  selectedNumbers,
  ticketPrice,
  isLoading = false,
  error,
  hash,
  isConfirmed
}: PurchaseConfirmationProps) => {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');

  const handleConfirm = async () => {
    setStep('processing');
    try {
      await onConfirm();
      setStep('success');
      // Auto close after success
      setTimeout(() => {
        onClose();
        setStep('confirm');
      }, 2000);
    } catch (error) {
      setStep('error');
      console.error('Purchase failed:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setStep('confirm');
    }
  };

  const formatNumbers = (numbers: number[]) => {
    return numbers.sort((a, b) => a - b).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-luxury border-casino-gold/20">
        <DialogHeader>
          <DialogTitle className="text-casino-gold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Confirm Ticket Purchase
          </DialogTitle>
          <DialogDescription>
            Review your ticket details before confirming the purchase
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <>
            <div className="space-y-4">
              {/* Selected Numbers */}
              <Card className="bg-casino-black/50 border-casino-gold/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-4 w-4 text-casino-red" />
                    <span className="text-sm font-medium text-casino-red">YOUR LUCKY NUMBERS</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNumbers
                      .sort((a, b) => a - b)
                      .map((number) => (
                        <Badge 
                          key={number} 
                          variant="secondary" 
                          className="bg-casino-gold text-casino-black text-lg px-3 py-1"
                        >
                          {number}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Encryption Preview */}
              <Card className="bg-casino-black/50 border-casino-gold/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-casino-gold" />
                    <span className="text-sm font-medium text-casino-gold">ENCRYPTED FORMAT</span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground break-all">
                    {selectedNumbers.map((_, index) => 
                      `0x${Math.random().toString(16).substring(2, 10)}...`
                    ).join(', ')}
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ticket Price:</span>
                  <span className="font-semibold text-casino-gold">{ticketPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Numbers:</span>
                  <span className="font-semibold">{formatNumbers(selectedNumbers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Encryption:</span>
                  <span className="font-semibold text-casino-red">FHE Protected</span>
                </div>
              </div>

              <Separator className="bg-casino-gold/20" />

              {/* Security Notice */}
              <Alert className="border-casino-gold/20 bg-casino-gold/5">
                <Shield className="h-4 w-4 text-casino-gold" />
                <AlertDescription className="text-sm">
                  Your numbers will be encrypted using FHE technology and remain private until the draw is complete.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
                className="border-casino-gold text-casino-gold hover:bg-casino-gold hover:text-casino-black"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-gradient-casino hover:opacity-90 text-white font-bold"
              >
                Confirm Purchase
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="space-y-4">
            <TransactionStatus
              hash={hash}
              isConfirmed={isConfirmed}
              isLoading={isLoading}
              error={error ? new Error(error) : null}
              onClose={() => {
                if (isConfirmed) {
                  onClose();
                  setStep('confirm');
                }
              }}
            />
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-500 mb-2">Purchase Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your encrypted ticket has been purchased and stored securely.
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 text-center py-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-500 mb-2">Purchase Failed</h3>
              <p className="text-sm text-muted-foreground">
                {error || 'An error occurred while processing your purchase. Please try again.'}
              </p>
            </div>
            <Button 
              onClick={() => setStep('confirm')}
              className="bg-gradient-casino hover:opacity-90 text-white font-bold"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

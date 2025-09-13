import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  Shield,
  Lock
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransactionStatusProps {
  hash?: `0x${string}`;
  isConfirmed?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  onClose?: () => void;
}

type TransactionStep = 'pending' | 'confirming' | 'confirmed' | 'error';

export const TransactionStatus = ({
  hash,
  isConfirmed,
  isLoading,
  error,
  onClose
}: TransactionStatusProps) => {
  const [step, setStep] = useState<TransactionStep>('pending');

  useEffect(() => {
    if (error) {
      setStep('error');
    } else if (isConfirmed) {
      setStep('confirmed');
    } else if (isLoading) {
      setStep('confirming');
    } else {
      setStep('pending');
    }
  }, [isLoading, isConfirmed, error]);

  const getStepIcon = () => {
    switch (step) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirming':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'pending':
        return 'Transaction Pending';
      case 'confirming':
        return 'Confirming Transaction';
      case 'confirmed':
        return 'Transaction Confirmed';
      case 'error':
        return 'Transaction Failed';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'pending':
        return 'Your transaction is being processed by the network...';
      case 'confirming':
        return 'Waiting for blockchain confirmation...';
      case 'confirmed':
        return 'Your ticket has been successfully purchased and encrypted!';
      case 'error':
        return error?.message || 'An error occurred while processing your transaction.';
    }
  };

  const getStepBadgeVariant = () => {
    switch (step) {
      case 'pending':
        return 'secondary';
      case 'confirming':
        return 'default';
      case 'confirmed':
        return 'default';
      case 'error':
        return 'destructive';
    }
  };

  const getStepBadgeColor = () => {
    switch (step) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'confirming':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'confirmed':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
    }
  };

  const openExplorer = () => {
    if (hash) {
      const explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;
      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <Card className="bg-gradient-luxury border-casino-gold/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStepIcon()}
              <div>
                <h3 className="font-semibold text-foreground">{getStepText()}</h3>
                <p className="text-sm text-muted-foreground">{getStepDescription()}</p>
              </div>
            </div>
            <Badge 
              variant={getStepBadgeVariant()}
              className={getStepBadgeColor()}
            >
              {step.toUpperCase()}
            </Badge>
          </div>

          {/* Transaction Hash */}
          {hash && (
            <div className="bg-casino-black/50 rounded-lg p-3 border border-casino-gold/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                  <p className="font-mono text-sm text-foreground break-all">
                    {hash.substring(0, 20)}...{hash.substring(hash.length - 8)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openExplorer}
                  className="text-casino-gold hover:text-casino-gold/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Security Notice */}
          {step === 'confirmed' && (
            <Alert className="border-green-500/20 bg-green-500/5">
              <Shield className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                <strong>Your numbers are now encrypted!</strong> They will remain private until the draw is complete.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Details */}
          {step === 'error' && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Transaction failed:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Steps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                step === 'pending' || step === 'confirming' || step === 'confirmed' 
                  ? 'bg-casino-gold' 
                  : 'bg-muted'
              }`} />
              <span className={step === 'pending' || step === 'confirming' || step === 'confirmed' ? 'text-foreground' : 'text-muted-foreground'}>
                Submit transaction
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                step === 'confirming' || step === 'confirmed' 
                  ? 'bg-casino-gold' 
                  : 'bg-muted'
              }`} />
              <span className={step === 'confirming' || step === 'confirmed' ? 'text-foreground' : 'text-muted-foreground'}>
                Encrypt numbers
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                step === 'confirmed' 
                  ? 'bg-casino-gold' 
                  : 'bg-muted'
              }`} />
              <span className={step === 'confirmed' ? 'text-foreground' : 'text-muted-foreground'}>
                Store ticket
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {step === 'confirmed' && onClose && (
              <Button 
                onClick={onClose}
                className="flex-1 bg-gradient-casino hover:opacity-90 text-white font-bold"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}
            {step === 'error' && onClose && (
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1 border-casino-red text-casino-red hover:bg-casino-red hover:text-white"
              >
                Try Again
              </Button>
            )}
            {hash && (
              <Button
                variant="outline"
                onClick={openExplorer}
                className="border-casino-gold text-casino-gold hover:bg-casino-gold hover:text-casino-black"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

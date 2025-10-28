import { useZamaInstance } from '@/hooks/useZamaInstance';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Shield } from "lucide-react";
import { toast } from 'sonner';
import { useTriggerNextDraw } from '@/hooks/useLottery';

export const FHEStatusDebug = () => {
  const { instance, isLoading, error } = useZamaInstance();
  const { address, isConnected } = useAccount();
  const { triggerNextDraw, isLoading: isTriggering } = useTriggerNextDraw();

  const contractAddress = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x8B668f84D5cdfEfffEF16F4eD810B83A8545414E';

  return (
    <Card className="bg-gradient-luxury border-casino-gold/20">
      <CardHeader>
        <CardTitle className="text-casino-gold flex items-center gap-2">
          FHE Status Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">
            Wallet: {isConnected ? 'Connected' : 'Not Connected'}
          </span>
          {address && (
            <span className="text-xs text-muted-foreground">
              ({address.slice(0, 6)}...{address.slice(-4)})
            </span>
          )}
        </div>

        {/* FHE Instance Status */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
          ) : instance ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">
            FHE Instance: {isLoading ? 'Loading...' : instance ? 'Ready' : 'Failed'}
          </span>
        </div>

        {/* Contract Address */}
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">FHE Error</span>
            </div>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Retry Button */}
        {error && (
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="w-full border-casino-gold text-casino-gold hover:bg-casino-gold hover:text-casino-black"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        )}

        {/* Test Encryption Button */}
        {instance && isConnected && (
          <Button
            onClick={async () => {
              try {
                console.log('Testing encryption...');
                const input = instance.createEncryptedInput(contractAddress, address!);
                input.add32(1);
                input.add32(2);
                input.add32(3);
                input.add32(4);
                input.add32(5);
                input.add32(6);
                const result = await input.encrypt();
                console.log('Test encryption successful:', result);
                alert('Test encryption successful! Check console for details.');
              } catch (error) {
                console.error('Test encryption failed:', error);
                alert(`Test encryption failed: ${error}`);
              }
            }}
            variant="casino"
            size="sm"
            className="w-full"
          >
            Test Encryption
          </Button>
        )}

        {/* Trigger Next Draw Button */}
        {isConnected && (
          <Button
            onClick={async () => {
              try {
                await triggerNextDraw();
                toast.success('Next draw triggered successfully!');
              } catch (e) {
                console.error('Trigger draw failed:', e);
                toast.error(`Failed to trigger draw: ${e instanceof Error ? e.message : 'Unknown error'}`);
              }
            }}
            variant="secondary"
            size="sm"
            className="mt-2 w-full bg-casino-gold text-casino-black hover:bg-casino-gold/90"
            disabled={isTriggering}
          >
            {isTriggering ? 'Triggering...' : 'Trigger Next Draw'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

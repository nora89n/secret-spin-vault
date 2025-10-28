import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Trash2, Check, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateNumbers } from '@/lib/fhe';

interface NumberSelectorProps {
  onNumbersSelected: (numbers: number[]) => void;
  onPurchase: (numbers: number[]) => Promise<void>;
  isLoading?: boolean;
  maxNumbers?: number;
  numberRange?: number;
}

export const NumberSelector = ({ 
  onNumbersSelected, 
  onPurchase, 
  isLoading = false,
  maxNumbers = 6,
  numberRange = 49 
}: NumberSelectorProps) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string>('');

  // Generate array of available numbers
  const availableNumbers = Array.from({ length: numberRange }, (_, i) => i + 1);

  const handleNumberClick = (number: number) => {
    setError('');
    
    if (selectedNumbers.includes(number)) {
      // Remove number if already selected
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else if (selectedNumbers.length < maxNumbers) {
      // Add number if not at max capacity
      setSelectedNumbers(prev => [...prev, number]);
    }
  };

  const handleQuickPick = () => {
    setError('');
    const shuffled = [...availableNumbers].sort(() => Math.random() - 0.5);
    const quickPickNumbers = shuffled.slice(0, maxNumbers).sort((a, b) => a - b);
    setSelectedNumbers(quickPickNumbers);
  };

  const handleClear = () => {
    setError('');
    setSelectedNumbers([]);
  };

  const handlePurchase = async () => {
    // Validate numbers before purchase
    const validation = validateNumbers(selectedNumbers, 1, numberRange, maxNumbers);
    
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      await onPurchase(selectedNumbers);
    } catch (error) {
      setError('Failed to purchase ticket. Please try again.');
      console.error('Purchase error:', error);
    }
  };

  // Notify parent component when numbers change
  useEffect(() => {
    onNumbersSelected(selectedNumbers);
  }, [selectedNumbers, onNumbersSelected]);

  const isNumberSelected = (number: number) => selectedNumbers.includes(number);
  const isComplete = selectedNumbers.length === maxNumbers;

  return (
    <div className="space-y-6">
      {/* Selected Numbers Display */}
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-casino-gold flex items-center justify-between">
            Your Lucky Numbers
            <Badge variant="outline" className="border-casino-gold text-casino-gold">
              {selectedNumbers.length}/{maxNumbers}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedNumbers.length > 0 ? (
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
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Select your lucky numbers below
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Number Grid */}
      <Card className="bg-gradient-luxury border-casino-gold/20">
        <CardHeader>
          <CardTitle className="text-foreground">Choose Your Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {availableNumbers.map((number) => (
              <Button
                key={number}
                variant={isNumberSelected(number) ? "default" : "outline"}
                size="sm"
                className={`
                  w-12 h-12 text-lg font-bold transition-all duration-200
                  ${isNumberSelected(number) 
                    ? 'bg-casino-gold text-casino-black hover:bg-casino-gold/90' 
                    : 'border-casino-gold/30 text-casino-gold hover:border-casino-gold hover:bg-casino-gold/10'
                  }
                  ${selectedNumbers.length >= maxNumbers && !isNumberSelected(number) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                  }
                `}
                onClick={() => handleNumberClick(number)}
                disabled={selectedNumbers.length >= maxNumbers && !isNumberSelected(number)}
              >
                {number}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleQuickPick}
          className="flex-1 border-casino-gold text-casino-gold hover:bg-casino-gold hover:text-casino-black"
          disabled={isLoading}
        >
          <Shuffle className="h-4 w-4 mr-2" />
          Quick Pick
        </Button>
        
        <Button
          variant="outline"
          onClick={handleClear}
          className="flex-1 border-casino-red text-casino-red hover:bg-casino-red hover:text-white"
          disabled={isLoading || selectedNumbers.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
        
        <Button
          onClick={handlePurchase}
          disabled={!isComplete || isLoading}
          className="flex-1 bg-gradient-casino hover:opacity-90 text-white font-bold"
        >
          {isLoading ? (
            'Purchasing...'
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Purchase Ticket
            </>
          )}
        </Button>
      </div>

      {/* Purchase Info */}
      {isComplete && (
        <Card className="bg-casino-black/50 border-casino-gold/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-casino-gold font-semibold mb-2">Ready to Purchase!</p>
              <p className="text-sm text-muted-foreground">
                Your numbers: {selectedNumbers.sort((a, b) => a - b).join(', ')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ticket price: 0.005 ETH
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Alert className="border-casino-gold/20 bg-casino-gold/5">
        <Info className="h-4 w-4 text-casino-gold" />
        <AlertDescription className="text-sm">
          <strong>How to play:</strong> Select {maxNumbers} unique numbers between 1 and {numberRange}. 
          Your numbers will be encrypted and stored securely until the draw is complete.
        </AlertDescription>
      </Alert>
    </div>
  );
};

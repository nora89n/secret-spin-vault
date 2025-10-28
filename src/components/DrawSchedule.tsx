import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Settings, Play } from "lucide-react";
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

interface DrawScheduleProps {
  onScheduleDraw?: (drawTime: number, endTime: number) => void;
}

export const DrawSchedule = ({ onScheduleDraw }: DrawScheduleProps) => {
  const { address } = useAccount();
  const [drawTime, setDrawTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // 预设的开奖频率
  const presets = [
    {
      name: 'Daily Draw',
      description: 'Every day at 8:00 PM',
      getDrawTime: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0);
        return tomorrow;
      }
    },
    {
      name: 'Weekly Draw',
      description: 'Every Sunday at 8:00 PM',
      getDrawTime: () => {
        const nextSunday = new Date();
        const daysUntilSunday = (7 - nextSunday.getDay()) % 7;
        nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
        nextSunday.setHours(20, 0, 0, 0);
        return nextSunday;
      }
    },
    {
      name: 'Monthly Draw',
      description: 'First day of next month at 8:00 PM',
      getDrawTime: () => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(20, 0, 0, 0);
        return nextMonth;
      }
    }
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const drawDateTime = preset.getDrawTime();
    const endDateTime = new Date(drawDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2); // 2 hours after draw

    setDrawTime(drawDateTime.toISOString().slice(0, 16));
    setEndTime(endDateTime.toISOString().slice(0, 16));
  };

  const handleScheduleDraw = async () => {
    if (!drawTime || !endTime) {
      toast.error('Please select both draw time and end time');
      return;
    }

    const drawTimestamp = Math.floor(new Date(drawTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    if (drawTimestamp <= Math.floor(Date.now() / 1000)) {
      toast.error('Draw time must be in the future');
      return;
    }

    if (endTimestamp <= drawTimestamp) {
      toast.error('End time must be after draw time');
      return;
    }

    setIsScheduling(true);
    try {
      if (onScheduleDraw) {
        await onScheduleDraw(drawTimestamp, endTimestamp);
        toast.success('Draw scheduled successfully!');
        setDrawTime('');
        setEndTime('');
      }
    } catch (error) {
      console.error('Failed to schedule draw:', error);
      toast.error('Failed to schedule draw');
    } finally {
      setIsScheduling(false);
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card className="bg-gradient-luxury border-casino-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-casino-gold">
          <Settings className="h-5 w-5" />
          Draw Schedule Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Options */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-3 block">
            Quick Schedule Presets
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left hover:border-casino-gold/40"
                onClick={() => handlePresetClick(preset)}
              >
                <div className="font-medium text-casino-gold">{preset.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {preset.description}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Schedule */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">
            Custom Schedule
          </Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="draw-time" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Draw Time
              </Label>
              <Input
                id="draw-time"
                type="datetime-local"
                value={drawTime}
                onChange={(e) => setDrawTime(e.target.value)}
                className="bg-casino-black/50 border-casino-gold/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time
              </Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-casino-black/50 border-casino-gold/20"
              />
            </div>
          </div>
        </div>

        {/* Schedule Button */}
        <Button
          onClick={handleScheduleDraw}
          disabled={!drawTime || !endTime || isScheduling}
          className="w-full bg-gradient-casino hover:bg-gradient-casino/80"
        >
          {isScheduling ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Scheduling...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Schedule Draw
            </>
          )}
        </Button>

        {/* Current Time Display */}
        <div className="text-center text-sm text-muted-foreground">
          Current Time: {formatDateTime(Math.floor(Date.now() / 1000))}
        </div>
      </CardContent>
    </Card>
  );
};

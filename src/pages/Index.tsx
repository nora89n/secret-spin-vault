import { HeroSection } from "@/components/HeroSection";
import { PrizePool } from "@/components/PrizePool";
import { TicketSectionSimple } from "@/components/TicketSectionSimple";
import { UserTicketsDisplay } from "@/components/UserTicketsDisplay";
import { DrawResultsDisplay } from "@/components/DrawResultsDisplay";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-casino-black">
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <PrizePool />
        
        {/* Main Content Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Purchase Tickets */}
            <div className="space-y-6">
              <TicketSectionSimple />
            </div>
            
            {/* Right Column - User Data */}
            <div className="space-y-6">
              <UserTicketsDisplay />
              <DrawResultsDisplay />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

import { HeroSection } from "@/components/HeroSection";
import { PrizePool } from "@/components/PrizePool";
import { TicketSection } from "@/components/TicketSection";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-casino-black">
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <PrizePool />
        <TicketSection />
      </div>
    </div>
  );
};

export default Index;

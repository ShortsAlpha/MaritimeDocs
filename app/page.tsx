'use client';

import { Particles } from "@/components/ui/particles";
import EtherealBeamsHero from "@/components/ui/ethereal-beams-hero";
import { useState } from "react";

export default function Home() {
  const [liteMode, setLiteMode] = useState(false);

  return (
    <div className="relative w-full min-h-[100dvh] bg-black transition-colors duration-500">
      {/* Background Layer - Fixed to viewport */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-1000 ${liteMode ? 'opacity-0' : 'opacity-100'}`}>
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />
      </div>

      {/* Content Layer - Scrolls naturally */}
      <div className="relative z-10">
        <EtherealBeamsHero liteMode={liteMode} setLiteMode={setLiteMode} />
      </div>
    </div>
  );
}

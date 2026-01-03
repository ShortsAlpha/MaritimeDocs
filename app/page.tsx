'use client';

import { Particles } from "@/components/ui/particles";
import EtherealBeamsHero from "@/components/ui/ethereal-beams-hero";
import { useState } from "react";

export default function Home() {
  const [liteMode, setLiteMode] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black transition-colors duration-500">
      {/* Background Layer */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${liteMode ? 'opacity-0' : 'opacity-100'}`}>
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={80}
          color="#ffffff"
          refresh
        />
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 z-10 overflow-y-auto">
        <EtherealBeamsHero liteMode={liteMode} setLiteMode={setLiteMode} />
      </div>
    </div>
  );
}

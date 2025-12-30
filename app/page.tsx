'use client';

import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";
import EtherealBeamsHero from "@/components/ui/ethereal-beams-hero";
import { useState } from "react";

export default function Home() {
  const [liteMode, setLiteMode] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black transition-colors duration-500">
      {/* Background Layer */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${liteMode ? 'opacity-0' : 'opacity-100'}`}>
        <EtherealShadow
          color="rgba(128, 128, 128, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 z-10 overflow-y-auto">
        <EtherealBeamsHero liteMode={liteMode} setLiteMode={setLiteMode} />
      </div>
    </div>
  );
}

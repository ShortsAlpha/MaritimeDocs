"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export interface FeatureTab {
  id: number;
  title: string;
  content: React.ReactNode;
}

interface FeaturesDetailProps {
  tabs: FeatureTab[];
  title?: string;
  description?: string;
}

export default function FeaturesDetail({ tabs, title, description }: FeaturesDetailProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  // Cleaned up refs
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline()

    if (headingRef.current) {
      tl.fromTo(
        headingRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      )
    }

    if (textRef.current) {
      tl.fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      )
    }

    if (sliderRef.current) {
      tl.fromTo(
        sliderRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.2"
      )
    }

    return () => {
      tl.kill()
    }
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div ref={sectionRef} className="py-8">
      <div className="mx-auto">
        <div >
          <div className="container mx-auto mb-8">
            <h1 ref={headingRef} className="text-4xl text-left font-bold tracking-tight sm:text-5xl">{title || "Dashboard"}</h1>
            <p ref={textRef} className="mt-4 text-lg text-gray-600 text-left">{description || "Overview of your system."}</p>
          </div>

          <div className="flex justify-start gap-4 mb-6 px-4 overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => goToSlide(index)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${currentSlide === index
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"}`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          <div
            ref={sliderRef}
            className="relative h-[600px] w-full overflow-hidden px-4"
          >
            <div className="absolute inset-x-4 h-full">
              {tabs.map((tab, index) => {
                const isActive = index === currentSlide;

                // Only render active to keep it simple and high performance
                if (!isActive) return null;

                return (
                  <div
                    key={tab.id}
                    className="w-full h-full bg-card border rounded-2xl shadow-sm overflow-hidden p-6 animate-in fade-in duration-500"
                  >
                    {tab.content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

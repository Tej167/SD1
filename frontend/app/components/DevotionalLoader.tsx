"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface DevotionalLoaderProps {
  donorName: string;
  amount: string;
}

const STAGES = [
  { id: 1, label: "દાન સ્વીકાર અને ચુકવણી પૂર્ણ (Payment Confirmed)", duration: 2000 },
  { id: 2, label: "ગુજરાતી સ્વર ઘોષણા નિર્માણ (Synthesizing Gujarati Voiceover)", duration: 5000 },
  { id: 3, label: "એચડી ડિવાઈન એનિમેશન રેકોર્ડિંગ (Recording HD Devotional Video)", duration: 12000 },
  { id: 4, label: "વોટ્સએપ MP4 વીડિયો ફાઈનલાઈઝેશન (Finalizing WhatsApp MP4)", duration: 25000 },
];

export default function DevotionalLoader({ donorName, amount }: DevotionalLoaderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const stepTimers = [
      setTimeout(() => setCurrentStep(2), 2500),
      setTimeout(() => setCurrentStep(3), 6000),
      setTimeout(() => setCurrentStep(4), 16000),
    ];

    return () => {
      clearInterval(timer);
      stepTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="devotional-card rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto backdrop-blur-md border border-gold-400/40 shadow-2xl relative overflow-hidden">
      {/* Background glowing aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-400/15 via-transparent to-transparent pointer-events-none" />

      {/* Rotating Spiritual Mandala */}
      <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
        <svg
          className="w-full h-full text-gold-400/40 animate-spin-slow"
          viewBox="-100 -100 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <circle r="95" strokeDasharray="3 3" />
          <circle r="80" />
          <circle r="60" />
          <circle r="35" strokeDasharray="2 2" />
          <circle r="12" />
        </svg>

        {/* Center glowing lotus badge */}
        <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-amber-600 flex items-center justify-center shadow-lg shadow-gold-500/40 animate-pulse-glow">
          <Sparkles className="w-9 h-9 text-maroon-950" />
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-2xl sm:text-3xl font-bold font-gujarati gold-gradient-text drop-shadow mb-2">
        આપનો સમર્પણ વીડિયો તૈયાર થઈ રહ્યો છે...
      </h2>
      <p className="text-xs text-amber-200/80 font-cinzel tracking-wider uppercase mb-6">
        Generating Personalized Swaminarayan Announcement Video
      </p>

      {/* Donor badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-gold-400/30 text-xs text-amber-100 mb-8 font-gujarati">
        <span>દાતા: <strong>{donorName}</strong></span>
        <span className="text-gold-400 font-bold">•</span>
        <span>રકમ: <strong>₹{amount}</strong></span>
      </div>

      {/* Progress Steps Checklist */}
      <div className="space-y-3 text-left max-w-md mx-auto mb-6">
        {STAGES.map((stage) => {
          const isDone = currentStep > stage.id;
          const isCurrent = currentStep === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isDone
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                  : isCurrent
                  ? "bg-gold-500/10 border-gold-400 text-gold-200 shadow-md shadow-gold-500/10"
                  : "bg-black/20 border-white/5 text-amber-200/40"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-gold-400 animate-spin flex-none" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/20 flex-none" />
              )}
              <span className="text-xs sm:text-sm font-medium font-gujarati">{stage.label}</span>
            </div>
          );
        })}
      </div>

      {/* Elapsed Counter */}
      <div className="text-xs text-amber-300/70 font-mono">
        સમય: {seconds} સેકન્ડ (લગભગ ~15-20 સેકન્ડમાં તૈયાર થઈ જશે)
      </div>
    </div>
  );
}

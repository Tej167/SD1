"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, RotateCcw, HeartHandshake, MessageCircle } from "lucide-react";

interface VideoResultProps {
  videoUrl: string;
  donorName: string;
  amount: string;
  purpose: string;
  whatsapp: string;
  onReset: () => void;
}

export default function VideoResult({
  videoUrl,
  donorName,
  amount,
  purpose,
  whatsapp,
  onReset,
}: VideoResultProps) {
  useEffect(() => {
    // Fire festive devotional golden/saffron confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FF9933", "#FFF8E7", "#e07a1c"],
      });
    } catch (e) {
      // Ignore if confetti blocked
    }
  }, []);

  // Format WhatsApp number for display
  const displayWhatsApp = whatsapp
    ? whatsapp.startsWith("91")
      ? `+${whatsapp}`
      : `+91${whatsapp}`
    : "";

  return (
    <div className="devotional-card rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto backdrop-blur-md border border-gold-400/40 shadow-2xl animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>વીડિયો સફળતાપૂર્વક તૈયાર થયો (Video Generated)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-gujarati gold-gradient-text drop-shadow">
          હાર્દિક આભાર તથા ભગવત્ સ્મરણ
        </h2>
        <p className="text-xs text-amber-200/80 font-cinzel mt-1">
          May Bhagwan Swaminarayan Bless {donorName} & Family
        </p>
      </div>

      {/* Embedded HTML5 Video Player — Download disabled */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-gold-400 shadow-2xl bg-black mb-6">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-contain"
        >
          તમારું બ્રાઉઝર વિડીયો ટેગ સપોર્ટ કરતું નથી.
        </video>
      </div>

      {/* Donation summary card */}
      <div className="bg-black/40 rounded-xl p-4 border border-gold-400/20 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div>
          <span className="text-amber-200/60 block">દાતાશ્રી</span>
          <span className="font-bold text-amber-100 font-gujarati">{donorName}</span>
        </div>
        <div>
          <span className="text-amber-200/60 block">રકમ</span>
          <span className="font-bold text-gold-400 text-sm">₹{amount}</span>
        </div>
        <div>
          <span className="text-amber-200/60 block">સેવા હેતુ</span>
          <span className="font-bold text-amber-100 font-gujarati truncate block">{purpose}</span>
        </div>
        <div>
          <span className="text-amber-200/60 block">વોટ્સએપ ડિલિવરી</span>
          <span className="font-bold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sent</span>
          </span>
        </div>
      </div>

      {/* WhatsApp Confirmation Card — replaces download button */}
      <div className="mb-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300 font-bold text-sm">WhatsApp Delivery</span>
        </div>
        <p className="text-sm text-emerald-200 font-gujarati">
          વીડિયો તમારા WhatsApp નંબર ({displayWhatsApp || "મોબાઇલ"}) પર મોકલી દેવામાં આવ્યો છે
        </p>
        <p className="text-[11px] text-emerald-300/60 mt-1">
          Video has been sent to your WhatsApp number
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {/* Make Another Donation */}
        <button
          onClick={onReset}
          className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl font-bold text-sm text-maroon-950 bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 hover:from-gold-200 hover:to-amber-400 shadow-lg shadow-gold-500/30 transition-all flex items-center justify-center gap-2"
        >
          <HeartHandshake className="w-4 h-4" />
          <span className="font-gujarati">બીજું દાન કરો (Make Another Donation)</span>
        </button>

        {/* Reset pill */}
        <button
          onClick={onReset}
          className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-black/40 hover:bg-gold-500/10 border border-gold-400/40 text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gold-400" />
          <span className="font-gujarati">ફરીથી શરૂ કરો</span>
        </button>
      </div>
    </div>
  );
}

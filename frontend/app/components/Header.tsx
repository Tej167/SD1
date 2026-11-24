import React from "react";

export default function Header() {
  return (
    <header className="relative w-full text-center py-6 px-4 border-b border-gold-400/30 bg-gradient-to-b from-[#420000] via-[#330000] to-[#240000] shadow-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-gold-400/10 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-1.5 relative z-10">
        {/* Tilak / Chandlo & Spiritual Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-[2px] bg-gradient-to-r from-transparent to-gold-400" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-amber-600 flex items-center justify-center shadow-lg shadow-gold-500/40">
            <div className="w-2 h-2 rounded-full bg-maroon-700" />
          </div>
          <div className="w-8 h-[2px] bg-gradient-to-l from-transparent to-gold-400" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide font-gujarati gold-gradient-text drop-shadow-[0_2px_10px_rgba(255,215,0,0.4)]">
          || જય સ્વામિનારાયણ ||
        </h1>
        <p className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-gold-300 font-cinzel opacity-90">
          Shree Swaminarayan Mandir Seva Portal
        </p>
        <p className="text-xs text-amber-200/80 max-w-lg mt-1 font-gujarati">
          તમારું પવિત્ર દાન મંદિર સેવા, અન્નક્ષેત્ર અને સમાજ ઉત્કર્ષમાં ઉપયોગી બનશે
        </p>
      </div>
    </header>
  );
}

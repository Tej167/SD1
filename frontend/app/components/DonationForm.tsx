"use client";

import React, { useState, useRef } from "react";
import { User, IndianRupee, HeartHandshake, Phone, Camera, X } from "lucide-react";
import { compressImage } from "../lib/imageCompressor";

export interface DonationData {
  name: string;
  amount: string;
  purpose: string;
  whatsapp: string;
  photo: string | null;
}

interface DonationFormProps {
  onSubmit: (data: DonationData) => void;
}

const PRESET_AMOUNTS = ["501", "1,100", "5,100", "11,000", "21,000", "51,000"];

const SEVA_OPTIONS = [
  { value: "અન્નક્ષેત્ર સેવા (Annakshetra)", label: "અન્નક્ષેત્ર સેવા (Mahaprasad / Annakshetra)" },
  { value: "મંદિર સેવા (Mandir Seva)", label: "મંદિર નિર્માણ / દૈનિક સેવા (Mandir Seva)" },
  { value: "ગૌ સેવા (Gau Seva)", label: "ગૌ શાળા અને ગૌ સેવા (Gau Seva)" },
  { value: "ઉત્સવ સેવા (Festival Seva)", label: "ઉત્સવ અને હરિભક્ત સેવા (Festival Seva)" },
];

export default function DonationForm({ onSubmit }: DonationFormProps) {
  const [name, setName] = useState("શ્રી રાજેશભાઈ પટેલ");
  const [amount, setAmount] = useState("11,000");
  const [purpose, setPurpose] = useState("અન્નક્ષેત્ર સેવા (Annakshetra)");
  const [whatsapp, setWhatsapp] = useState("+91 98765 43210");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 800, 0.85);
      setPhoto(compressedDataUrl);
    } catch (err) {
      console.error("Failed to compress image:", err);
      alert("Failed to process photo. Please choose another image.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("કૃપા કરીને દાતાનું નામ દાખલ કરો (Please enter Donor Name)");
    if (!amount.trim()) return alert("કૃપા કરીને દાનની રકમ પસંદ કરો (Please enter Donation Amount)");

    onSubmit({
      name,
      amount,
      purpose,
      whatsapp,
      photo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="devotional-card rounded-2xl p-6 sm:p-8 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-gold-400/20 pb-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-gujarati text-gold-300">
            દાન નોંધણી ફોર્મ
          </h2>
          <p className="text-xs text-amber-200/70 font-cinzel">Donation Registration Details</p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-saffron-600/30 border border-saffron-500/40 text-saffron-200">
          સહજાનંદ સેવા
        </span>
      </div>

      <div className="space-y-6">
        {/* Donor Name */}
        <div>
          <label className="block text-sm font-semibold text-amber-100 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-gold-400" />
            <span>દાતાશ્રીનું પૂરું નામ (Donor Name)</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="દા.ત. શ્રી રાજેશભાઈ પટેલ / Ramesh Patel"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gold-400/40 text-amber-50 placeholder-amber-200/30 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-base"
          />
        </div>

        {/* Donation Amount */}
        <div>
          <label className="block text-sm font-semibold text-amber-100 mb-2 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-gold-400" />
            <span>દાનની રકમ (Donation Amount in ₹)</span>
          </label>

          {/* Quick preset chips */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setAmount(preset)}
                className={`py-2 px-1 text-sm font-bold rounded-lg border transition-all ${
                  amount === preset
                    ? "bg-gold-500 text-maroon-900 border-gold-300 shadow-md shadow-gold-500/30 scale-105"
                    : "bg-black/30 text-amber-200 border-gold-500/30 hover:border-gold-400 hover:bg-gold-500/10"
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gold-400 font-bold text-lg">₹</span>
            <input
              type="text"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="અથવા રકમ દાખલ કરો (e.g. 11000)"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-black/40 border border-gold-400/40 text-amber-50 font-semibold focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-base"
            />
          </div>
        </div>

        {/* Purpose / Seva Category */}
        <div>
          <label className="block text-sm font-semibold text-amber-100 mb-2 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-gold-400" />
            <span>સેવાનો હેતુ (Purpose / Seva Category)</span>
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gold-400/40 text-amber-50 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-base"
          >
            {SEVA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-maroon-900 text-amber-50">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label className="block text-sm font-semibold text-amber-100 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>વોટ્સએપ નંબર (WhatsApp for Video Delivery)</span>
          </label>
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-gold-400/40 text-amber-50 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-base"
          />
          <p className="text-[11px] text-amber-200/60 mt-1">
            આ નંબર પર તૈયાર વીડિયો અને પાવતી તુરંત મોકલવામાં આવશે.
          </p>
        </div>

        {/* Donor Photo Upload (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-amber-100 mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4 text-gold-400" />
            <span>દાતાશ્રીનો ફોટો (Optional Donor Photo for Video)</span>
          </label>

          <div className="flex items-center gap-4">
            {photo ? (
              <div className="relative group w-20 h-24 rounded-xl overflow-hidden border-2 border-gold-400 shadow-md">
                <img src={photo} alt="Donor Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity"
                  title="Remove Photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-24 rounded-xl border-2 border-dashed border-gold-400/50 hover:border-gold-400 flex flex-col items-center justify-center cursor-pointer bg-black/20 hover:bg-gold-500/10 transition-colors text-center p-2"
              >
                <Camera className="w-6 h-6 text-gold-400/70 mb-1" />
                <span className="text-[10px] text-amber-200/80">Upload Photo</span>
              </div>
            )}

            <div className="flex-1 text-xs text-amber-200/70 space-y-1">
              <p>ફોટો અપલોડ કરવાથી વીડિયોમાં દાતાશ્રીની છબી સોનેરી ફ્રેમમાં દર્શાવાશે.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-block text-xs font-semibold text-gold-300 hover:text-gold-200 underline"
              >
                {photo ? "Change Photo" : "Browse from device"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {isCompressing && <p className="text-gold-400 text-[11px] animate-pulse">Optimizing photo...</p>}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-xl font-extrabold text-base sm:text-lg text-maroon-950 bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 hover:from-gold-200 hover:to-amber-400 shadow-lg shadow-gold-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
          >
            <span className="font-gujarati">દાન અર્પણ કરો અને વીડિયો મેળવો</span>
            <span className="text-xs bg-maroon-900/20 px-2 py-0.5 rounded-full font-cinzel">
              PROCEED (₹{amount})
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

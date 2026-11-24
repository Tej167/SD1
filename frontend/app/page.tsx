"use client";

import React, { useState } from "react";
import Header from "./components/Header";
import DonationForm, { DonationData } from "./components/DonationForm";
import PaymentModal from "./components/PaymentModal";
import DevotionalLoader from "./components/DevotionalLoader";
import VideoResult from "./components/VideoResult";
import { AlertCircle } from "lucide-react";

type Step = "form" | "payment" | "loading" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<DonationData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFormSubmit = (data: DonationData) => {
    setFormData(data);
    setErrorMsg(null);
    setStep("payment");
  };

  /**
   * Razorpay Checkout success hone ke baad call hoga.
   * Backend pe /verify-and-generate call karega — payment verify + video generate.
   */
  const handlePaymentSuccess = async (
    orderId: string,
    paymentId: string,
    signature: string
  ) => {
    if (!formData) return;
    setStep("loading");
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_BASE}/verify-and-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          name: formData.name,
          amount: formData.amount,
          purpose: formData.purpose,
          whatsapp: formData.whatsapp,
          photo: formData.photo || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const videoBlob = await response.blob();
      const localVideoUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(localVideoUrl);
      setStep("result");
    } catch (err: any) {
      console.error("Video generation failed:", err);
      setErrorMsg(
        err.message || "Failed to generate announcement video. Please ensure the backend is running."
      );
      setStep("form");
    }
  };

  const handleReset = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setFormData(null);
    setErrorMsg(null);
    setStep("form");
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#3b0000] via-[#240000] to-[#140000] relative overflow-x-hidden">
      {/* Devotional Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-none mt-0.5" />
            <div className="flex-1">
              <strong className="block text-red-300 font-semibold">Video Generation Notice:</strong>
              <span>{errorMsg}</span>
              <p className="text-xs text-red-300/80 mt-1">
                Make sure your FastAPI server is running on <code className="bg-black/40 px-1 py-0.5 rounded">{API_BASE}</code> (or check your Cloudflare Tunnel URL).
              </p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step 1: Donation Form */}
        {step === "form" && <DonationForm onSubmit={handleFormSubmit} />}

        {/* Step 2: Razorpay Payment Checkout */}
        {step === "payment" && formData && (
          <PaymentModal
            amount={formData.amount}
            donorName={formData.name}
            purpose={formData.purpose}
            whatsapp={formData.whatsapp}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep("form")}
          />
        )}

        {/* Step 3: Devotional Loading State */}
        {step === "loading" && formData && (
          <DevotionalLoader donorName={formData.name} amount={formData.amount} />
        )}

        {/* Step 4: Result Screen */}
        {step === "result" && formData && videoUrl && (
          <VideoResult
            videoUrl={videoUrl}
            donorName={formData.name}
            amount={formData.amount}
            purpose={formData.purpose}
            whatsapp={formData.whatsapp}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 px-4 text-xs text-amber-200/50 border-t border-gold-400/20 bg-black/40">
        <p>
          || શ્રી સ્વામિનારાયણ વિજયતેતરામ્ || • Smart Mandir Announcement System • Live Client Demo
        </p>
      </footer>
    </main>
  );
}

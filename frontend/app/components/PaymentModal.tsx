"use client";

import React, { useState, useCallback } from "react";
import { ShieldCheck, X, Loader2, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  amount: string;
  donorName: string;
  purpose: string;
  whatsapp: string;
  onSuccess: (orderId: string, paymentId: string, signature: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({
  amount,
  donorName,
  purpose,
  whatsapp,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_REPLACE_ME";

  const cleanAmount = amount.replace("₹", "").replace(/,/g, "").trim();
  const amountINR = parseInt(cleanAmount, 10);

  const initiatePayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Backend se Razorpay order create karo
      const orderRes = await fetch(`${API_BASE}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountINR }),
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        throw new Error(`Order creation failed: ${errText}`);
      }

      const orderData = await orderRes.json();

      // Step 2: Razorpay Checkout SDK open karo
      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: "Shree Swaminarayan Mandir",
        description: `${purpose} • ₹${amount}`,
        image: "",
        prefill: {
          name: donorName,
          contact: whatsapp.startsWith("91") ? whatsapp : `91${whatsapp}`,
        },
        notes: {
          donor_name: donorName,
          purpose: purpose,
          whatsapp: whatsapp,
          amount_inr: amount,
        },
        theme: {
          color: "#800000",
          backdrop_color: "rgba(0,0,0,0.85)",
        },
        handler: (response: any) => {
          // Payment successful — parent ko Razorpay data pass karo
          onSuccess(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
          confirm_close: true,
          escape: false,
        },
      };

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay SDK not loaded. Please refresh the page.");
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setError(
          `Payment failed: ${response.error?.description || "Unknown error"}. Please try again.`
        );
        setIsLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment initiation failed:", err);
      setError(err.message || "Could not initiate payment. Is the backend running?");
      setIsLoading(false);
    }
  }, [API_BASE, RAZORPAY_KEY, amountINR, amount, donorName, purpose, whatsapp, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md devotional-card rounded-2xl overflow-hidden border border-gold-400/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-maroon-800 to-maroon-900 border-b border-gold-400/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="text-sm font-bold text-gold-200">Razorpay Secure Checkout</h3>
              <p className="text-[10px] text-amber-200/70">256-bit Encrypted Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-black/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Donor Banner */}
        <div className="bg-black/40 p-5 border-b border-gold-400/20 text-center">
          <p className="text-xs text-amber-200/80">Donation Amount (દાન રકમ)</p>
          <div className="text-3xl font-extrabold text-gold-400 mt-0.5">₹{amount}</div>
          <p className="text-xs text-amber-100 font-gujarati mt-1 truncate">દાતા: {donorName}</p>
          <p className="text-[11px] text-amber-200/60 mt-0.5">{purpose}</p>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center space-y-4">
          {/* Error message */}
          {error && (
            <div className="w-full p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info banner */}
          <div className="w-full p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-[11px] text-amber-200">
              🛡️ <strong>Secure Payment:</strong> UPI, Credit/Debit Card, Net Banking, Wallets supported via Razorpay.
            </p>
          </div>

          {/* Pay Button — opens Razorpay Checkout */}
          <button
            onClick={initiatePayment}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-maroon-950 bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 hover:from-gold-200 hover:to-amber-400 shadow-lg shadow-gold-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Razorpay...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-gujarati">₹{amount} ચૂકવો (Pay Now)</span>
              </span>
            )}
          </button>

          <p className="text-[10px] text-amber-200/40 text-center">
            Powered by Razorpay • PCI DSS Compliant
          </p>
        </div>
      </div>
    </div>
  );
}

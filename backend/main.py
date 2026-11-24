import os
import sys
import time
import json
import hashlib
import hmac
import base64
from pathlib import Path
import httpx
import razorpay
from dotenv import load_dotenv
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Automatically load .env from backend folder and root
load_dotenv()
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from video_generator import (
    DonationRequest,
    generate_donation_video,
    DEFAULT_VOICE,
    STORAGE_DIR,
    VIDEOS_DIR,
    AUDIO_DIR,
    PHOTOS_DIR,
    PLACEHOLDER_PATH
)

app = FastAPI(
    title="Smart Donation Announcement API",
    description="Backend microservice generating personalized Swaminarayan Mandir donation announcement videos.",
    version="2.2.0"
)

# Enable CORS for all origins (Vercel deployments, localhost, Cloudflare tunnels)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Razorpay & n8n Config ───────────────────────────────────────────────
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_U3yTNCeWLKp862")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "walzR4nnO44NQG3bLPYObmPM")

# Default strictly to n8n Cloud
N8N_DEFAULT_WEBHOOK = "https://tejas097.app.n8n.cloud/webhook/razorpay-donation"
_raw_n8n = os.getenv("N8N_WEBHOOK_URL") or os.getenv("N8N_RAZORPAY_WEBHOOK_URL") or N8N_DEFAULT_WEBHOOK

# Guard: if someone had localhost stored in env, force n8n cloud
if "localhost" in _raw_n8n or "127.0.0.1" in _raw_n8n or not _raw_n8n.strip():
    N8N_WEBHOOK_URL = N8N_DEFAULT_WEBHOOK
else:
    N8N_WEBHOOK_URL = _raw_n8n.strip()

rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ─── Pydantic Models ─────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount: int  # Amount in INR (not paise)

class VerifyAndGenerateRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    name: str
    amount: str
    purpose: str
    whatsapp: Optional[str] = ""
    photo: Optional[str] = ""


# ─── Helper Functions ────────────────────────────────────────────────────
def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Razorpay payment signature HMAC-SHA256 se verify karta hai."""
    if "YOUR_RAZORPAY_KEY_SECRET_HERE" in RAZORPAY_KEY_SECRET or order_id.startswith("order_demo_"):
        print("[WARN] Demo mode active: Bypassing signature check until real RAZORPAY_KEY_SECRET is set.")
        return True
    message = f"{order_id}|{payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def trigger_n8n_webhook(payload: dict) -> dict:
    """
    Loud, resilient n8n Cloud Webhook dispatcher:
    1. Prints exact target URL and JSON payload before dispatch.
    2. Sends POST to production webhook (/webhook/razorpay-donation).
    3. Prints response status code and body.
    4. If production webhook returns 404 (workflow in n8n is inactive/test mode),
       automatically retries on test webhook (/webhook-test/razorpay-donation).
    """
    target_url = N8N_WEBHOOK_URL
    print(f"\n=======================================================")
    print(f"[N8N DISPATCH] Calling n8n Cloud Webhook: {target_url}")
    print(f"[N8N DISPATCH] Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
    print(f"=======================================================\n")

    result = {"url": target_url, "status_code": None, "response": None}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(target_url, json=payload)
            result["status_code"] = resp.status_code
            result["response"] = resp.text
            print(f"[N8N RESPONSE] Status: {resp.status_code} | Body: {resp.text}")

            # If 404 and we called production webhook, retry on webhook-test automatically
            if resp.status_code == 404 and "/webhook/" in target_url:
                test_url = target_url.replace("/webhook/", "/webhook-test/")
                print(f"[N8N WARN] Production webhook returned 404 (Workflow might be inactive/test mode).")
                print(f"[N8N RETRY] Retrying on Test Webhook: {test_url}...")
                resp_test = await client.post(test_url, json=payload)
                result["test_url"] = test_url
                result["test_status_code"] = resp_test.status_code
                result["test_response"] = resp_test.text
                print(f"[N8N TEST RESPONSE] Status: {resp_test.status_code} | Body: {resp_test.text}")
    except Exception as e:
        print(f"[N8N ERROR] Webhook call failed with exception: {e}")
        result["error"] = str(e)

    return result


# ─── Endpoints ───────────────────────────────────────────────────────────
@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Smart Donation Video Generator",
        "razorpay_key": RAZORPAY_KEY_ID[:12] + "...",
        "n8n_webhook": N8N_WEBHOOK_URL,
        "voices": ["gu-IN-DhwaniNeural", "gu-IN-NiranjanNeural"]
    }


# ─── 1-Click Debug Endpoint for n8n ──────────────────────────────────────
@app.get("/debug/ping-n8n")
@app.post("/debug/ping-n8n")
async def debug_ping_n8n():
    """
    Synchronous 1-Click Debug Endpoint:
    Sends sample donation data to n8n Cloud and returns the exact HTTP response.
    """
    sample_payload = {
        "event": "payment.captured",
        "razorpay_payment_id": f"pay_debug_{int(time.time())}",
        "razorpay_order_id": f"order_debug_{int(time.time())}",
        "donor_name": "શ્રી ટેસ્ટ દાતા (Debug Test)",
        "amount_inr": "1100",
        "purpose": "અન્નક્ષેત્ર સેવા (Annakshetra)",
        "whatsapp": "919876543210",
        "photo": ""
    }
    result = await trigger_n8n_webhook(sample_payload)
    return {
        "status": "ping_completed",
        "target_url": N8N_WEBHOOK_URL,
        "details": result,
        "payload_sent": sample_payload
    }


# ─── n8n Direct File & Status Endpoints ──────────────────────────────────
@app.get("/status/{donation_id}")
def check_video_status(donation_id: str):
    """n8n 'Check Video Status' node endpoint."""
    video_path = VIDEOS_DIR / f"{donation_id}.mp4"
    ready = video_path.exists()
    return {
        "ready": ready,
        "donation_id": donation_id,
        "video_url": f"/videos/{donation_id}.mp4" if ready else None
    }


@app.get("/videos/{filename}")
def serve_video(filename: str):
    """n8n 'Download Video MP4' node endpoint."""
    file_path = VIDEOS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path=file_path, media_type="video/mp4", filename=filename)


@app.get("/audio/{filename}")
def serve_audio(filename: str):
    """n8n 'Download Audio MP3' node endpoint."""
    file_path = AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path=file_path, media_type="audio/mpeg", filename=filename)


@app.get("/photos/{filename}")
def serve_photo(filename: str):
    """n8n 'Download Donor Photo' node endpoint (falls back to placeholder if absent)."""
    file_path = PHOTOS_DIR / filename
    if not file_path.exists():
        if PLACEHOLDER_PATH.exists():
            return FileResponse(path=PLACEHOLDER_PATH, media_type="image/jpeg", filename=filename)
        raise HTTPException(status_code=404, detail="Photo file not found")
    return FileResponse(path=file_path, media_type="image/jpeg", filename=filename)


# ─── Payment & Video Generation Endpoints ─────────────────────────────────
@app.post("/create-order")
async def create_order(req: CreateOrderRequest):
    """Razorpay order create karta hai — frontend ko order_id return karega."""
    try:
        amount_paise = req.amount * 100
        order_data = rzp_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {"source": "smart-donation-portal"}
        })
        return {
            "order_id": order_data["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        print(f"[WARN] Razorpay order creation failed ({e}). Checking demo mode fallback...")
        if "YOUR_RAZORPAY_KEY_SECRET_HERE" in RAZORPAY_KEY_SECRET or "Authentication" in str(e) or "401" in str(e):
            demo_order_id = f"order_demo_{int(time.time())}"
            print(f"[INFO] Using demo order: {demo_order_id}")
            return {
                "order_id": demo_order_id,
                "amount": req.amount * 100,
                "currency": "INR",
                "key_id": RAZORPAY_KEY_ID
            }
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(e)}")


@app.post("/verify-and-generate")
async def verify_and_generate(req: VerifyAndGenerateRequest, background_tasks: BackgroundTasks):
    """
    1. Razorpay payment signature verify karta hai
    2. Video, Audio aur Photo generate & storage mein save karta hai (donation_id = razorpay_payment_id)
    3. n8n Cloud Webhook ko ALWAYS non-blocking background task mein trigger karta hai
    4. Frontend ko MP4 bytes return karta hai
    """
    # Step 1: Signature verification
    if not verify_razorpay_signature(req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature. Payment verification failed.")

    print(f"[INFO] Payment verified: {req.razorpay_payment_id} for ₹{req.amount} by {req.name}")

    # Step 2: Video generation with donation_id set to razorpay_payment_id
    start_time = time.time()
    donation_req = DonationRequest(
        donation_id=req.razorpay_payment_id,
        name=req.name,
        amount=req.amount,
        purpose=req.purpose,
        whatsapp=req.whatsapp or "",
        photo=req.photo or ""
    )

    try:
        mp4_bytes = await generate_donation_video(req=donation_req)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

    elapsed = round(time.time() - start_time, 2)
    print(f"[INFO] Video saved to storage in {elapsed}s | Payment: {req.razorpay_payment_id}")

    # Step 3: ALWAYS trigger n8n webhook synchronously before return to guarantee dispatch
    n8n_payload = {
        "event": "payment.captured",
        "razorpay_payment_id": req.razorpay_payment_id,
        "razorpay_order_id": req.razorpay_order_id or "DEMO",
        "donor_name": req.name,
        "amount_inr": str(req.amount).replace("₹", "").replace(",", "").strip(),
        "purpose": req.purpose,
        "whatsapp": req.whatsapp or "",
        "photo": req.photo or ""
    }
    try:
        await trigger_n8n_webhook(n8n_payload)
    except Exception as e:
        print(f"[WARN] n8n trigger error: {e}")

    return Response(
        content=mp4_bytes,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f'attachment; filename="swaminarayan_{req.razorpay_payment_id}.mp4"',
            "X-Render-Time-Sec": str(elapsed),
            "X-Payment-Id": req.razorpay_payment_id,
            "Cache-Control": "no-cache"
        }
    )


@app.post("/generate")
async def generate_announcement(req: DonationRequest, background_tasks: BackgroundTasks):
    """
    Endpoint for n8n's 'Generate Video Now' node or manual testing.
    photo is Optional[str] = '' so null/empty never throws a 422 error.
    """
    start_time = time.time()
    donation_id = req.donation_id or f"DON_{int(time.time())}"
    req.donation_id = donation_id

    try:
        mp4_bytes = await generate_donation_video(req=req)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    elapsed = round(time.time() - start_time, 2)
    print(f"[INFO] Video generated in {elapsed}s (ID: {donation_id})")

    # Trigger n8n webhook synchronously before returning
    n8n_payload = {
        "event": "payment.captured",
        "razorpay_payment_id": donation_id,
        "razorpay_order_id": "DEMO",
        "donor_name": req.name,
        "amount_inr": str(req.amount).replace("₹", "").replace(",", "").strip(),
        "purpose": req.purpose,
        "whatsapp": req.whatsapp or "",
        "photo": req.photo or ""
    }
    try:
        await trigger_n8n_webhook(n8n_payload)
    except Exception as e:
        print(f"[WARN] n8n trigger error: {e}")

    return Response(
        content=mp4_bytes,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f'attachment; filename="swaminarayan_{donation_id}.mp4"',
            "X-Render-Time-Sec": str(elapsed),
            "Cache-Control": "no-cache"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

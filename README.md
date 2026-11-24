# 🪔 Shree Swaminarayan Mandir — Smart Donation Announcement System

A production-ready, full-stack devotional donation and automated announcement platform built for **Shree Swaminarayan Mandir**.

When a devotee makes an offering through the portal, the system accepts payment via **Razorpay**, generates a personalized **8-second HD (1280x720) devotional announcement video** with animated graphics, the donor's photo, and natural **Gujarati voiceover** (`Edge-TTS`), saves it, and automatically triggers an **n8n Cloud workflow** to send the video to the donor's **WhatsApp** via Evolution API, archive assets in **Google Drive**, and log transactions in **Google Sheets**.

---

## 🏛️ System Architecture

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           1. DEVOTEE CLIENT LAYER                           │
 │                                                                             │
 │  Next.js 14 Devotional Web Portal (Vercel-ready, Saffron / Gold / Maroon)   │
 │  - Donor Name (English / Gujarati) + Seva Dropdown + WhatsApp Number        │
 │  - Quick Amount Presets (₹501, ₹1,100, ₹5,100, ₹11,000) + Custom Amount    │
 │  - Optional Donor Photo Upload (with client-side canvas compression)        │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                        2. PAYMENT GATEWAY LAYER                             │
 │                                                                             │
 │  Razorpay Checkout SDK (UPI QR, Google Pay, PhonePe, Cards, NetBanking)    │
 │  - Backend creates order via POST /create-order                             │
 │  - Standard Razorpay modal opens & captures payment                         │
 │  - Success handler receives: order_id, payment_id, signature                │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                    3. FASTAPI VIDEO GENERATION SERVICE                      │
 │                                                                             │
 │  POST /verify-and-generate (via Cloudflare Public Tunnel)                   │
 │  1. HMAC-SHA256 signature verification                                      │
 │  2. Edge-TTS Gujarati devotional audio synthesis (gu-IN-DhwaniNeural)       │
 │  3. Playwright Headless Chromium records animated template.html (1280x720)  │
 │  4. FFmpeg muxes audio + video with intro trim and tpad frame-holding       │
 │  5. Saves MP4, MP3 & Photo into backend/storage/ directory                  │
 │  6. Dispatches webhook to n8n Cloud                                         │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                  4. n8n CLOUD MULTI-CHANNEL AUTOMATION                      │
 │                                                                             │
 │  Workflow: Smart_Donation_FINAL.json                                        │
 │  ├─► Evolution API: Sends personalized MP4 video to Donor's WhatsApp        │
 │  ├─► Google Drive: Uploads {donation_id}.mp4, .mp3 & photo to SD1 folder   │
 │  └─► Google Sheets: Logs 13 data columns with Drive URLs in sheet 'sd1'     │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Devotional Saffron & Gold Theme:**
   - Designed around `|| જય સ્વામિનારાયણ ||` motifs, sacred tilak styling, and gold gradients.
   - Built with Next.js 14 (App Router) and Tailwind CSS.
2. **Seamless Razorpay Checkout:**
   - Supports Test and Live modes with strict HMAC-SHA256 server-side signature validation.
   - Intelligent demo-mode resilience so client presentations run smoothly.
3. **AI Gujarati Voice Synthesis:**
   - Microsoft Edge-TTS (`gu-IN-DhwaniNeural` / `gu-IN-NiranjanNeural`) generates natural, respectful Gujarati pronunciation.
   - Automatically sanitizes names (prevents duplicate *"શ્રી"*) and removes English parenthetical labels.
4. **Dynamic Video Rendering Engine:**
   - Playwright Chromium animates `template.html` at 1280x720 with donor photo, name, seva category, and amount.
   - Bundled FFmpeg trims blank font-loading frames and holds the final blessing frame using `tpad` filter until audio completes.
5. **Download Protection on Video Player:**
   - Video player in result view disables right-click, context menu, picture-in-picture, and download buttons (`controlsList="nodownload noplaybackrate"`).
   - Shows WhatsApp delivery confirmation card: *"વીડિયો તમારા WhatsApp નંબર પર મોકલી દેવામાં આવ્યો છે"*.
6. **n8n Cloud Workflow Ready:**
   - Includes production-ready `Smart_Donation_FINAL.json` workflow.
   - FastAPI automatically pings n8n Cloud webhook with fallback test-mode retry.
   - Direct file endpoints (`/status`, `/videos`, `/audio`, `/photos`) allow n8n to download assets without size limits.

---

## 📁 Repository Structure

```text
SD2/
├── backend/
│   ├── main.py                 # FastAPI microservice & webhook dispatcher
│   ├── video_generator.py      # Playwright Chromium recorder & FFmpeg muxer
│   ├── tts_service.py          # Edge-TTS Gujarati synthesis & DNS patch
│   ├── requirements.txt        # Python package dependencies
│   ├── .env.example            # Backend environment template
│   └── storage/                # Persistent asset storage for n8n downloads
│       ├── videos/             # Generated announcement MP4 videos
│       ├── audio/              # Synthesized Gujarati MP3 voiceovers
│       ├── photos/             # Donor photos (or placeholder fallback)
│       └── placeholder.jpg     # Default 1x1 fallback image
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Razorpay Checkout script
│   │   ├── page.tsx            # Multi-step state machine (form → pay → load → result)
│   │   ├── globals.css         # Devotional colors & typography
│   │   └── components/
│   │       ├── Header.tsx           # Sacred top banner
│   │       ├── DonationForm.tsx     # Devotional offering inputs
│   │       ├── PaymentModal.tsx     # Razorpay Checkout trigger modal
│   │       ├── DevotionalLoader.tsx # Animated mandala loading indicator
│   │       └── VideoResult.tsx      # Video player (nodownload) & WhatsApp card
│   ├── package.json
│   ├── tailwind.config.ts
│   └── .env.example            # Frontend environment template
├── template.html               # 1280x720 animated HTML5 canvas template
├── Smart_Donation_FINAL.json   # Ready-to-import n8n workflow JSON
├── index.html                  # Standalone single-file frontend alternative
├── run_backend.bat             # 1-Click launcher for FastAPI
├── run_frontend.bat            # 1-Click launcher for Next.js
├── run_tunnel.bat              # 1-Click launcher for Cloudflare Tunnel
└── README.md
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Prerequisites
- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & npm
- **Cloudflare Tunnel (`cloudflared`)** for exposing local FastAPI to n8n Cloud and Vercel

---

### 2. Backend Setup

```powershell
cd "backend"

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright Chromium browser
playwright install chromium
```

#### Configure `backend/.env`:
Create `backend/.env` (copy from `backend/.env.example`):

```env
# Razorpay Credentials (from https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE

# n8n Cloud Webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/razorpay-donation
```

#### Run FastAPI Backend:
```powershell
python main.py
```
*Backend runs at `http://localhost:8000`. Health check: [http://localhost:8000/health](http://localhost:8000/health)*

---

### 3. Expose Backend via Cloudflare Tunnel

To allow n8n Cloud and external clients to download video files and call the API, run:

```powershell
cloudflared tunnel --url http://127.0.0.1:8000
```

Cloudflare will give you a public HTTPS URL like:
```text
https://your-tunnel-subdomain.trycloudflare.com
```

---

### 4. Frontend Setup

```powershell
cd "../frontend"

# Install npm packages
npm install
```

#### Configure `frontend/.env.local`:
Create `frontend/.env.local` (copy from `frontend/.env.example`):

```env
# Point to your local FastAPI or public Cloudflare Tunnel URL
NEXT_PUBLIC_API_URL=https://your-tunnel-subdomain.trycloudflare.com

# Razorpay Key ID (Public key for checkout popup)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
```

#### Run Next.js Frontend:
```powershell
npm run dev
```
*Frontend runs at [http://localhost:3000](http://localhost:3000)*

---

### 5. Setup n8n Cloud Automation

1. Open your **n8n Cloud instance** (`https://your-instance.app.n8n.cloud`).
2. Go to **Workflows &rarr; Import from File**.
3. Select [Smart_Donation_FINAL.json](./Smart_Donation_FINAL.json).
4. Configure credentials in the workflow:
   - **Google Sheets OAuth2:** Select your Google Sheets account.
   - **Google Drive OAuth2:** Select your Google Drive account.
   - **Evolution API (WhatsApp):** Replace `YOUR_EVOLUTION_API_URL`, `YOUR_INSTANCE`, and `YOUR_EVOLUTION_API_KEY`.
5. Toggle the workflow to **Active**.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns service status and loaded voices |
| `POST` | `/create-order` | Creates a Razorpay order (`{ "amount": 501 }`) |
| `POST` | `/verify-and-generate` | Verifies signature, generates video, saves assets, and triggers n8n webhook |
| `POST` | `/generate` | Direct video generation (used by n8n or testing) |
| `GET` | `/status/{donation_id}` | Returns `{"ready": true/false}` for n8n status checking |
| `GET` | `/videos/{filename}` | Streams generated `.mp4` video file |
| `GET` | `/audio/{filename}` | Streams synthesized `.mp3` audio file |
| `GET` | `/photos/{filename}` | Streams donor photo (or fallback placeholder) |
| `GET` | `/debug/ping-n8n` | 1-Click synchronous test ping to verify n8n webhook connection |

---

## ⚡ 1-Click Windows Launchers

For live client demonstrations on Windows, use the included batch files:
- **`run_backend.bat`** &rarr; Starts FastAPI server on port 8000
- **`run_frontend.bat`** &rarr; Starts Next.js development server on port 3000
- **`run_tunnel.bat`** &rarr; Launches Cloudflare Tunnel to port 8000

---

## 📜 License

Created with devotion for **Shree Swaminarayan Mandir Seva**. Open source for community mandir automation projects.

|| શ્રી સ્વામિનારાયણ વિજયતેતરામ્ ||

import os
import sys
import time
import shutil
import uuid
import base64
import subprocess
import asyncio
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

from fastapi import HTTPException
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
import imageio_ffmpeg
import httpx

from tts_service import build_gujarati_script, generate_gujarati_audio, DEFAULT_VOICE

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "template.html"
FFMPEG_EXE = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

# ─── Persistent Storage Setup ─────────────────────────────────────────────
STORAGE_DIR = Path(__file__).resolve().parent / "storage"
VIDEOS_DIR = STORAGE_DIR / "videos"
AUDIO_DIR = STORAGE_DIR / "audio"
PHOTOS_DIR = STORAGE_DIR / "photos"

for d in (VIDEOS_DIR, AUDIO_DIR, PHOTOS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Create a 1x1 fallback JPEG placeholder if it doesn't exist
PLACEHOLDER_PATH = STORAGE_DIR / "placeholder.jpg"
if not PLACEHOLDER_PATH.exists():
    # 1x1 pixel JPEG bytes
    PLACEHOLDER_BYTES = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
    with open(PLACEHOLDER_PATH, "wb") as f:
        f.write(PLACEHOLDER_BYTES)


class DonationRequest(BaseModel):
    donation_id: Optional[str] = Field(None, example="DON_1732441234")
    name: str = Field(..., example="શ્રી રાજેશભાઈ પટેલ")
    amount: str = Field(..., example="11,000")
    purpose: str = Field(..., example="અન્નક્ષેત્ર સેવા (Annakshetra)")
    whatsapp: Optional[str] = Field(None, example="+919876543210")
    photo: Optional[str] = Field("", description="Base64 Data URI or image URL")
    voice: Optional[str] = Field(DEFAULT_VOICE, example="gu-IN-DhwaniNeural")


def save_donor_photo(donation_id: str, photo_str: Optional[str]) -> Path:
    """Decodes and stores donor photo to storage/photos/{donation_id}.jpg."""
    out_file = PHOTOS_DIR / f"{donation_id}.jpg"
    if not photo_str or not photo_str.strip():
        shutil.copy2(PLACEHOLDER_PATH, out_file)
        return out_file

    photo_str = photo_str.strip()
    try:
        if photo_str.startswith("data:image"):
            # Base64 data URI
            header, b64_data = photo_str.split(",", 1)
            raw = base64.b64decode(b64_data)
            with open(out_file, "wb") as f:
                f.write(raw)
            return out_file
        elif photo_str.startswith("http://") or photo_str.startswith("https://"):
            # Direct HTTP URL
            with httpx.Client(timeout=10.0) as client:
                res = client.get(photo_str)
                if res.status_code == 200:
                    with open(out_file, "wb") as f:
                        f.write(res.content)
                    return out_file
        else:
            # Raw base64 string
            raw = base64.b64decode(photo_str)
            with open(out_file, "wb") as f:
                f.write(raw)
            return out_file
    except Exception as e:
        print(f"[WARN] Failed to save photo for {donation_id}: {e}")

    # Fallback placeholder
    shutil.copy2(PLACEHOLDER_PATH, out_file)
    return out_file


async def record_template_video(req: DonationRequest, photo_uri: str, temp_dir: Path) -> tuple[Path, float]:
    if not TEMPLATE_PATH.exists():
        raise HTTPException(status_code=500, detail="template.html not found in project folder.")

    params = urlencode(
        {
            "name": req.name,
            "amount": req.amount,
            "purpose": req.purpose,
            "photo": photo_uri,
        }
    )
    target_url = f"{TEMPLATE_PATH.as_uri()}?{params}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=str(temp_dir),
            record_video_size={"width": 1280, "height": 720},
        )
        start_ts = time.monotonic()
        page = await context.new_page()
        await page.goto(target_url, wait_until="networkidle")

        try:
            await page.wait_for_function("() => window.__videoReady === true", timeout=10000)
        except Exception:
            pass

        # Exact kitne seconds blank screen rahi (fonts load hone mein)
        trim_start = max(0.0, time.monotonic() - start_ts)

        # Animation start hone ke baad poora 9.0s record karo (Purpose + Blessing + Hold)
        await asyncio.sleep(9.0)

        video = page.video
        await context.close()
        await browser.close()

        return Path(await video.path()), trim_start


def merge_video_and_audio(video_path: Path, audio_path: Path, output_path: Path, trim_start: float) -> None:
    """Blank intro trim karega + last frame hold karega jab tak Gujarati audio complete na ho."""
    vf = f"[0:v]trim=start={trim_start:.2f},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=10[v]"
    cmd = [
        FFMPEG_EXE,
        "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-filter_complex", vf,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "28",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        "-movflags", "+faststart",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")


async def generate_donation_video(req: DonationRequest) -> bytes:
    """
    Full pipeline with persistent storage caching:
    1. If already generated for req.donation_id, return cached MP4 bytes.
    2. Gujarati script generation & Edge-TTS synthesis.
    3. Playwright 1280x720 video recording of template.html.
    4. FFmpeg muxing.
    5. Save MP4, MP3, and Photo to storage/ for n8n endpoints.
    6. Return MP4 bytes.
    """
    donation_id = req.donation_id or f"DON_{uuid.uuid4().hex[:10]}"

    # Check if already generated and cached
    cached_mp4 = VIDEOS_DIR / f"{donation_id}.mp4"
    if cached_mp4.exists():
        print(f"[INFO] Returning cached video for donation_id: {donation_id}")
        with open(cached_mp4, "rb") as f:
            return f.read()

    job_id = uuid.uuid4().hex
    work_dir = Path(__file__).resolve().parent / "temp" / job_id
    work_dir.mkdir(parents=True, exist_ok=True)

    audio_path = work_dir / "voice.mp3"
    mp4_path = work_dir / "announcement.mp4"

    try:
        # Step 1: TTS
        script_text = build_gujarati_script(name=req.name, amount=req.amount, purpose=req.purpose)
        await generate_gujarati_audio(
            text=script_text,
            output_path=str(audio_path),
            voice=req.voice or DEFAULT_VOICE
        )

        # Step 2: Record animation in Chromium
        video_path, trim_start = await record_template_video(
            req=req,
            photo_uri=req.photo or "",
            temp_dir=work_dir
        )

        # Step 3: Merge video and audio with trim_start and tpad
        merge_video_and_audio(
            video_path=video_path,
            audio_path=audio_path,
            output_path=mp4_path,
            trim_start=trim_start
        )

        # Step 4: Persist to storage folder for n8n downloads
        shutil.copy2(mp4_path, VIDEOS_DIR / f"{donation_id}.mp4")
        shutil.copy2(audio_path, AUDIO_DIR / f"{donation_id}.mp3")
        save_donor_photo(donation_id, req.photo)

        with open(mp4_path, "rb") as f:
            video_bytes = f.read()

        return video_bytes

    finally:
        # Cleanup temporary files
        shutil.rmtree(work_dir, ignore_errors=True)

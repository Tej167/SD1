import os
import re
import sys
import asyncio
import aiohttp

# Windows DNS patch: ensure aiohttp uses ThreadedResolver instead of buggy aiodns on Windows
old_init = aiohttp.TCPConnector.__init__
def _patched_connector_init(self, *args, **kwargs):
    kwargs["resolver"] = aiohttp.ThreadedResolver()
    old_init(self, *args, **kwargs)
aiohttp.TCPConnector.__init__ = _patched_connector_init

import edge_tts

# Default Gujarati Voices
# gu-IN-DhwaniNeural (Female, soft devotional)
# gu-IN-NiranjanNeural (Male, deep ceremonial)
DEFAULT_VOICE = "gu-IN-DhwaniNeural"

def build_gujarati_script(name: str, amount: str, purpose: str) -> str:
    """
    Generates a natural, respectful Gujarati announcement script.
    """
    clean_amount = amount.replace("₹", "").replace(",", "").strip()
    # Duplicate "શ્રી" hata do agar naam mein already hai
    clean_name = re.sub(r"^(?:શ્રી\s*)+", "", name.strip())
    # English parenthetical text hata do purpose se (e.g., "અન્નક્ષેત્ર સેવા (Annakshetra)")
    clean_purpose = re.sub(r"\s*\([^)]*\)", "", purpose.strip())
    return (
        f"જય સ્વામિનારાયણ! "
        f"શ્રી {clean_name} તરફથી {clean_purpose} અર્થે રૂપિયા {clean_amount} નું પવિત્ર દાન પ્રાપ્ત થયું છે. "
        f"ભગવાન શ્રી સ્વામિનારાયણ આપના સમગ્ર પરિવાર પર સદા સુખ, શાંતિ અને સમૃદ્ધિની કૃપા વરસાવતા રહે."
    )

async def generate_gujarati_audio(text: str, output_path: str, voice: str = DEFAULT_VOICE) -> str:
    """
    Synthesizes Gujarati speech using Edge-TTS and saves to output_path.
    """
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate="+2%",
        pitch="+0Hz"
    )
    await communicate.save(output_path)
    return output_path

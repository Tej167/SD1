@echo off
title Cloudflare Tunnel for Smart Donation
echo ========================================================
echo  CLOUDFLARE SECURE TUNNEL FOR FASTAPI BACKEND
echo ========================================================
echo Connecting local backend http://127.0.0.1:8000 to public HTTPS...
echo Copy the generated https://*.trycloudflare.com URL into:
echo frontend/.env.local (or your Vercel Project Environment Variables)
echo ========================================================
cloudflared tunnel --url http://127.0.0.1:8000
pause

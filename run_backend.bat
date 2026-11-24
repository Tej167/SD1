@echo off
title Smart Donation Backend (FastAPI)
echo ========================================================
echo  SHREE SWAMINARAYAN MANDIR SMART DONATION BACKEND
echo ========================================================
echo Starting FastAPI microservice on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause

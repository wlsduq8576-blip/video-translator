@echo off
title Video/Audio Translator Server
cd /d "%~dp0"

echo ===================================================
echo  Video/Audio Translator Server starting...
echo  Please do not close this window while using the app.
echo ===================================================

:: Automatically open the web browser
timeout /t 2 /nobreak >nul
start http://localhost:3001

:: Start the Next.js dev server
npm run dev

pause

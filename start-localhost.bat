@echo off
cd /d "%~dp0"
echo AC/DC BILISIM demo baslatiliyor...
echo Yonetim paneli: http://localhost:3017/admin
start "" http://localhost:3017/admin
node server.js
pause

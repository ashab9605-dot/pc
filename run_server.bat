@echo off
title PC STUDIO - Local Server
echo ====================================================
echo   Starting PC STUDIO (Python Flask)...
echo ====================================================
cd /d "%~dp0backend"
python -m pip install -r requirements.txt --quiet
start http://127.0.0.1:5000/
python app.py
pause

#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/backend"
python3 -m pip install -r requirements.txt --quiet || true
echo "Opening http://127.0.0.1:5000/ ..."
python3 app.py

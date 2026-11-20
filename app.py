"""
PC STUDIO — Python Flask Full-Stack Backend Server
Serves index.html, customize.html, admin.html, studio.html and provides:
  - /api/state (GET/POST) : Persistent JSON storage synced across all browsers
  - /api/parse-psd (POST) : Adobe Photoshop (.PSD) layer parser via psd-tools
  - /api/export-hd (POST) : Server-side Ultra-HD >=5MB Lossless PNG renderer
"""

import json
import os
from flask import Flask, jsonify, request, send_from_directory, Response
from poster_engine import parse_psd_bytes, render_poster_pillow

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
STATE_FILE = os.path.join(DATA_DIR, "studio_state.json")
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 120 * 1024 * 1024  # 120 MB max for large PSD files


@app.route("/")
def serve_home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)


@app.route("/api/health")
def api_health():
    return jsonify({"status": "ok", "studio": "PC STUDIO"})


@app.route("/api/state", methods=["GET"])
def get_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify({})


@app.route("/api/state", methods=["POST"])
def save_state():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return jsonify({"status": "saved"})


@app.route("/api/parse-psd", methods=["POST"])
def api_parse_psd():
    if "file" not in request.files:
        return jsonify({"error": "No PSD file uploaded"}), 400
    uploaded = request.files["file"]
    try:
        parsed = parse_psd_bytes(uploaded.read(), uploaded.filename or "Imported.psd")
        return jsonify(parsed)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 422


@app.route("/api/export-hd", methods=["POST"])
def api_export_hd():
    tpl = request.get_json(silent=True)
    if not isinstance(tpl, dict):
        return jsonify({"error": "Invalid template payload"}), 400
    png_bytes = render_poster_pillow(tpl, min_mb=5.2)
    return Response(
        png_bytes,
        mimetype="image/png",
        headers={"Content-Disposition": 'attachment; filename="pc_studio_ultrahd_5mb.png"'},
    )


if __name__ == "__main__":
    print("\n====================================================")
    print("  PC STUDIO — Server Running!")
    print("  Main Website : http://127.0.0.1:5000/")
    print("  Admin Panel  : http://127.0.0.1:5000/admin.html")
    print("  Admin Login  : admin  /  pc@123")
    print("====================================================\n")
    app.run(host="127.0.0.1", port=5000, debug=True)

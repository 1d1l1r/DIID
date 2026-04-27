#!/usr/bin/env bash
# DIID Desktop — macOS build script
# Usage: bash build_mac.sh
# Output: ~/Library/Caches/cargo-targets/diid-desktop/release/bundle/
#
# Prerequisites:
#   - Xcode Command Line Tools: xcode-select --install
#   - Rust: curl https://sh.rustup.rs | sh
#   - Node.js 18+: https://nodejs.org
#   - Python 3.11+: https://python.org (or: brew install python)
#   - PyInstaller: pip3 install pyinstaller

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
DIST_DIR="$SCRIPT_DIR/dist"

# Keep build artifacts outside the project (avoids iCloud Drive issues)
export CARGO_TARGET_DIR="$HOME/Library/Caches/cargo-targets/diid-desktop"

# Ensure Cargo is on PATH
export PATH="$HOME/.cargo/bin:$PATH"

echo ""
echo "==> [1/5] Installing backend dependencies (desktop, no psycopg2)..."
pip3 install -q \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.32.0" \
    "sqlalchemy>=2.0.36" \
    "cryptography>=43.0.0" \
    "argon2-cffi>=23.1.0" \
    "pydantic>=2.10.0" \
    "pydantic-settings>=2.6.0" \
    "python-multipart>=0.0.12" \
    "python-jose[cryptography]>=3.3.0" \
    "passlib[bcrypt]>=1.7.4" \
    "keyring"

pip3 install -q --no-deps -e "$BACKEND_DIR"

echo ""
echo "==> [2/5] Building frontend (desktop mode)..."
cd "$FRONTEND_DIR"
npm install --silent
npx vite build --outDir dist-desktop --mode desktop --emptyOutDir

echo ""
echo "==> [3/5] Building backend sidecar (PyInstaller)..."
rm -rf "$DIST_DIR"
cd "$BACKEND_DIR"
python3 -m PyInstaller \
    --distpath "$DIST_DIR" \
    --workpath "$SCRIPT_DIR/build" \
    --noconfirm \
    "$SCRIPT_DIR/backend.spec"

echo ""
echo "==> [4/5] Generating Tauri icons from logo..."
cd "$SCRIPT_DIR"
npm install --silent
npx tauri icon "$FRONTEND_DIR/public/logo.png"

echo ""
echo "==> [5/5] Building Tauri app..."
cd "$SCRIPT_DIR"
npx tauri build

echo ""
echo "Done! Bundle is in $CARGO_TARGET_DIR/release/bundle/"

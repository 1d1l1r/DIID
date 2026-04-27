# DIID Desktop — Windows build script
# Usage: .\build_win.ps1
# Output: %LOCALAPPDATA%\cargo-targets\diid-desktop\release\bundle\
#
# Prerequisites:
#   - Rust (stable-x86_64-pc-windows-msvc)  https://rustup.rs
#   - VS Build Tools 2022 with C++ workload  https://visualstudio.microsoft.com/visual-cpp-build-tools/
#   - Node.js 18+
#   - Python 3.12 (py launcher)
#   - PyInstaller: pip install pyinstaller

Set-StrictMode -Version Latest
# "Continue" so pip/npm stderr warnings don't abort the script
$ErrorActionPreference = "Continue"

# Required to run .ps1 scripts (e.g. npx) in some environments
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Add Cargo to PATH for this session
$env:PATH += ";$env:USERPROFILE\.cargo\bin"

# Keep Rust build artifacts outside OneDrive to avoid sync locking issues
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\cargo-targets\diid-desktop"

$Root = Split-Path -Parent $PSScriptRoot
$DesktopDir = $PSScriptRoot
$FrontendDir = Join-Path $Root "frontend"
$BackendDir = Join-Path $Root "backend"
$DistDir = Join-Path $DesktopDir "dist"

Write-Host "`n==> [1/5] Installing backend dependencies (desktop, no psycopg2)..." -ForegroundColor Cyan
py -3.12 -m pip install --quiet `
    "fastapi>=0.115.0" `
    "uvicorn[standard]>=0.32.0" `
    "sqlalchemy>=2.0.36" `
    "cryptography>=43.0.0" `
    "argon2-cffi>=23.1.0" `
    "pydantic>=2.10.0" `
    "pydantic-settings>=2.6.0" `
    "python-multipart>=0.0.12" `
    "python-jose[cryptography]>=3.3.0" `
    "passlib[bcrypt]>=1.7.4" `
    "keyring"

# Install the app package itself (no deps, already installed above)
Push-Location $BackendDir
py -3.12 -m pip install --quiet --no-deps -e .
Pop-Location

Write-Host "`n==> [2/5] Building frontend (desktop mode)..." -ForegroundColor Cyan
Push-Location $FrontendDir
npm install --silent
npx vite build --outDir dist-desktop --mode desktop --emptyOutDir
Pop-Location

Write-Host "`n==> [3/5] Building backend sidecar (PyInstaller)..." -ForegroundColor Cyan
# Clean old dist so PyInstaller can replace it
if (Test-Path $DistDir) {
    Get-ChildItem $DistDir -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item $DistDir -Force -Recurse -ErrorAction SilentlyContinue
}
Push-Location $BackendDir
py -3.12 -m PyInstaller `
    --distpath $DistDir `
    --workpath (Join-Path $DesktopDir "build") `
    --noconfirm `
    (Join-Path $DesktopDir "backend.spec")
Pop-Location

Write-Host "`n==> [4/5] Generating Tauri icons from logo..." -ForegroundColor Cyan
Push-Location $DesktopDir
npm install --silent
$LogoSrc = Join-Path $FrontendDir "public\logo.png"
npx tauri icon $LogoSrc
Pop-Location

Write-Host "`n==> [5/5] Building Tauri app..." -ForegroundColor Cyan
Push-Location $DesktopDir
npx tauri build
Pop-Location

Write-Host "`nDone! Installers are in $env:CARGO_TARGET_DIR\release\bundle\" -ForegroundColor Green

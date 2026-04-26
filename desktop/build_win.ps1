# DIID Desktop — Windows build script
# Usage: .\build_win.ps1
# Output: desktop/src-tauri/target/release/bundle/

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$DesktopDir = $PSScriptRoot
$FrontendDir = Join-Path $Root "frontend"
$BackendDir = Join-Path $Root "backend"

Write-Host "`n==> [1/4] Building frontend (desktop mode)..." -ForegroundColor Cyan
Push-Location $FrontendDir
npm install
npx vite build --outDir dist-desktop --mode desktop --emptyOutDir
Pop-Location

Write-Host "`n==> [2/4] Building backend sidecar (PyInstaller)..." -ForegroundColor Cyan
Push-Location $BackendDir
py -3.12 -m PyInstaller `
    --distpath (Join-Path $DesktopDir "dist") `
    --workpath (Join-Path $DesktopDir "build") `
    --noconfirm `
    (Join-Path $DesktopDir "backend.spec")
Pop-Location

Write-Host "`n==> [3/4] Generating Tauri icons from logo..." -ForegroundColor Cyan
Push-Location $DesktopDir
npm install
$LogoSrc = Join-Path $FrontendDir "public\logo.png"
npx tauri icon $LogoSrc
Pop-Location

Write-Host "`n==> [4/4] Building Tauri app..." -ForegroundColor Cyan
Push-Location $DesktopDir
npx tauri build
Pop-Location

Write-Host "`n✓ Done! Installer is in desktop/src-tauri/target/release/bundle/" -ForegroundColor Green

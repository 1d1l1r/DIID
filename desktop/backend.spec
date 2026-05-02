# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the DIID desktop backend sidecar."""

import os
from PyInstaller.utils.hooks import collect_all, collect_submodules

backend_dir = os.path.abspath(os.path.join(SPECPATH, '..', 'backend'))

# Collect everything from the app package
app_datas, app_binaries, app_hiddenimports = collect_all('app')

frontend_dist = os.path.abspath(os.path.join(SPECPATH, '..', 'frontend', 'dist-desktop'))

datas = [
    (os.path.join(backend_dir, 'app'), 'app'),
    (frontend_dist, 'frontend_dist'),
    *app_datas,
]

hiddenimports = [
    *app_hiddenimports,
    *collect_submodules('app'),
    *collect_submodules('sqlalchemy'),
    *collect_submodules('uvicorn'),
    *collect_submodules('fastapi'),
    *collect_submodules('passlib'),
    *collect_submodules('jose'),
    *collect_submodules('cryptography'),
    *collect_submodules('keyring'),
    *collect_submodules('jaraco'),
    'keyring.backends.Windows',
    'keyring.backends.fail',
    'jose',
    'jose.jwt',
    'jose.exceptions',
    'passlib.handlers.bcrypt',
    'passlib.handlers.argon2',
]

a = Analysis(
    [os.path.join(SPECPATH, 'backend_runner.py')],
    pathex=[backend_dir],
    binaries=app_binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'PIL', 'cv2'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='diid-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # no terminal window
    icon=os.path.join(SPECPATH, 'src-tauri', 'icons', 'icon.ico'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='diid-backend',
)

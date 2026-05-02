; DIID custom uninstall macro — included by Tauri NSIS template
; Kills running processes and optionally removes vault data.

!macro customUninstall
  ; Kill backend and frontend processes before uninstalling files
  nsExec::ExecToLog 'taskkill /F /IM diid-backend.exe /T'
  nsExec::ExecToLog 'taskkill /F /IM diid-desktop.exe /T'

  ; Offer to delete vault data (DB, uploads, encryption key)
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Delete all DIID vault data?$\n$\nThis removes your database, uploaded files, and encryption key.$\nThis cannot be undone." \
    IDNO +2
  RMDir /r "$APPDATA\DIID"
!macroend

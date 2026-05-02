import { usePrivacyScreen } from '../../hooks/usePrivacyScreen'

export function PrivacyScreen() {
  const hidden = usePrivacyScreen()

  if (!hidden) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img src="/logo.png" alt="" style={{ width: 64, height: 64, opacity: 0.3 }} />
    </div>
  )
}

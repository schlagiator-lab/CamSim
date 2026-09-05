import type { SunSettings } from '../utils/sunSettings'

interface Props {
  open: boolean
  settings: SunSettings
  onChange: (next: SunSettings) => void
  onClose: () => void
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'DM Mono', textTransform: 'uppercase', color: '#555', fontSize: 9, letterSpacing: 2, marginBottom: 4,
}

export default function SunSheet({ open, settings, onChange, onClose }: Props) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 200,
        background: '#0a0a10',
        borderTop: '1px solid #2a2a3e',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px' }}>
        <span style={{ fontFamily: 'Orbitron', color: '#444', fontSize: 9, letterSpacing: 2 }}>SOLEIL</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24 }}
        >×</button>
      </div>

      <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={labelStyle}>DIRECTION — {Math.round(settings.angleDeg)}°</div>
          <input
            type="range" min={0} max={359} step={1}
            value={settings.angleDeg}
            onChange={e => onChange({ ...settings, angleDeg: parseInt(e.target.value, 10) })}
            style={{ width: '100%', accentColor: '#00d4ff', margin: 0 }}
          />
        </div>
        <div>
          <div style={labelStyle}>INTENSITÉ — {Math.round(settings.strength * 100)}%</div>
          <input
            type="range" min={0} max={100} step={1}
            value={Math.round(settings.strength * 100)}
            onChange={e => onChange({ ...settings, strength: parseInt(e.target.value, 10) / 100 })}
            style={{ width: '100%', accentColor: '#00d4ff', margin: 0 }}
          />
        </div>
      </div>
    </div>
  )
}

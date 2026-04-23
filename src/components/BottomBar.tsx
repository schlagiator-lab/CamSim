import type { PlacedCamera } from '../types'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'

export type BottomMode = 'idle' | 'cam-select' | 'armed' | 'cam-selected'

export function getBarHeight(mode: BottomMode): number {
  if (mode === 'cam-select') return 152
  if (mode === 'cam-selected') return 132
  return 60
}

interface Props {
  mode: BottomMode
  selectedCamera: PlacedCamera | null
  canExport: boolean
  onOpenPanel: () => void
  onClosePanel: () => void
  onSelectCamera: (id: string) => void
  onCancelArmed: () => void
  onRotate: (id: string, deg: number) => void
  onResize: (id: string, scale: number) => void
  onDelete: (id: string) => void
  onExport: () => void
}

const DIRS = [
  { a: '↖', d: 225 }, { a: '↑', d: 270 }, { a: '↗', d: 315 },
  { a: '←', d: 180 }, { a: null, d: null }, { a: '→', d: 0 },
  { a: '↙', d: 135 }, { a: '↓', d: 90 },  { a: '↘', d: 45 },
] as const

const base: React.CSSProperties = {
  background: 'rgba(9,9,13,0.97)',
  borderTop: '1px solid #191921',
  flexShrink: 0,
}

const btn = (color: string): React.CSSProperties => ({
  background: 'transparent',
  border: `1px solid ${color}`,
  borderRadius: 6,
  color,
  fontFamily: 'Orbitron',
  fontSize: 9,
  padding: '7px 12px',
  cursor: 'pointer',
  letterSpacing: 1,
})

const exportBtn: React.CSSProperties = {
  background: '#00d4ff',
  border: 'none',
  borderRadius: 6,
  color: '#000',
  fontFamily: 'Orbitron',
  fontSize: 9,
  padding: '7px 12px',
  cursor: 'pointer',
  letterSpacing: 1,
  fontWeight: 700,
}

export default function BottomBar({
  mode, selectedCamera, canExport,
  onOpenPanel, onClosePanel, onSelectCamera, onCancelArmed,
  onRotate, onResize, onDelete, onExport,
}: Props) {
  const selCam = selectedCamera ? cameras.find(c => c.id === selectedCamera.cameraId) : null

  /* ── idle ── */
  if (mode === 'idle') {
    return (
      <div style={{ ...base, height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
        <button
          onClick={onOpenPanel}
          style={{
            flex: 1, height: 38,
            background: 'transparent',
            border: '1px dashed #282834',
            borderRadius: 8,
            color: '#00d4ff',
            fontFamily: 'Orbitron',
            fontSize: 10,
            letterSpacing: 2,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#00d4ff'; t.style.background = 'rgba(0,212,255,0.05)' }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = '#282834'; t.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          AJOUTER UNE CAMÉRA
        </button>
        {canExport && <button style={exportBtn} onClick={onExport}>EXPORTER</button>}
      </div>
    )
  }

  /* ── cam-select ── */
  if (mode === 'cam-select') {
    return (
      <div style={{ ...base, height: 152, display: 'flex', flexDirection: 'column', padding: '10px 20px 8px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Orbitron', color: '#444', fontSize: 9, letterSpacing: 2 }}>CHOISIR UNE CAMÉRA</span>
          <button
            onClick={onClosePanel}
            style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24 }}
          >×</button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {cameras.map(cam => {
            const asp = cam.realWidth / cam.realHeight
            const previewH = 52
            const previewW = asp >= 1 ? previewH * asp : previewH
            const pw = asp >= 1 ? Math.min(previewW, 84) : previewH * asp
            const ph = asp >= 1 ? pw / asp : previewH
            return (
              <button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id)}
                style={{
                  flexShrink: 0, width: 96,
                  background: '#0f0f14',
                  border: '1px solid #222232',
                  borderRadius: 8,
                  padding: '7px 5px 6px',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#00d4ff'; t.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = '#222232'; t.style.background = '#0f0f14' }}
              >
                <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CameraShape type={cam.type} width={pw} height={ph} />
                </div>
                <div style={{ fontFamily: 'DM Mono', color: '#ccc', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{cam.brand}</div>
                <div style={{ fontFamily: 'DM Mono', color: '#444', fontSize: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{cam.model}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── armed ── */
  if (mode === 'armed') {
    return (
      <div style={{ ...base, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', gap: 16 }}>
        <span style={{ fontFamily: 'DM Mono', color: '#00d4ff', fontSize: 10, letterSpacing: 1 }}>
          → Cliquez sur la photo pour placer la caméra
        </span>
        <button onClick={onCancelArmed} style={btn('#444')}>ANNULER</button>
      </div>
    )
  }

  /* ── cam-selected ── */
  if (mode === 'cam-selected' && selectedCamera && selCam) {
    return (
      <div style={{ ...base, height: 132, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14 }}>

        {/* Compass 3×3 */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Orbitron', color: '#383848', fontSize: 8, letterSpacing: 2, marginBottom: 4 }}>ORIENTATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 28px)', gap: 2 }}>
            {DIRS.map((d, i) => {
              if (d.a === null) {
                return (
                  <div key={i} style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono', fontSize: 8, color: '#383848' }}>
                    {selectedCamera.rotation}°
                  </div>
                )
              }
              const active = selectedCamera.rotation === d.d
              return (
                <button
                  key={i}
                  onClick={() => onRotate(selectedCamera.id, d.d as number)}
                  style={{
                    height: 28,
                    background: active ? 'rgba(0,212,255,0.14)' : '#14141c',
                    border: `1px solid ${active ? '#00d4ff' : '#22222e'}`,
                    borderRadius: 4,
                    color: active ? '#00d4ff' : '#505060',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >{d.a}</button>
              )
            })}
          </div>
        </div>

        <div style={{ width: 1, height: 96, background: '#1a1a24', flexShrink: 0 }} />

        {/* Sliders */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontFamily: 'Orbitron', color: '#383848', fontSize: 8, letterSpacing: 2 }}>TAILLE</span>
            <span style={{ fontFamily: 'DM Mono', color: '#00d4ff', fontSize: 9 }}>{selectedCamera.scale.toFixed(2)}×</span>
          </div>
          <input
            type="range" min={0.2} max={3} step={0.05}
            value={selectedCamera.scale}
            onChange={e => onResize(selectedCamera.id, parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#00d4ff', margin: 0 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 2 }}>
            <span style={{ fontFamily: 'Orbitron', color: '#383848', fontSize: 8, letterSpacing: 2 }}>ROTATION</span>
            <span style={{ fontFamily: 'DM Mono', color: '#00d4ff', fontSize: 9 }}>{selectedCamera.rotation}°</span>
          </div>
          <input
            type="range" min={-180} max={180}
            value={selectedCamera.rotation}
            onChange={e => onRotate(selectedCamera.id, parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#00d4ff', margin: 0 }}
          />
        </div>

        <div style={{ width: 1, height: 96, background: '#1a1a24', flexShrink: 0 }} />

        {/* Actions */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <button style={btn('#00d4ff')} onClick={onOpenPanel}>+ CAMÉRA</button>
          <button style={btn('#ff3333')} onClick={() => onDelete(selectedCamera.id)}>SUPPRIMER</button>
          {canExport && <button style={exportBtn} onClick={onExport}>EXPORTER</button>}
        </div>

      </div>
    )
  }

  return null
}

import type { PlacedCamera } from '../types'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'

export type BottomMode = 'idle' | 'cam-select' | 'armed' | 'cam-edit-list' | 'cam-selected'

export function getBarHeight(mode: BottomMode): number {
  if (mode === 'cam-select') return 152
  if (mode === 'cam-edit-list') return 152
  if (mode === 'cam-selected') return 150
  if (mode === 'idle') return 66
  return 60 // armed
}

interface Props {
  mode: BottomMode
  placedCameras: PlacedCamera[]
  selectedCamera: PlacedCamera | null
  canExport: boolean
  onOpenPanel: () => void
  onClosePanel: () => void
  onOpenEditList: () => void
  onCloseEditList: () => void
  onSelectCamera: (id: string) => void
  onSelectForEdit: (id: string) => void
  onCancelArmed: () => void
  onDeselect: () => void
  onRotate: (id: string, deg: number) => void
  onResize: (id: string, scale: number) => void
  onDelete: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
  onToggleLabel: (id: string) => void
  onExport: () => void
}

const DIRS = [
  { a: '↖', d: 225 }, { a: '↑', d: 270 }, { a: '↗', d: 315 },
  { a: '←', d: 180 }, { a: null, d: null }, { a: '→', d: 0 },
  { a: '↙', d: 135 }, { a: '↓', d: 90 },  { a: '↘', d: 45 },
] as const

const base: React.CSSProperties = {
  background: '#0a0a10',
  borderTop: '1px solid #2a2a3e',
  flexShrink: 0,
}

const btn = (color: string): React.CSSProperties => ({
  background: 'transparent',
  border: `1px solid ${color}`,
  borderRadius: 6,
  color,
  fontFamily: 'Orbitron',
  fontSize: 9,
  padding: '5px 10px',
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
  padding: '5px 10px',
  cursor: 'pointer',
  letterSpacing: 1,
  fontWeight: 700,
}

const safeH = (px: number) =>
  `calc(${px}px + env(safe-area-inset-bottom, 0px))` as const

export default function BottomBar({
  mode, placedCameras, selectedCamera, canExport,
  onOpenPanel, onClosePanel, onOpenEditList, onCloseEditList,
  onSelectCamera, onSelectForEdit, onCancelArmed, onDeselect,
  onRotate, onResize, onDelete, onUpdateLabel, onToggleLabel, onExport,
}: Props) {
  const selCam = selectedCamera ? cameras.find(c => c.id === selectedCamera.cameraId) : null
  const hasCameras = placedCameras.length > 0

  /* ── idle : deux onglets ── */
  if (mode === 'idle') {
    const tabStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
      flex: 1,
      height: 48,
      background: active ? 'rgba(0,212,255,0.10)' : disabled ? 'transparent' : 'rgba(0,212,255,0.04)',
      border: `1px solid ${active ? '#00d4ff' : disabled ? 'rgba(0,212,255,0.10)' : 'rgba(0,212,255,0.28)'}`,
      borderRadius: 8,
      color: disabled ? 'rgba(0,212,255,0.22)' : '#00d4ff',
      fontFamily: 'Orbitron',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      padding: '4px 6px',
      pointerEvents: disabled ? 'none' as const : 'auto' as const,
    })
    return (
      <div style={{ ...base, height: safeH(66), paddingBottom: 'env(safe-area-inset-bottom, 0px)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
        <button
          onClick={onOpenPanel}
          style={tabStyle(false, false)}
          onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#00d4ff'; t.style.background = 'rgba(0,212,255,0.14)' }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = 'rgba(0,212,255,0.28)'; t.style.background = 'rgba(0,212,255,0.04)' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span>
          <span style={{ fontSize: 7.5, letterSpacing: 1.5, lineHeight: 1 }}>AJOUTER UNE CAMÉRA</span>
        </button>
        <button
          onClick={hasCameras ? onOpenEditList : undefined}
          style={tabStyle(false, !hasCameras)}
          onMouseEnter={e => { if (!hasCameras) return; const t = e.currentTarget; t.style.borderColor = '#00d4ff'; t.style.background = 'rgba(0,212,255,0.14)' }}
          onMouseLeave={e => { if (!hasCameras) return; const t = e.currentTarget; t.style.borderColor = 'rgba(0,212,255,0.28)'; t.style.background = 'rgba(0,212,255,0.04)' }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>✎</span>
          <span style={{ fontSize: 7.5, letterSpacing: 1.5, lineHeight: 1 }}>MODIFIER UNE CAMÉRA</span>
        </button>
        {canExport && (
          <button style={{ ...exportBtn, height: 48, padding: '5px 12px', flexShrink: 0 }} onClick={onExport}>
            EXPORTER
          </button>
        )}
      </div>
    )
  }

  /* ── cam-select : choix du modèle ── */
  if (mode === 'cam-select') {
    return (
      <div style={{ ...base, height: 152, display: 'flex', flexDirection: 'column', padding: '10px 20px 8px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Orbitron', color: '#444', fontSize: 9, letterSpacing: 2 }}>CHOISIR UN MODÈLE</span>
          <button
            onClick={onClosePanel}
            style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24 }}
          >×</button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {cameras.map(cam => {
            const asp = cam.realWidth / cam.realHeight
            const ph = 52
            const pw = asp >= 1 ? Math.min(ph * asp, 84) : ph * asp
            const finalH = asp >= 1 ? pw / asp : ph
            return (
              <button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id)}
                style={{
                  flexShrink: 0, width: 96,
                  background: '#0f0f14', border: '1px solid #222232', borderRadius: 8,
                  padding: '7px 5px 6px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#00d4ff'; t.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = '#222232'; t.style.background = '#0f0f14' }}
              >
                <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CameraShape type={cam.type} width={pw} height={finalH} />
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

  /* ── armed : attente du clic ── */
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

  /* ── cam-edit-list : sélection de la caméra à modifier ── */
  if (mode === 'cam-edit-list') {
    return (
      <div style={{ ...base, height: 152, display: 'flex', flexDirection: 'column', padding: '10px 20px 8px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Orbitron', color: '#444', fontSize: 9, letterSpacing: 2 }}>SÉLECTIONNER UNE CAMÉRA</span>
          <button
            onClick={onCloseEditList}
            style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24 }}
          >×</button>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {placedCameras.map((placed, idx) => {
            const cam = cameras.find(c => c.id === placed.cameraId)
            if (!cam) return null
            const asp = cam.realWidth / cam.realHeight
            const ph = 48
            const pw = asp >= 1 ? Math.min(ph * asp, 80) : ph * asp
            const finalH = asp >= 1 ? pw / asp : ph
            return (
              <button
                key={placed.id}
                onClick={() => onSelectForEdit(placed.id)}
                style={{
                  flexShrink: 0, width: 96,
                  background: '#0f0f14', border: '1px solid #222232', borderRadius: 8,
                  padding: '7px 5px 6px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#00d4ff'; t.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = '#222232'; t.style.background = '#0f0f14' }}
              >
                <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CameraShape type={cam.type} width={pw} height={finalH} />
                </div>
                <div style={{ fontFamily: 'DM Mono', color: '#ccc', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{cam.brand}</div>
                <div style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 8, textAlign: 'center' }}>#{idx + 1}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── cam-selected : édition ── */
  if (mode === 'cam-selected' && selectedCamera && selCam) {
    return (
      <div style={{ ...base, height: 150, display: 'flex', flexDirection: 'column', padding: '8px 20px', gap: 6 }}>

        {/* Ligne principale : boussole + sliders + actions */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 14 }}>

          {/* Boussole 3×3 */}
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

          <div style={{ width: 1, alignSelf: 'stretch', background: '#1a1a24', flexShrink: 0 }} />

          {/* Sliders taille + rotation */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 }}>
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

          <div style={{ width: 1, alignSelf: 'stretch', background: '#1a1a24', flexShrink: 0 }} />

          {/* Actions */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button style={btn('#555')} onClick={onDeselect}>← RETOUR</button>
            <button style={btn('#ff3333')} onClick={() => onDelete(selectedCamera.id)}>SUPPRIMER</button>
            {canExport && <button style={exportBtn} onClick={onExport}>EXPORTER</button>}
          </div>

        </div>

        {/* Ligne étiquette */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26 }}>
          <span style={{ fontFamily: 'Orbitron', color: '#383848', fontSize: 7.5, letterSpacing: 2, flexShrink: 0 }}>ÉTIQUETTE</span>
          <input
            type="text"
            value={selectedCamera.label}
            placeholder={`${selCam.brand} ${selCam.model}`}
            onChange={e => onUpdateLabel(selectedCamera.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1,
              background: '#14141c',
              border: '1px solid #2a2a3e',
              borderRadius: 4,
              color: '#ccc',
              fontFamily: 'DM Mono',
              fontSize: 9,
              padding: '4px 8px',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            onClick={() => onToggleLabel(selectedCamera.id)}
            title={selectedCamera.showLabel ? "Masquer l'étiquette" : "Afficher l'étiquette"}
            style={{
              flexShrink: 0,
              background: selectedCamera.showLabel ? 'rgba(0,212,255,0.10)' : 'transparent',
              border: `1px solid ${selectedCamera.showLabel ? 'rgba(0,212,255,0.4)' : '#333'}`,
              borderRadius: 4,
              color: selectedCamera.showLabel ? '#00d4ff' : '#444',
              fontFamily: 'Orbitron',
              fontSize: 7.5,
              letterSpacing: 1,
              padding: '4px 8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedCamera.showLabel ? 'VISIBLE' : 'MASQUÉ'}
          </button>
        </div>

      </div>
    )
  }

  return null
}

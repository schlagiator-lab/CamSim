import type { PlacedCamera } from '../types'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'

interface Props {
  armedCameraId: string | null
  onArmCamera: (id: string | null) => void
  selectedCamera: PlacedCamera | null
  onRotate: (id: string, deg: number) => void
  onResize: (id: string, scale: number) => void
  onDelete: (id: string) => void
}

const DIRECTIONS = [
  { arrow: '↖', deg: 225 }, { arrow: '↑', deg: 270 }, { arrow: '↗', deg: 315 },
  { arrow: '←', deg: 180 }, { arrow: null, deg: null },   { arrow: '→', deg: 0 },
  { arrow: '↙', deg: 135 }, { arrow: '↓', deg: 90 },  { arrow: '↘', deg: 45 },
] as const

const S = {
  panel: {
    width: 196,
    flexShrink: 0 as const,
    background: '#0f0f14',
    borderLeft: '1px solid #191921',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflowY: 'auto' as const,
  },
  sectionLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    letterSpacing: 2,
    color: '#555',
    padding: '10px 12px 6px',
  },
  divider: {
    height: 1,
    background: '#191921',
    margin: '0 0',
  },
}

export default function Sidebar({ armedCameraId, onArmCamera, selectedCamera, onRotate, onResize, onDelete }: Props) {
  const selCam = selectedCamera ? cameras.find(c => c.id === selectedCamera.cameraId) : null

  return (
    <aside style={S.panel}>
      <div style={S.sectionLabel}>CAMÉRAS</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px 8px' }}>
        {cameras.map(cam => {
          const armed = armedCameraId === cam.id
          const aspect = cam.realWidth / cam.realHeight
          const ph = 34
          const pw = Math.min(ph * aspect, 80)
          const pw2 = aspect >= 1 ? ph : ph * aspect
          const ph2 = aspect >= 1 ? ph / aspect : ph
          return (
            <button
              key={cam.id}
              onClick={() => onArmCamera(armed ? null : cam.id)}
              style={{
                background: armed ? 'rgba(0,212,255,0.09)' : '#141418',
                border: `1px solid ${armed ? '#00d4ff' : '#222230'}`,
                borderRadius: 7,
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ width: 44, height: ph, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CameraShape type={cam.type} width={pw2} height={ph2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Mono', color: armed ? '#00d4ff' : '#d0d0d0', fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cam.brand}
                </div>
                <div style={{ fontFamily: 'DM Mono', color: armed ? '#00d4ff88' : '#666', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cam.model}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {armedCameraId && (
        <div style={{ padding: '4px 12px 6px', textAlign: 'center' }}>
          <span style={{ fontFamily: 'DM Mono', color: '#00d4ff', fontSize: 9, letterSpacing: 1 }}>
            Cliquez sur la photo pour placer
          </span>
        </div>
      )}

      <div style={S.divider}/>

      {selectedCamera && selCam ? (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'Orbitron', fontSize: 9, letterSpacing: 2, color: '#00d4ff' }}>SÉLECTION</div>

          <div>
            <div style={{ fontFamily: 'DM Mono', color: '#e0e0e0', fontSize: 10, fontWeight: 500 }}>{selCam.brand}</div>
            <div style={{ fontFamily: 'DM Mono', color: '#666', fontSize: 9 }}>{selCam.model}</div>
          </div>

          {/* Scale slider */}
          <div>
            <div style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 9, marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
              <span>TAILLE</span>
              <span style={{ color: '#00d4ff' }}>{selectedCamera.scale.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0.2} max={3} step={0.05}
              value={selectedCamera.scale}
              onChange={e => onResize(selectedCamera.id, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#00d4ff', margin: 0 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono', fontSize: 8, color: '#444', marginTop: 2 }}>
              <span>0.2×</span>
              <span>3×</span>
            </div>
          </div>

          {/* 8-direction orientation grid */}
          <div>
            <div style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 9, marginBottom: 5 }}>ORIENTATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {DIRECTIONS.map((d, i) => {
                if (d.arrow === null) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28, fontFamily: 'DM Mono', fontSize: 8, color: '#444' }}>
                      {selectedCamera.rotation}°
                    </div>
                  )
                }
                const active = selectedCamera.rotation === d.deg
                return (
                  <button
                    key={i}
                    onClick={() => onRotate(selectedCamera.id, d.deg as number)}
                    style={{
                      background: active ? 'rgba(0,212,255,0.15)' : '#191921',
                      border: `1px solid ${active ? '#00d4ff' : '#2a2a3a'}`,
                      borderRadius: 4,
                      color: active ? '#00d4ff' : '#666',
                      fontSize: 14,
                      height: 28,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    {d.arrow}
                  </button>
                )
              })}
            </div>
            {/* Fine rotation slider */}
            <input
              type="range"
              min={-180} max={180}
              value={selectedCamera.rotation}
              onChange={e => onRotate(selectedCamera.id, parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#00d4ff', marginTop: 6 }}
            />
          </div>

          <button
            onClick={() => onDelete(selectedCamera.id)}
            style={{
              background: 'transparent',
              border: '1px solid #ff3333',
              borderRadius: 6,
              color: '#ff3333',
              fontFamily: 'Orbitron',
              fontSize: 9,
              padding: '7px',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
            }}
          >
            SUPPRIMER
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px', fontFamily: 'DM Mono', color: '#333', fontSize: 9, textAlign: 'center' }}>
          Sélectionnez une caméra placée
        </div>
      )}
    </aside>
  )
}

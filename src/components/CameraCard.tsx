import type { Camera } from '../types'
import CameraShape from './CameraShape'

interface Props {
  camera: Camera
  armed: boolean
  onArm: () => void
}

const PREVIEW_SIZE = 36

export default function CameraCard({ camera, armed, onArm }: Props) {
  const aspect = camera.realWidth / camera.realHeight
  const pw = aspect >= 1 ? PREVIEW_SIZE : PREVIEW_SIZE * aspect
  const ph = aspect >= 1 ? PREVIEW_SIZE / aspect : PREVIEW_SIZE

  return (
    <button
      onClick={onArm}
      style={{
        background: armed ? 'rgba(0,212,255,0.08)' : '#191921',
        border: `1px solid ${armed ? '#00d4ff' : '#2a2a3a'}`,
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CameraShape type={camera.type} color={camera.color} width={pw} height={ph} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Mono', color: armed ? '#00d4ff' : '#e0e0e0', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {camera.brand}
        </div>
        <div style={{ fontFamily: 'DM Mono', color: armed ? '#00d4ff99' : '#888', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {camera.model}
        </div>
        <div style={{ fontFamily: 'Orbitron', color: '#555', fontSize: 9, marginTop: 2, letterSpacing: 1 }}>
          {camera.realWidth}×{camera.realHeight}mm
        </div>
      </div>
    </button>
  )
}

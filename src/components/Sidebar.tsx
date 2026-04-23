import type { PlacedCamera, CalibrationData } from '../types'
import { cameras } from '../data/cameras'
import CameraCard from './CameraCard'

interface Props {
  armedCameraId: string | null
  onArmCamera: (id: string | null) => void
  calibration: CalibrationData | null
  calibState: string
  onStartCalib: () => void
  onResetCalib: () => void
  selectedCamera: PlacedCamera | null
  onRotate: (id: string, deg: number) => void
  onDelete: (id: string) => void
  canExport: boolean
  onExport: () => void
}

export default function Sidebar({
  armedCameraId,
  onArmCamera,
  calibration,
  calibState,
  onStartCalib,
  onResetCalib,
  selectedCamera,
  onRotate,
  onDelete,
  canExport,
  onExport,
}: Props) {
  const selCam = selectedCamera ? cameras.find(c => c.id === selectedCamera.cameraId) : null

  const label = (txt: string, color = '#555') => (
    <p style={{ fontFamily: 'Orbitron', fontSize: 9, letterSpacing: 2, color, marginBottom: 8 }}>{txt}</p>
  )

  const divider = () => <div style={{ height: 1, background: '#191921', margin: '16px 0' }} />

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: '#0f0f14',
      borderRight: '1px solid #191921',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflowY: 'auto',
      padding: '16px 12px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'Orbitron', fontSize: 16, color: '#00d4ff', letterSpacing: 3, margin: 0 }}>CAMSIM</p>
        <p style={{ fontFamily: 'DM Mono', fontSize: 9, color: '#333', margin: '2px 0 0', letterSpacing: 1 }}>camera placement tool</p>
      </div>

      {/* Calibration */}
      {label('CALIBRATION', calibration ? '#00d4ff' : '#ff6b00')}
      {calibration ? (
        <div style={{ background: '#191921', borderRadius: 6, padding: '8px 10px', marginBottom: 8 }}>
          <p style={{ fontFamily: 'DM Mono', color: '#00d4ff', fontSize: 10, margin: 0 }}>
            {calibration.pixelsPerMm.toFixed(2)} px/mm
          </p>
          <p style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 9, margin: '2px 0 0' }}>
            réf: {calibration.distanceMm}mm
          </p>
        </div>
      ) : (
        <p style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 10, marginBottom: 8 }}>
          {calibState === 'picking1' ? 'Cliquez le point 1…'
            : calibState === 'picking2' ? 'Cliquez le point 2…'
            : 'Non calibrée'}
        </p>
      )}
      <button
        onClick={calibration ? onResetCalib : onStartCalib}
        disabled={calibState === 'picking1' || calibState === 'picking2' || calibState === 'modal'}
        style={{
          background: 'transparent',
          border: `1px solid ${calibration ? '#2a2a3a' : '#ff6b00'}`,
          borderRadius: 6,
          color: calibration ? '#555' : '#ff6b00',
          fontFamily: 'Orbitron',
          fontSize: 9,
          padding: '8px',
          cursor: 'pointer',
          letterSpacing: 1,
          width: '100%',
          marginBottom: 4,
        }}
      >
        {calibration ? 'RECALIBRER' : 'CALIBRER'}
      </button>

      {divider()}

      {/* Camera catalog */}
      {label('CAMÉRAS')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {cameras.map(cam => (
          <CameraCard
            key={cam.id}
            camera={cam}
            armed={armedCameraId === cam.id}
            onArm={() => onArmCamera(armedCameraId === cam.id ? null : cam.id)}
          />
        ))}
      </div>

      {calibration && armedCameraId && (
        <p style={{ fontFamily: 'DM Mono', color: '#ff6b00', fontSize: 9, textAlign: 'center', marginTop: 4, letterSpacing: 1 }}>
          Cliquez sur la photo pour placer
        </p>
      )}
      {!calibration && armedCameraId && (
        <p style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 9, textAlign: 'center', marginTop: 4 }}>
          Calibrez d'abord l'image
        </p>
      )}

      {divider()}

      {/* Selected camera controls */}
      {selectedCamera && selCam && (
        <>
          {label('CAMÉRA SÉLECTIONNÉE', '#00d4ff')}
          <p style={{ fontFamily: 'DM Mono', color: '#e0e0e0', fontSize: 10, marginBottom: 12 }}>
            {selCam.brand} {selCam.model}
          </p>

          <p style={{ fontFamily: 'DM Mono', color: '#555', fontSize: 9, marginBottom: 6 }}>
            Rotation: {selectedCamera.rotation}°
          </p>
          <input
            type="range"
            min={-180} max={180}
            value={selectedCamera.rotation}
            onChange={e => onRotate(selectedCamera.id, parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#00d4ff', marginBottom: 8 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
            {[0, 90, -90, 180].map(deg => (
              <button
                key={deg}
                onClick={() => onRotate(selectedCamera.id, deg)}
                style={{
                  background: selectedCamera.rotation === deg ? 'rgba(0,212,255,0.1)' : '#191921',
                  border: `1px solid ${selectedCamera.rotation === deg ? '#00d4ff' : '#2a2a3a'}`,
                  borderRadius: 4,
                  color: selectedCamera.rotation === deg ? '#00d4ff' : '#666',
                  fontFamily: 'Orbitron',
                  fontSize: 9,
                  padding: '6px 4px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                {deg}°
              </button>
            ))}
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
              padding: '8px',
              cursor: 'pointer',
              letterSpacing: 1,
              width: '100%',
              marginBottom: 4,
            }}
          >
            SUPPRIMER
          </button>
          {divider()}
        </>
      )}

      {/* Export */}
      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={onExport}
          disabled={!canExport}
          style={{
            background: canExport ? '#00d4ff' : '#191921',
            border: 'none',
            borderRadius: 6,
            color: canExport ? '#000' : '#333',
            fontFamily: 'Orbitron',
            fontSize: 10,
            padding: '10px',
            cursor: canExport ? 'pointer' : 'not-allowed',
            letterSpacing: 2,
            width: '100%',
            fontWeight: 700,
          }}
        >
          EXPORTER
        </button>
      </div>
    </aside>
  )
}

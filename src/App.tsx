import { useState } from 'react'
import { useImageLoader } from './hooks/useImageLoader'
import { usePlacement } from './hooks/usePlacement'
import { exportImage } from './utils/exportImage'
import UploadZone from './components/UploadZone'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'

export default function App() {
  const { imageData, loadImage } = useImageLoader()
  const {
    placedCameras, selectedId, setSelectedId,
    placeCamera, moveCamera, rotateCamera, resizeCamera, deleteCamera,
  } = usePlacement()

  const [armedCameraId, setArmedCameraId] = useState<string | null>(null)

  const selectedCamera = placedCameras.find(p => p.id === selectedId) ?? null

  const handleCanvasClick = (xPct: number, yPct: number) => {
    if (armedCameraId) {
      placeCamera(armedCameraId, xPct, yPct)
      return
    }
    setSelectedId(null)
  }

  const canExport = !!imageData && placedCameras.length > 0

  const handleExport = async () => {
    if (!imageData) return
    await exportImage(imageData, placedCameras)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0d0d0f' }}>
      {/* Header */}
      <header style={{
        height: 48,
        flexShrink: 0,
        background: '#0f0f14',
        borderBottom: '1px solid #191921',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 15, color: '#00d4ff', letterSpacing: 3 }}>CAMSIM</span>
        <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: '#2a2a3a', letterSpacing: 1 }}>camera placement tool</span>
        <div style={{ flex: 1 }}/>
        {armedCameraId && (
          <span style={{ fontFamily: 'DM Mono', fontSize: 9, color: '#00d4ff', letterSpacing: 1, animation: 'pulse 1.5s infinite' }}>
            Cliquez sur la photo pour placer
          </span>
        )}
        <label style={{
          cursor: 'pointer',
          fontFamily: 'Orbitron',
          fontSize: 9,
          letterSpacing: 2,
          color: '#888',
          border: '1px solid #2a2a3a',
          borderRadius: 6,
          padding: '7px 14px',
          transition: 'border-color 0.15s, color 0.15s',
        }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#555'; (e.target as HTMLElement).style.color = '#ccc' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2a2a3a'; (e.target as HTMLElement).style.color = '#888' }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && loadImage(e.target.files[0])}
          />
          IMPORTER
        </label>
        <button
          onClick={handleExport}
          disabled={!canExport}
          style={{
            background: canExport ? '#00d4ff' : '#191921',
            border: 'none',
            borderRadius: 6,
            color: canExport ? '#000' : '#333',
            fontFamily: 'Orbitron',
            fontSize: 9,
            padding: '7px 14px',
            cursor: canExport ? 'pointer' : 'not-allowed',
            letterSpacing: 2,
            fontWeight: 700,
          }}
        >
          EXPORTER
        </button>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <main style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: imageData ? 0 : 24,
        }}>
          {!imageData ? (
            <div style={{ width: '100%', maxWidth: 480 }}>
              <UploadZone onImageLoad={loadImage} />
            </div>
          ) : (
            <Workspace
              imageData={imageData}
              placedCameras={placedCameras}
              selectedId={selectedId}
              armedCameraId={armedCameraId}
              onCanvasClick={handleCanvasClick}
              onSelectCamera={setSelectedId}
              onMoveCamera={moveCamera}
              onResizeCamera={resizeCamera}
            />
          )}
        </main>

        <Sidebar
          armedCameraId={armedCameraId}
          onArmCamera={setArmedCameraId}
          selectedCamera={selectedCamera}
          onRotate={rotateCamera}
          onResize={resizeCamera}
          onDelete={id => { deleteCamera(id); setSelectedId(null) }}
        />
      </div>
    </div>
  )
}

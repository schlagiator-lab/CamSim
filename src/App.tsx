import { useState } from 'react'
import { useImageLoader } from './hooks/useImageLoader'
import { usePlacement } from './hooks/usePlacement'
import { exportImage } from './utils/exportImage'
import UploadZone from './components/UploadZone'
import Workspace from './components/Workspace'
import BottomBar, { getBarHeight } from './components/BottomBar'
import type { BottomMode } from './components/BottomBar'

export default function App() {
  const { imageData, loadImage } = useImageLoader()
  const {
    placedCameras, selectedId, setSelectedId,
    placeCamera, moveCamera, rotateCamera, resizeCamera, deleteCamera,
  } = usePlacement()

  const [armedCameraId, setArmedCameraId] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [showEditList, setShowEditList] = useState(false)

  const selectedCamera = placedCameras.find(p => p.id === selectedId) ?? null

  const mode: BottomMode =
    showPanel ? 'cam-select' :
    armedCameraId ? 'armed' :
    showEditList ? 'cam-edit-list' :
    selectedId ? 'cam-selected' :
    'idle'

  const barH = imageData ? getBarHeight(mode) : 0

  const handleCanvasClick = (xPct: number, yPct: number) => {
    if (armedCameraId) {
      placeCamera(armedCameraId, xPct, yPct)
      setArmedCameraId(null)
      return
    }
    setSelectedId(null)
    setShowEditList(false)
  }

  const handleSelectCamera = (cameraId: string) => {
    setArmedCameraId(cameraId)
    setShowPanel(false)
  }

  const handleOpenPanel = () => {
    setShowPanel(true)
    setShowEditList(false)
    setArmedCameraId(null)
    setSelectedId(null)
  }

  const handleOpenEditList = () => {
    setShowEditList(true)
    setShowPanel(false)
    setArmedCameraId(null)
    setSelectedId(null)
  }

  const handleSelectForEdit = (id: string) => {
    setSelectedId(id)
    setShowEditList(false)
  }

  const handleDeselect = () => {
    setSelectedId(null)
    setShowEditList(false)
  }

  const handleExport = async () => {
    if (!imageData) return
    await exportImage(imageData, placedCameras)
  }

  const canExport = !!imageData && placedCameras.length > 0

  /* ── No image: full-screen upload ── */
  if (!imageData) {
    return (
      <div style={{ width: '100dvw', height: '100dvh', background: '#0d0d0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <div style={{ fontFamily: 'Orbitron', fontSize: 26, color: '#00d4ff', letterSpacing: 5 }}>CAMSIM</div>
        <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: '#282838', letterSpacing: 2 }}>camera placement tool</div>
        <div style={{ width: 360 }}>
          <UploadZone onImageLoad={loadImage} />
        </div>
      </div>
    )
  }

  /* ── Image loaded: workspace + contextual bottom bar ── */
  return (
    <div style={{ position: 'relative', width: '100dvw', height: '100dvh', overflow: 'hidden', background: '#0d0d0f' }}>
      {/* Workspace: fills all space above the bottom bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        bottom: `${barH}px`,
        overflow: 'hidden',
      }}>
        <Workspace
          imageData={imageData}
          placedCameras={placedCameras}
          selectedId={selectedId}
          armedCameraId={armedCameraId}
          workspaceH={`calc(100dvh - ${barH}px)`}
          onCanvasClick={handleCanvasClick}
          onSelectCamera={setSelectedId}
          onMoveCamera={moveCamera}
          onResizeCamera={resizeCamera}
        />
        {/* Watermark / re-import */}
        <label
          style={{ position: 'absolute', top: 12, left: 16, zIndex: 20, cursor: 'pointer', userSelect: 'none' }}
          title="Changer de photo"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,.heic"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f) }}
          />
          <span style={{ fontFamily: 'Orbitron', color: 'rgba(0,212,255,0.30)', fontSize: 10, letterSpacing: 3 }}>CAMSIM</span>
        </label>
      </div>

      {/* Bottom bar: pinned to the bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 10,
      }}>
        <BottomBar
          mode={mode}
          placedCameras={placedCameras}
          selectedCamera={selectedCamera}
          canExport={canExport}
          onOpenPanel={handleOpenPanel}
          onClosePanel={() => setShowPanel(false)}
          onOpenEditList={handleOpenEditList}
          onCloseEditList={() => setShowEditList(false)}
          onSelectCamera={handleSelectCamera}
          onSelectForEdit={handleSelectForEdit}
          onCancelArmed={() => setArmedCameraId(null)}
          onDeselect={handleDeselect}
          onRotate={rotateCamera}
          onResize={resizeCamera}
          onDelete={id => { deleteCamera(id); setSelectedId(null) }}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}

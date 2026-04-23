import { useState } from 'react'
import { useImageLoader } from './hooks/useImageLoader'
import { useCalibration } from './hooks/useCalibration'
import { usePlacement } from './hooks/usePlacement'
import { exportImage } from './utils/exportImage'
import UploadZone from './components/UploadZone'
import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'
import CalibrationModal from './components/CalibrationModal'

export default function App() {
  const { imageData, loadImage } = useImageLoader()
  const {
    calibState, point1, point2, calibration,
    startCalibration, handleCalibClick, confirmDistance, cancelCalib, resetCalib,
  } = useCalibration()
  const {
    placedCameras, selectedId, setSelectedId,
    placeCamera, moveCamera, rotateCamera, deleteCamera,
  } = usePlacement()

  const [armedCameraId, setArmedCameraId] = useState<string | null>(null)

  const selectedCamera = placedCameras.find(p => p.id === selectedId) ?? null

  const handleCanvasClick = (xPct: number, yPct: number, svgW: number, svgH: number) => {
    if (calibState === 'picking1' || calibState === 'picking2') {
      handleCalibClick(xPct, yPct, svgW, svgH)
      return
    }
    if (armedCameraId && calibration) {
      placeCamera(armedCameraId, xPct, yPct)
      return
    }
    setSelectedId(null)
  }

  const handleExport = async () => {
    if (!imageData || !calibration) return
    await exportImage(imageData, placedCameras, calibration)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0d0d0f' }}>
      <Sidebar
        armedCameraId={armedCameraId}
        onArmCamera={setArmedCameraId}
        calibration={calibration}
        calibState={calibState}
        onStartCalib={startCalibration}
        onResetCalib={resetCalib}
        selectedCamera={selectedCamera}
        onRotate={rotateCamera}
        onDelete={id => { deleteCamera(id); setSelectedId(null) }}
        canExport={!!imageData && !!calibration && placedCameras.length > 0}
        onExport={handleExport}
      />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
        {!imageData ? (
          <div style={{ width: '100%', maxWidth: 500 }}>
            <UploadZone onImageLoad={loadImage} />
          </div>
        ) : (
          <Workspace
            imageData={imageData}
            placedCameras={placedCameras}
            selectedId={selectedId}
            calibration={calibration}
            calibState={calibState}
            point1={point1}
            point2={point2}
            armedCameraId={armedCameraId}
            onCanvasClick={handleCanvasClick}
            onSelectCamera={setSelectedId}
            onMoveCamera={moveCamera}
          />
        )}
      </main>

      {calibState === 'modal' && (
        <CalibrationModal
          onConfirm={mm => confirmDistance(mm, imageData!.naturalWidth)}
          onCancel={cancelCalib}
        />
      )}
    </div>
  )
}

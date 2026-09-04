import { useState, useCallback, useEffect, useRef } from 'react'
import { useImageLoader } from './hooks/useImageLoader'
import { usePlacement } from './hooks/usePlacement'
import { exportImage } from './utils/exportImage'
import { saveProject, loadProject } from './utils/projectStore'
import UploadZone from './components/UploadZone'
import Workspace from './components/Workspace'
import BottomBar, { getBarHeight } from './components/BottomBar'
import DPad, { STEP as NUDGE_STEP } from './components/DPad'
import type { BottomMode } from './components/BottomBar'

export default function App() {
  const { imageData, loadImage } = useImageLoader()
  const {
    placedCameras, selectedId, setSelectedId,
    placeCamera, moveCamera, rotateCamera, resizeCamera, deleteCamera, duplicateCamera,
    updateLabel, toggleLabel, restorePlacedCameras,
  } = usePlacement()

  const [armedCameraId, setArmedCameraId] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [showEditList, setShowEditList] = useState(false)
  const [restoring, setRestoring] = useState(true)

  /* Restauration du dernier plan sauvegardé (photo + caméras) au chargement */
  useEffect(() => {
    let cancelled = false
    loadProject().then(project => {
      if (cancelled) return
      if (project) {
        loadImage(project.imageBlob)
        restorePlacedCameras(project.placedCameras)
      }
      setRestoring(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Sauvegarde automatique (debounce) dès qu'une photo est chargée */
  useEffect(() => {
    if (restoring || !imageData) return
    const t = setTimeout(() => {
      saveProject({ imageBlob: imageData.blob, placedCameras, savedAt: Date.now() })
    }, 500)
    return () => clearTimeout(t)
  }, [imageData, placedCameras, restoring])

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

  const handleDeselect = useCallback(() => {
    setSelectedId(null)
    setShowEditList(false)
  }, [setSelectedId])

  const handleDelete = useCallback((id: string) => {
    deleteCamera(id)
    setSelectedId(null)
  }, [deleteCamera, setSelectedId])

  const handleNudge = useCallback((dx: number, dy: number) => {
    if (!selectedId) return
    const cam = placedCameras.find(p => p.id === selectedId)
    if (!cam) return
    moveCamera(selectedId,
      Math.max(0, Math.min(100, cam.x + dx)),
      Math.max(0, Math.min(100, cam.y + dy)),
    )
  }, [selectedId, placedCameras, moveCamera])

  /* Raccourcis clavier : Échap (annuler/désélectionner), Suppr/Retour arrière (supprimer),
     flèches (déplacement fin) — inactifs pendant la saisie dans un champ texte. */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      if (e.key === 'Escape') {
        if (armedCameraId) { setArmedCameraId(null); return }
        if (showPanel) { setShowPanel(false); return }
        if (showEditList) { setShowEditList(false); return }
        if (selectedId) { handleDeselect(); return }
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        handleDelete(selectedId)
        return
      }

      if (selectedId && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        const dx = e.key === 'ArrowLeft' ? -NUDGE_STEP : e.key === 'ArrowRight' ? NUDGE_STEP : 0
        const dy = e.key === 'ArrowUp' ? -NUDGE_STEP : e.key === 'ArrowDown' ? NUDGE_STEP : 0
        handleNudge(dx, dy)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [armedCameraId, showPanel, showEditList, selectedId, handleNudge, handleDelete, handleDeselect])

  const handleExport = async () => {
    if (!imageData) return
    await exportImage(imageData, placedCameras)
  }

  const canExport = !!imageData && placedCameras.length > 0

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Nouveau projet : reset complet (photo + caméras + sélection), avec confirmation si du travail serait perdu */
  const handleNewProjectClick = () => {
    const hasContent = placedCameras.length > 0
    if (hasContent && !window.confirm('Démarrer un nouveau projet ? La photo et les caméras placées seront supprimées.')) {
      return
    }
    fileInputRef.current?.click()
  }

  const handleNewProjectFile = (file: File | undefined) => {
    if (!file) return
    loadImage(file)
    restorePlacedCameras([])
    setSelectedId(null)
    setArmedCameraId(null)
    setShowPanel(false)
    setShowEditList(false)
  }

  /* ── Restauration en cours: écran neutre pour éviter un flash de l'écran d'accueil ── */
  if (restoring) {
    return <div style={{ width: '100dvw', height: '100dvh', background: '#0d0d0f' }} />
  }

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
        {/* D-pad déplacement précis */}
        {selectedId && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 20,
          }}>
            <DPad onNudge={handleNudge} />
          </div>
        )}

        {/* Watermark / nouveau projet */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,.heic"
          style={{ display: 'none' }}
          onChange={e => { handleNewProjectFile(e.target.files?.[0]); e.target.value = '' }}
        />
        <div
          style={{ position: 'absolute', top: 12, left: 16, zIndex: 20, cursor: 'pointer', userSelect: 'none' }}
          title="Nouveau projet"
          onClick={handleNewProjectClick}
        >
          <span style={{ fontFamily: 'Orbitron', color: 'rgba(0,212,255,0.30)', fontSize: 10, letterSpacing: 3 }}>CAMSIM</span>
        </div>
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
          onDelete={handleDelete}
          onDuplicate={duplicateCamera}
          onUpdateLabel={updateLabel}
          onToggleLabel={toggleLabel}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}

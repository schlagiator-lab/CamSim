import { useState, useCallback, useEffect, useRef } from 'react'
import { useImageLoader } from './hooks/useImageLoader'
import { usePlacement } from './hooks/usePlacement'
import { exportImage } from './utils/exportImage'
import { makeThumbnail } from './utils/thumbnail'
import {
  saveProject, listProjects, getProject, deleteProject, renameProject,
  getActiveProjectId, setActiveProjectId, migrateLegacyProject,
} from './utils/projectStore'
import type { StoredProject } from './utils/projectStore'
import { DEFAULT_SUN } from './utils/sunSettings'
import type { SunSettings } from './utils/sunSettings'
import UploadZone from './components/UploadZone'
import Workspace from './components/Workspace'
import BottomBar, { getBarHeight } from './components/BottomBar'
import DPad, { STEP as NUDGE_STEP } from './components/DPad'
import ProjectsSheet from './components/ProjectsSheet'
import SunSheet from './components/SunSheet'
import type { BottomMode } from './components/BottomBar'
import type { WorkspaceHandle } from './components/Workspace'

interface ActiveProjectMeta {
  id: string
  name: string
  thumbBlob?: Blob
  sunSettings: SunSettings
  createdAt: number
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        maxWidth: 'min(92vw, 420px)',
        background: '#1a0d0d',
        border: '1px solid #ff3333',
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        fontFamily: 'DM Mono',
        fontSize: 11,
        lineHeight: 1.4,
        color: '#ffb3b3',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Fermer"
        style={{ background: 'none', border: 'none', color: '#ff6a6a', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0, flexShrink: 0 }}
      >×</button>
    </div>
  )
}

export default function App() {
  const { imageData, loadImage, error: imageError, clearError: clearImageError, reset: resetImage } = useImageLoader()
  const {
    placedCameras, selectedId, setSelectedId,
    placeCamera, moveCamera, rotateCamera, resizeCamera, deleteCamera, duplicateCamera,
    updateLabel, toggleLabel, updateLabelColor, updateWallTilt, restorePlacedCameras,
  } = usePlacement()

  const [armedCameraId, setArmedCameraId] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [showEditList, setShowEditList] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const [imageZoom, setImageZoom] = useState(1)
  const [activeProject, setActiveProject] = useState<ActiveProjectMeta | null>(null)
  const [showProjects, setShowProjects] = useState(false)
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [showSun, setShowSun] = useState(false)
  const workspaceRef = useRef<WorkspaceHandle>(null)

  /* Propre à chaque projet (chaque photo a sa propre direction/puissance de soleil réelle) */
  const sunSettings = activeProject?.sunSettings ?? DEFAULT_SUN

  const handleSunChange = (next: SunSettings) => {
    setActiveProject(prev => prev ? { ...prev, sunSettings: next } : prev)
  }

  const handleImageZoomChange = useCallback((zoom: number) => {
    workspaceRef.current?.setZoom(zoom)
  }, [])

  /* Migration de l'ancien plan unique (s'il existe) puis restauration du projet actif */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await migrateLegacyProject()
      const id = getActiveProjectId()
      if (id) {
        const project = await getProject(id)
        if (!cancelled) {
          if (project) {
            loadImage(project.imageBlob)
            restorePlacedCameras(project.placedCameras)
            setActiveProject({ id: project.id, name: project.name, thumbBlob: project.thumbBlob, sunSettings: project.sunSettings, createdAt: project.createdAt })
          } else {
            setActiveProjectId(null)
          }
        }
      }
      if (!cancelled) setRestoring(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Sauvegarde automatique (debounce) du projet actif dès qu'une photo est chargée */
  useEffect(() => {
    if (restoring || !imageData || !activeProject) return
    const t = setTimeout(() => {
      saveProject({
        id: activeProject.id,
        name: activeProject.name,
        imageBlob: imageData.blob,
        thumbBlob: activeProject.thumbBlob,
        placedCameras,
        sunSettings: activeProject.sunSettings,
        createdAt: activeProject.createdAt,
        savedAt: Date.now(),
      })
    }, 500)
    return () => clearTimeout(t)
  }, [imageData, placedCameras, restoring, activeProject])

  /* Disparition automatique du message d'erreur de chargement de photo */
  useEffect(() => {
    if (!imageError) return
    const t = setTimeout(clearImageError, 6000)
    return () => clearTimeout(t)
  }, [imageError, clearImageError])

  const refreshProjects = useCallback(async () => {
    setProjects(await listProjects())
  }, [])

  useEffect(() => {
    if (showProjects) refreshProjects()
  }, [showProjects, refreshProjects])

  /* Sauvegarde immédiate du projet en cours (contourne le debounce de 500 ms) avant
     de basculer vers un autre projet, pour ne pas perdre le tout dernier changement. */
  const flushActiveProject = async () => {
    if (!activeProject || !imageData) return
    await saveProject({
      id: activeProject.id,
      name: activeProject.name,
      imageBlob: imageData.blob,
      thumbBlob: activeProject.thumbBlob,
      placedCameras,
      sunSettings: activeProject.sunSettings,
      createdAt: activeProject.createdAt,
      savedAt: Date.now(),
    })
  }

  const resetTransientUi = () => {
    setSelectedId(null)
    setArmedCameraId(null)
    setShowPanel(false)
    setShowEditList(false)
  }

  const handleCreateProject = async (file: File) => {
    await flushActiveProject()
    let thumbBlob: Blob | undefined
    try { thumbBlob = await makeThumbnail(file) } catch { /* pas grave, pas de vignette */ }
    const id = `proj-${Date.now()}`
    const createdAt = Date.now()
    const name = `Projet du ${new Date(createdAt).toLocaleDateString('fr-FR')}`
    setActiveProjectId(id)
    setActiveProject({ id, name, thumbBlob, sunSettings: DEFAULT_SUN, createdAt })
    loadImage(file)
    restorePlacedCameras([])
    resetTransientUi()
    setShowProjects(false)
  }

  const handleOpenProject = async (id: string) => {
    if (id === activeProject?.id) { setShowProjects(false); return }
    await flushActiveProject()
    const project = await getProject(id)
    if (!project) { await refreshProjects(); return }
    setActiveProjectId(id)
    setActiveProject({ id: project.id, name: project.name, thumbBlob: project.thumbBlob, sunSettings: project.sunSettings, createdAt: project.createdAt })
    loadImage(project.imageBlob)
    restorePlacedCameras(project.placedCameras)
    resetTransientUi()
    setShowProjects(false)
  }

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id)
    if (id === activeProject?.id) {
      const remaining = await listProjects()
      const next = remaining[0]
      if (next) {
        setActiveProjectId(next.id)
        setActiveProject({ id: next.id, name: next.name, thumbBlob: next.thumbBlob, sunSettings: next.sunSettings, createdAt: next.createdAt })
        loadImage(next.imageBlob)
        restorePlacedCameras(next.placedCameras)
      } else {
        setActiveProjectId(null)
        setActiveProject(null)
        resetImage()
        restorePlacedCameras([])
      }
      resetTransientUi()
    }
    await refreshProjects()
  }

  const handleRenameProject = async (id: string, name: string) => {
    await renameProject(id, name)
    if (id === activeProject?.id) setActiveProject(prev => prev ? { ...prev, name } : prev)
    await refreshProjects()
  }

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

  /* Raccourcis clavier : Échap (annuler/désélectionner/fermer un panneau), Suppr/Retour
     arrière (supprimer), flèches (déplacement fin) — inactifs pendant la saisie dans un
     champ texte. */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return

      if (e.key === 'Escape') {
        if (showProjects) { setShowProjects(false); return }
        if (showSun) { setShowSun(false); return }
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
  }, [showProjects, showSun, armedCameraId, showPanel, showEditList, selectedId, handleNudge, handleDelete, handleDeselect])

  const handleExport = async () => {
    if (!imageData) return
    await exportImage(imageData, placedCameras, sunSettings)
  }

  const canExport = !!imageData && placedCameras.length > 0

  /* ── Restauration en cours: écran neutre pour éviter un flash de l'écran d'accueil ── */
  if (restoring) {
    return <div style={{ width: '100dvw', height: '100dvh', background: '#0d0d0f' }} />
  }

  return (
    <>
      {imageError && <ErrorBanner message={imageError} onDismiss={clearImageError} />}

      {/* Marque + accès au gestionnaire de projets : toujours visible, avec ou sans photo chargée */}
      <div style={{ position: 'fixed', top: 12, left: 16, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'Orbitron', color: 'rgba(0,212,255,0.30)', fontSize: 10, letterSpacing: 3, userSelect: 'none' }}>
          CAMSIM
        </span>
        <button
          onClick={() => { setShowProjects(true); setShowSun(false) }}
          title="Mes projets"
          aria-label="Mes projets"
          style={{
            width: 26, height: 26,
            background: 'rgba(13,13,15,0.82)',
            border: '1px solid rgba(0,212,255,0.30)',
            borderRadius: 6,
            color: '#00d4ff',
            fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >🗂</button>
        <button
          onClick={() => { setShowSun(true); setShowProjects(false) }}
          title="Réglage du soleil"
          aria-label="Réglage du soleil"
          style={{
            width: 26, height: 26,
            background: 'rgba(13,13,15,0.82)',
            border: '1px solid rgba(0,212,255,0.30)',
            borderRadius: 6,
            color: '#00d4ff',
            fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >☀</button>
      </div>

      {/* ── No image: full-screen upload ── */}
      {!imageData ? (
        <div style={{ width: '100dvw', height: '100dvh', background: '#0d0d0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <div style={{ fontFamily: 'Orbitron', fontSize: 26, color: '#00d4ff', letterSpacing: 5 }}>CAMSIM</div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 10, color: '#282838', letterSpacing: 2 }}>camera placement tool</div>
          <div style={{ width: 360 }}>
            <UploadZone onImageLoad={handleCreateProject} />
          </div>
        </div>
      ) : (
        /* ── Image loaded: workspace + contextual bottom bar ── */
        <div style={{ position: 'relative', width: '100dvw', height: '100dvh', overflow: 'hidden', background: '#0d0d0f' }}>
          {/* Workspace: fills all space above the bottom bar */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            bottom: `${barH}px`,
            overflow: 'hidden',
          }}>
            <Workspace
              ref={workspaceRef}
              imageData={imageData}
              placedCameras={placedCameras}
              selectedId={selectedId}
              armedCameraId={armedCameraId}
              sunSettings={sunSettings}
              workspaceH={`calc(100dvh - ${barH}px)`}
              onCanvasClick={handleCanvasClick}
              onSelectCamera={setSelectedId}
              onMoveCamera={moveCamera}
              onResizeCamera={resizeCamera}
              onRotate={rotateCamera}
              onZoomChange={setImageZoom}
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
              onResize={resizeCamera}
              onDelete={handleDelete}
              onDuplicate={duplicateCamera}
              onUpdateLabel={updateLabel}
              onToggleLabel={toggleLabel}
              onUpdateLabelColor={updateLabelColor}
              onUpdateWallTilt={updateWallTilt}
              onExport={handleExport}
              imageZoom={imageZoom}
              onImageZoomChange={handleImageZoomChange}
            />
          </div>
        </div>
      )}

      <ProjectsSheet
        open={showProjects}
        projects={projects}
        activeProjectId={activeProject?.id ?? null}
        onClose={() => setShowProjects(false)}
        onCreateNew={handleCreateProject}
        onOpen={handleOpenProject}
        onDelete={handleDeleteProject}
        onRename={handleRenameProject}
      />

      <SunSheet
        open={showSun}
        settings={sunSettings}
        onChange={handleSunChange}
        onClose={() => setShowSun(false)}
      />
    </>
  )
}

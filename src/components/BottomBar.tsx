import { useState, useEffect, useRef } from 'react'
import type { PlacedCamera } from '../types'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'

export type BottomMode = 'idle' | 'cam-select' | 'armed' | 'cam-edit-list' | 'cam-selected'

export function getBarHeight(mode: BottomMode): number {
  if (mode === 'cam-select') return 152
  if (mode === 'cam-edit-list') return 152
  if (mode === 'cam-selected') return 205
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
  onResize: (id: string, scale: number) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
  onToggleLabel: (id: string) => void
  onUpdateLabelColor: (id: string, color: string) => void
  onUpdateWallTilt: (id: string, tilt: number) => void
  onExport: () => void
  imageZoom: number
  onImageZoomChange: (zoom: number) => void
}

const IMAGE_ZOOM_MIN = 0.5
const IMAGE_ZOOM_MAX = 3.0
const clampImageZoom = (v: number) => Math.max(IMAGE_ZOOM_MIN, Math.min(IMAGE_ZOOM_MAX, v))

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
  background: '#bf393a',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
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
  onResize, onDelete, onDuplicate, onUpdateLabel, onToggleLabel, onUpdateLabelColor, onUpdateWallTilt, onExport,
  imageZoom, onImageZoomChange,
}: Props) {
  const selCam = selectedCamera ? cameras.find(c => c.id === selectedCamera.cameraId) : null
  const hasCameras = placedCameras.length > 0

  /* Confirmation de suppression en deux temps (évite un popup natif intrusif) */
  const [confirmDelete, setConfirmDelete] = useState(false)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setConfirmDelete(false)
    return () => { if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current) }
  }, [selectedCamera?.id])

  const handleDeleteClick = () => {
    if (!selectedCamera) return
    if (confirmDelete) {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
      onDelete(selectedCamera.id)
      return
    }
    setConfirmDelete(true)
    confirmTimeoutRef.current = setTimeout(() => setConfirmDelete(false), 2500)
  }

  /* ── idle : deux onglets ── */
  if (mode === 'idle') {
    const tabStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
      flex: 1,
      height: 48,
      background: active ? 'rgba(191,57,58,0.10)' : disabled ? 'transparent' : 'rgba(191,57,58,0.04)',
      border: `1px solid ${active ? '#bf393a' : disabled ? 'rgba(191,57,58,0.10)' : 'rgba(191,57,58,0.28)'}`,
      borderRadius: 8,
      color: disabled ? 'rgba(191,57,58,0.22)' : '#bf393a',
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
          onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#bf393a'; t.style.background = 'rgba(191,57,58,0.14)' }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = 'rgba(191,57,58,0.28)'; t.style.background = 'rgba(191,57,58,0.04)' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span>
          <span style={{ fontSize: 7.5, letterSpacing: 1.5, lineHeight: 1 }}>AJOUTER UNE CAMÉRA</span>
        </button>
        <button
          onClick={hasCameras ? onOpenEditList : undefined}
          style={tabStyle(false, !hasCameras)}
          onMouseEnter={e => { if (!hasCameras) return; const t = e.currentTarget; t.style.borderColor = '#bf393a'; t.style.background = 'rgba(191,57,58,0.14)' }}
          onMouseLeave={e => { if (!hasCameras) return; const t = e.currentTarget; t.style.borderColor = 'rgba(191,57,58,0.28)'; t.style.background = 'rgba(191,57,58,0.04)' }}
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
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#bf393a'; t.style.background = 'rgba(191,57,58,0.06)' }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = '#222232'; t.style.background = '#0f0f14' }}
              >
                <div style={{ height: 54, width: 80, borderRadius: 4, background: cam.images ? '#f0f0f0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {cam.images
                    ? <img src={cam.images.front} alt={cam.model} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <CameraShape type={cam.type} width={pw} height={finalH} />
                  }
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
        <span style={{ fontFamily: 'DM Mono', color: '#bf393a', fontSize: 10, letterSpacing: 1 }}>
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
                onMouseEnter={e => { const t = e.currentTarget; t.style.borderColor = '#bf393a'; t.style.background = 'rgba(191,57,58,0.06)' }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.borderColor = '#222232'; t.style.background = '#0f0f14' }}
              >
                <div style={{ height: 50, width: 80, borderRadius: 4, background: cam.images ? '#f0f0f0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {cam.images
                    ? <img src={cam.images.front} alt={cam.model} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <CameraShape type={cam.type} width={pw} height={finalH} />
                  }
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
      <div style={{ ...base, height: 165, display: 'flex', flexDirection: 'column', padding: '8px 20px', gap: 7 }}>

        {/* Ligne étiquette : remontée en haut du panneau pour rester visible même si le bas
            de l'écran est rogné (barre d'adresse mobile, encoche, etc.) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, flexShrink: 0 }}>
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
          <input
            type="color"
            className="label-color-swatch"
            value={selectedCamera.labelColor ?? '#bf393a'}
            onChange={e => onUpdateLabelColor(selectedCamera.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            title="Couleur de l'étiquette"
            style={{
              flexShrink: 0,
              width: 24,
              height: 24,
              border: '1px solid #2a2a3e',
              background: 'transparent',
              cursor: 'pointer',
            }}
          />
          <button
            onClick={() => onToggleLabel(selectedCamera.id)}
            title={selectedCamera.showLabel ? "Masquer l'étiquette" : "Afficher l'étiquette"}
            style={{
              flexShrink: 0,
              background: selectedCamera.showLabel ? 'rgba(191,57,58,0.10)' : 'transparent',
              border: `1px solid ${selectedCamera.showLabel ? 'rgba(191,57,58,0.4)' : '#333'}`,
              borderRadius: 4,
              color: selectedCamera.showLabel ? '#bf393a' : '#444',
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

        {/* Zoom image : contrôle le zoom de la photo (la taille de la caméra est gérée par
            les boutons +/- superposés sur l'image) */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ textAlign: 'center', fontFamily: 'DM Mono', textTransform: 'uppercase', color: '#555', fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>
            ZOOM IMAGE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => onImageZoomChange(clampImageZoom(Math.round((imageZoom - 0.1) * 100) / 100))}
              style={{ ...btn('#bf393a'), flexShrink: 0, padding: '5px 9px' }}
            >−</button>
            <input
              type="range" min={50} max={300} step={1}
              value={Math.round(imageZoom * 100)}
              onChange={e => onImageZoomChange(parseInt(e.target.value, 10) / 100)}
              style={{ flex: 1, accentColor: '#bf393a', margin: 0 }}
            />
            <button
              onClick={() => onImageZoomChange(clampImageZoom(Math.round((imageZoom + 0.1) * 100) / 100))}
              style={{ ...btn('#bf393a'), flexShrink: 0, padding: '5px 9px' }}
            >+</button>
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'DM Mono', color: '#bf393a', fontSize: 9, marginTop: 3 }}>
            {Math.round(imageZoom * 100)}%
          </div>
        </div>

        {/* Inclinaison du mur : cisaillement 2D approximant un pan de mur qui s'éloigne
            du point de vue (MVP — voir src/utils/wallPerspective.ts) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Orbitron', color: '#383848', fontSize: 7.5, letterSpacing: 1, flexShrink: 0 }}>MUR</span>
          <input
            type="range" min={-45} max={45} step={1}
            value={selectedCamera.wallTilt ?? 0}
            onChange={e => onUpdateWallTilt(selectedCamera.id, parseInt(e.target.value, 10))}
            style={{ flex: 1, accentColor: '#bf393a', margin: 0 }}
          />
          <span style={{ fontFamily: 'DM Mono', color: '#bf393a', fontSize: 9, width: 30, textAlign: 'right', flexShrink: 0 }}>
            {selectedCamera.wallTilt ?? 0}°
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button style={{ ...btn('#bf393a'), flex: 1 }} onClick={onOpenPanel}>+ AJOUTER</button>
          <button style={{ ...btn('#bf393a'), flex: 1 }} onClick={() => onDuplicate(selectedCamera.id)}>⧉ DUPLIQUER</button>
          <button style={{ ...btn('#555'), flex: 1 }} onClick={onDeselect}>← RETOUR</button>
          <button style={{ ...btn(confirmDelete ? '#ff6a6a' : '#ff3333'), flex: 1 }} onClick={handleDeleteClick}>
            {confirmDelete ? 'CONFIRMER ?' : 'SUPPRIMER'}
          </button>
        </div>

      </div>
    )
  }

  return null
}

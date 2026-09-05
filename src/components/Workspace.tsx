import { Fragment, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { PlacedCamera } from '../types'
import type { LoadedImage } from '../hooks/useImageLoader'
import type { SunSettings } from '../utils/sunSettings'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'
import { useZoomPan } from '../hooks/useZoomPan'
import { computeShadowParams } from '../utils/cameraShadow'
import { computeIntegrationParams } from '../utils/cameraIntegration'
import { computeWallTransform } from '../utils/wallPerspective'

const BASE_SCALE = 0.08
const MIN_HIT_SIZE = 44 // px CSS non zoomés, recommandation Apple pour une cible tactile

const ZOOM_BTN: React.CSSProperties = {
  width: 38,
  height: 38,
  background: 'rgba(13,13,15,0.82)',
  border: '1px solid rgba(0,212,255,0.30)',
  borderRadius: 7,
  color: '#00d4ff',
  fontSize: 17,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  touchAction: 'none',
  WebkitTapHighlightColor: 'transparent',
}

type CamImages = NonNullable<import('../types').Camera['images']>

function pickImage(rotation: number, images: CamImages): string {
  const rot = ((rotation % 360) + 360) % 360
  if (rot < 45 || rot >= 315) return images.angleRight ?? images.front
  if (rot < 135) return images.front
  if (rot < 225) return images.angleLeft ?? images.front
  return images.front
}

/* Même découpage angulaire que pickImage, pour le mode 'mirror' (une seule photo,
   retournée horizontalement côté gauche plutôt que remplacée par une 2e image). */
function isLeftFacingBucket(rotation: number): boolean {
  const rot = ((rotation % 360) + 360) % 360
  return rot >= 135 && rot < 225
}

/* La photo `front` pointe nativement vers `frontFacing` (droite par défaut) : on la
   retourne quand l'angle demandé pointe du côté opposé. */
function shouldMirror(frontFacing: 'left' | 'right' | undefined, rotation: number): boolean {
  return isLeftFacingBucket(rotation) !== (frontFacing === 'left')
}

interface Props {
  imageData: LoadedImage
  placedCameras: PlacedCamera[]
  selectedId: string | null
  armedCameraId: string | null
  workspaceH: string
  sunSettings: SunSettings
  onCanvasClick: (xPct: number, yPct: number) => void
  onSelectCamera: (id: string) => void
  onMoveCamera: (id: string, xPct: number, yPct: number) => void
  onResizeCamera: (id: string, scale: number) => void
  onRotate: (id: string, deg: number) => void
  onZoomChange?: (zoom: number) => void
}

export interface WorkspaceHandle {
  setZoom: (zoom: number) => void
}

const CAM_SIZE_STEP = 0.05
const CAM_SIZE_MIN = 0.1
const CAM_SIZE_MAX = 3.0
const clampCamSize = (v: number) => Math.max(CAM_SIZE_MIN, Math.min(CAM_SIZE_MAX, v))

const COMPASS_CELL = 34
const DIRS = [
  { a: '↖', d: 225 }, { a: '↑', d: 270 }, { a: '↗', d: 315 },
  { a: '←', d: 180 }, { a: null, d: null }, { a: '→', d: 0 },
  { a: '↙', d: 135 }, { a: '↓', d: 90 }, { a: '↘', d: 45 },
] as const

const Workspace = forwardRef<WorkspaceHandle, Props>(function Workspace({
  imageData, placedCameras, selectedId, armedCameraId, sunSettings,
  workspaceH, onCanvasClick, onSelectCamera, onMoveCamera, onResizeCamera, onRotate, onZoomChange,
}, ref) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<{ id: string; pointerId: number } | null>(null)

  const getSvgRect = () => svgRef.current?.getBoundingClientRect() ?? null

  const handleTap = useCallback((clientX: number, clientY: number) => {
    if (draggingRef.current) return
    const rect = getSvgRect()
    if (!rect) return
    onCanvasClick(
      Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    )
  }, [onCanvasClick])

  const { viewportRef, contentStyle, viewportProps, setZoom } =
    useZoomPan({ onTap: handleTap, minZoom: 0.5, maxZoom: 3, onZoomChange })

  useImperativeHandle(ref, () => ({ setZoom }), [setZoom])

  const selectedCamera = placedCameras.find(p => p.id === selectedId) ?? null

  return (
    <div
      ref={viewportRef}
      {...viewportProps}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', touchAction: 'none' }}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', ...contentStyle }}>
          <img
            src={imageData.src}
            alt="plan"
            style={{ display: 'block', maxWidth: '100%', maxHeight: workspaceH, objectFit: 'contain', userSelect: 'none' }}
            draggable={false}
          />
          <svg
            ref={svgRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              cursor: armedCameraId ? 'crosshair' : 'default',
            }}
          >
          {placedCameras.map(placed => {
            const cam = cameras.find(c => c.id === placed.cameraId)
            if (!cam) return null
            const svgEl = svgRef.current
            const svgW = svgEl?.clientWidth ?? 800
            const svgH = svgEl?.clientHeight ?? 600
            const cw = svgW * BASE_SCALE * placed.scale
            const ch = cw * (cam.realHeight / cam.realWidth)
            const cx = placed.x / 100 * svgW
            const cy = placed.y / 100 * svgH
            const isSelected = placed.id === selectedId
            const displayLabel = placed.label || `${cam.brand} ${cam.model}`

            // Images 'discrete'/'mirror' : pas de rotation SVG (la photo elle-même encode
            // la direction, ou reste figée avec un simple miroir). Images 'free' et formes
            // vectorielles : rotation SVG normale.
            const orientationMode: NonNullable<import('../types').Camera['orientationMode']> =
              cam.images ? (cam.orientationMode ?? 'discrete') : 'free'
            const groupRotation = orientationMode === 'free' ? placed.rotation : 0
            const shadow = computeShadowParams(ch, sunSettings.angleDeg, sunSettings.strength)
            const integration = computeIntegrationParams(ch)
            // Filtres SVG natifs (feColorMatrix/feComponentTransfer/feGaussianBlur/feDropShadow)
            // plutôt que le raccourci CSS `filter: brightness() saturate() blur()…` : Safari
            // applique ce raccourci de façon peu fiable sur des <image>/<foreignObject> SVG
            // (l'ombre se retrouvait affichée comme une simple copie non assombrie de la
            // caméra sur iPhone). Un id de filtre par caméra placée, car le flou dépend de
            // sa taille rendue (`ch`).
            const shadowFilterId = `shadow-${placed.id}`
            const realFilterId = `real-${placed.id}`
            const mirrorTransform = orientationMode === 'mirror' && shouldMirror(cam.frontFacing, placed.rotation) ? 'scale(-1,1)' : undefined
            // Zone tactile (sélection/déplacement) au moins aussi grande que la recommandation
            // Apple (44pt) : une petite caméra affichée à l'écran (zoom arrière, échelle faible)
            // devient sinon très facile à "rater" du doigt, ce qui bascule le tap sur le fond
            // et désélectionne au lieu d'interagir avec la caméra.
            const hitW = Math.max(cw, MIN_HIT_SIZE)
            const hitH = Math.max(ch, MIN_HIT_SIZE)
            const wallTransform = computeWallTransform(placed.wallTilt ?? 0)
            const skewTransform = wallTransform.cssSkewDeg !== 0 ? `skewX(${wallTransform.cssSkewDeg})` : undefined
            // Appliqué seulement au visuel (image/forme), pas au groupe entier : la
            // zone de capture, le cadre de sélection et les poignées restent des
            // rectangles simples, sans complexifier le hit-testing/redimensionnement.
            const visualTransform = [mirrorTransform, skewTransform].filter(Boolean).join(' ') || undefined

            return (
              <Fragment key={placed.id}>
                <defs>
                  {/* Silhouette noire floutée (≈ brightness(0) blur()) : RVB à 0, alpha inchangé */}
                  <filter id={shadowFilterId} x="-60%" y="-60%" width="220%" height="220%">
                    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
                    <feGaussianBlur stdDeviation={shadow.blur} />
                  </filter>
                  {/* Intégration tonale (saturation/luminosité/flou léger) + halo blanc de
                      lisibilité (≈ drop-shadow(0 0 6px rgba(255,255,255,0.7))) */}
                  <filter id={realFilterId} x="-60%" y="-60%" width="220%" height="220%">
                    <feColorMatrix type="saturate" values={String(integration.saturate)} result="sat" />
                    <feComponentTransfer in="sat" result="bright">
                      <feFuncR type="linear" slope={integration.brightness} />
                      <feFuncG type="linear" slope={integration.brightness} />
                      <feFuncB type="linear" slope={integration.brightness} />
                    </feComponentTransfer>
                    <feGaussianBlur in="bright" stdDeviation={integration.blur} result="softened" />
                    <feDropShadow in="softened" dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.7" />
                  </filter>
                </defs>

                {/* Ombre portée : copie décalée dans l'espace du monde (pas dans le repère
                    déjà pivoté), pour que sa direction reste fixe quel que soit l'angle de
                    la caméra — seule la silhouette elle-même doit suivre la rotation. */}
                <g
                  transform={`translate(${cx + shadow.dx},${cy + shadow.dy}) rotate(${groupRotation})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {cam.images ? (
                    <image
                      href={orientationMode === 'discrete' ? pickImage(placed.rotation, cam.images) : cam.images.front}
                      x={-cw / 2} y={-ch / 2}
                      width={cw} height={ch}
                      preserveAspectRatio="xMidYMid meet"
                      transform={visualTransform}
                      filter={`url(#${shadowFilterId})`}
                      opacity={shadow.opacity}
                    />
                  ) : (
                    <foreignObject
                      x={-cw / 2} y={-ch / 2} width={cw} height={ch}
                      transform={visualTransform}
                      filter={`url(#${shadowFilterId})`}
                      opacity={shadow.opacity}
                      style={{ overflow: 'visible' }}
                    >
                      <CameraShape type={cam.type} width={cw} height={ch} />
                    </foreignObject>
                  )}
                </g>

                <g
                  transform={`translate(${cx},${cy}) rotate(${groupRotation})`}
                >
                {/* Zone de capture (drag / select) */}
                <rect
                  x={-hitW / 2} y={-hitH / 2} width={hitW} height={hitH}
                  fill="transparent"
                  style={{ cursor: armedCameraId ? 'crosshair' : 'grab', pointerEvents: armedCameraId ? 'none' : 'auto' }}
                  onPointerDown={e => {
                    e.stopPropagation()
                    onSelectCamera(placed.id)
                    const pointerId = e.pointerId
                    draggingRef.current = { id: placed.id, pointerId }
                    const onMove = (ev: PointerEvent) => {
                      if (ev.pointerId !== pointerId || !draggingRef.current) return
                      const rect = getSvgRect()
                      if (!rect) return
                      onMoveCamera(
                        placed.id,
                        Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)),
                        Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)),
                      )
                    }
                    const onUp = (ev: PointerEvent) => {
                      if (ev.pointerId !== pointerId) return
                      setTimeout(() => { draggingRef.current = null }, 50)
                      window.removeEventListener('pointermove', onMove)
                      window.removeEventListener('pointerup', onUp)
                    }
                    window.addEventListener('pointermove', onMove)
                    window.addEventListener('pointerup', onUp)
                  }}
                />

                {/* Cadre de sélection */}
                {isSelected && (
                  <rect
                    x={-hitW / 2 - 5} y={-hitH / 2 - 5}
                    width={hitW + 10} height={hitH + 10}
                    fill="none" stroke="#00d4ff" strokeWidth={1.5}
                    strokeDasharray="5,4" rx={4}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Visuel : photo produit ou SVG générique */}
                {cam.images ? (
                  <image
                    href={orientationMode === 'discrete' ? pickImage(placed.rotation, cam.images) : cam.images.front}
                    x={-cw / 2} y={-ch / 2}
                    width={cw} height={ch}
                    preserveAspectRatio="xMidYMid meet"
                    transform={visualTransform}
                    filter={`url(#${realFilterId})`}
                    style={{ pointerEvents: 'none' } as React.CSSProperties}
                  />
                ) : (
                  <foreignObject
                    x={-cw / 2} y={-ch / 2} width={cw} height={ch}
                    transform={visualTransform}
                    filter={`url(#${realFilterId})`}
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                  >
                    <CameraShape type={cam.type} width={cw} height={ch} />
                  </foreignObject>
                )}

                {/* Étiquette */}
                {placed.showLabel && (
                  <text
                    x={0} y={ch / 2 + 14}
                    textAnchor="middle" fontFamily="DM Mono"
                    fontSize={Math.max(8, Math.min(13, cw * 0.12))}
                    fill={placed.labelColor ?? '#00d4ff'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {displayLabel}
                  </text>
                )}

                {/* Poignées de redimensionnement */}
                {isSelected && [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
                  <circle
                    key={i}
                    cx={sx * (cw / 2 + 5)} cy={sy * (ch / 2 + 5)}
                    r={5} fill="#00d4ff" stroke="#0d0d0f" strokeWidth={1.5}
                    style={{ cursor: 'nwse-resize' }}
                    onPointerDown={e => {
                      e.stopPropagation()
                      const rect = getSvgRect()
                      if (!rect) return
                      // Le SVG peut être visuellement zoomé (transform CSS d'un ancêtre) : on
                      // reconvertit les coordonnées écran en unités locales du SVG (via la
                      // fraction dans rect, indépendante du zoom) pour comparer avec cx/cy.
                      const toLocal = (clientX: number, clientY: number) => ({
                        x: ((clientX - rect.left) / rect.width) * svgW,
                        y: ((clientY - rect.top) / rect.height) * svgH,
                      })
                      const p0 = toLocal(e.clientX, e.clientY)
                      const startDist = Math.sqrt((p0.x - cx) ** 2 + (p0.y - cy) ** 2)
                      if (startDist < 2) return
                      const startScale = placed.scale
                      const pointerId = e.pointerId
                      const onMove = (ev: PointerEvent) => {
                        if (ev.pointerId !== pointerId) return
                        const r = getSvgRect()
                        if (!r) return
                        const p = { x: ((ev.clientX - r.left) / r.width) * svgW, y: ((ev.clientY - r.top) / r.height) * svgH }
                        onResizeCamera(placed.id, startScale * Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2) / startDist)
                      }
                      const onUp = (ev: PointerEvent) => {
                        if (ev.pointerId !== pointerId) return
                        window.removeEventListener('pointermove', onMove)
                        window.removeEventListener('pointerup', onUp)
                      }
                      window.addEventListener('pointermove', onMove)
                      window.addEventListener('pointerup', onUp)
                    }}
                  />
                ))}
                </g>
              </Fragment>
            )
          })}
        </svg>
        </div>
      </div>

      {/* Taille de la caméra sélectionnée : boutons +/- superposés sur l'image.
          N'apparaît que si une caméra est sélectionnée (sinon c'est un contrôle mort). */}
      {selectedCamera && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <button
            onClick={() => onResizeCamera(selectedCamera.id, clampCamSize(selectedCamera.scale + CAM_SIZE_STEP))}
            title="Agrandir la caméra"
            aria-label="Agrandir la caméra"
            style={ZOOM_BTN}
          >+</button>
          <div style={{ ...ZOOM_BTN, fontSize: 8, fontFamily: 'DM Mono', cursor: 'default' }}>
            {selectedCamera.scale.toFixed(2)}×
          </div>
          <button
            onClick={() => onResizeCamera(selectedCamera.id, clampCamSize(selectedCamera.scale - CAM_SIZE_STEP))}
            title="Réduire la caméra"
            aria-label="Réduire la caméra"
            style={ZOOM_BTN}
          >−</button>
        </div>
      )}

      {/* Orientation de la caméra sélectionnée : boussole 3×3 superposée, collée à droite
          des boutons de taille (pas centrée : ça finissait par chevaucher le D-pad à droite) */}
      {selectedCamera && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 16, left: 16 + 38 + 12,
            zIndex: 20, display: 'grid', gridTemplateColumns: `repeat(3, ${COMPASS_CELL}px)`, gap: 4,
          }}
        >
          {DIRS.map((d, i) => {
            if (d.a === null) {
              return (
                <div
                  key={i}
                  style={{ ...ZOOM_BTN, width: COMPASS_CELL, height: COMPASS_CELL, fontSize: 8, fontFamily: 'DM Mono', cursor: 'default' }}
                >
                  {selectedCamera.rotation}°
                </div>
              )
            }
            const active = selectedCamera.rotation === d.d
            return (
              <button
                key={i}
                onClick={() => onRotate(selectedCamera.id, d.d as number)}
                title={`Orienter à ${d.d}°`}
                style={{
                  ...ZOOM_BTN,
                  width: COMPASS_CELL, height: COMPASS_CELL, fontSize: 15,
                  background: active ? 'rgba(0,212,255,0.28)' : ZOOM_BTN.background,
                  border: active ? '1px solid #00d4ff' : ZOOM_BTN.border,
                }}
              >{d.a}</button>
            )
          })}
        </div>
      )}
    </div>
  )
})

export default Workspace

import { useRef, useCallback } from 'react'
import type { PlacedCamera } from '../types'
import type { LoadedImage } from '../hooks/useImageLoader'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'

const BASE_SCALE = 0.08

interface Props {
  imageData: LoadedImage
  placedCameras: PlacedCamera[]
  selectedId: string | null
  armedCameraId: string | null
  workspaceH: string
  onCanvasClick: (xPct: number, yPct: number) => void
  onSelectCamera: (id: string) => void
  onMoveCamera: (id: string, xPct: number, yPct: number) => void
  onResizeCamera: (id: string, scale: number) => void
}

export default function Workspace({
  imageData, placedCameras, selectedId, armedCameraId,
  workspaceH, onCanvasClick, onSelectCamera, onMoveCamera, onResizeCamera,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<{ id: string; pointerId: number } | null>(null)

  const getSvgRect = () => svgRef.current?.getBoundingClientRect() ?? null

  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    if (draggingRef.current) return
    const rect = getSvgRect()
    if (!rect) return
    onCanvasClick(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100,
    )
  }, [onCanvasClick])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
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
          onClick={handleSvgClick}
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

            return (
              <g
                key={placed.id}
                transform={`translate(${cx},${cy}) rotate(${placed.rotation})`}
              >
                {/* Transparent hit area — seule surface cliquable/draggable */}
                <rect
                  x={-cw / 2} y={-ch / 2} width={cw} height={ch}
                  fill="transparent"
                  style={{ cursor: 'grab' }}
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
                    x={-cw / 2 - 5} y={-ch / 2 - 5}
                    width={cw + 10} height={ch + 10}
                    fill="none" stroke="#00d4ff" strokeWidth={1.5}
                    strokeDasharray="5,4" rx={4}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Visuel de la caméra */}
                <foreignObject
                  x={-cw / 2} y={-ch / 2} width={cw} height={ch}
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                  <CameraShape type={cam.type} width={cw} height={ch} />
                </foreignObject>

                {/* Étiquette */}
                {placed.showLabel && (
                  <text
                    x={0} y={ch / 2 + 14}
                    textAnchor="middle" fontFamily="DM Mono"
                    fontSize={Math.max(8, Math.min(13, cw * 0.12))}
                    fill="#00d4ff"
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
                      const mx0 = e.clientX - rect.left, my0 = e.clientY - rect.top
                      const startDist = Math.sqrt((mx0 - cx) ** 2 + (my0 - cy) ** 2)
                      if (startDist < 2) return
                      const startScale = placed.scale
                      const pointerId = e.pointerId
                      const onMove = (ev: PointerEvent) => {
                        if (ev.pointerId !== pointerId) return
                        const r = getSvgRect()
                        if (!r) return
                        const mx = ev.clientX - r.left, my = ev.clientY - r.top
                        onResizeCamera(placed.id, startScale * Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) / startDist)
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
            )
          })}
        </svg>
      </div>
    </div>
  )
}

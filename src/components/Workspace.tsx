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
  onCanvasClick: (xPct: number, yPct: number) => void
  onSelectCamera: (id: string) => void
  onMoveCamera: (id: string, xPct: number, yPct: number) => void
  onResizeCamera: (id: string, scale: number) => void
}

export default function Workspace({
  imageData,
  placedCameras,
  selectedId,
  armedCameraId,
  onCanvasClick,
  onSelectCamera,
  onMoveCamera,
  onResizeCamera,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<{ id: string } | null>(null)

  const getSvgRect = () => svgRef.current?.getBoundingClientRect() ?? null

  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    if (draggingRef.current) return
    const rect = getSvgRect()
    if (!rect) return
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    onCanvasClick(xPct, yPct)
  }, [onCanvasClick])

  const handleCameraMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onSelectCamera(id)
    draggingRef.current = { id }

    const onMove = (ev: MouseEvent) => {
      const rect = getSvgRect()
      if (!rect || !draggingRef.current) return
      const xPct = ((ev.clientX - rect.left) / rect.width) * 100
      const yPct = ((ev.clientY - rect.top) / rect.height) * 100
      onMoveCamera(id, Math.max(0, Math.min(100, xPct)), Math.max(0, Math.min(100, yPct)))
    }

    const onUp = () => {
      setTimeout(() => { draggingRef.current = null }, 50)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onSelectCamera, onMoveCamera])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
        <img
          src={imageData.src}
          alt="plan"
          style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 48px)', objectFit: 'contain', userSelect: 'none' }}
          draggable={false}
        />
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: armedCameraId ? 'copy' : 'default',
          }}
          onClick={handleSvgClick}
        >
          {placedCameras.map(placed => {
            const cam = cameras.find(c => c.id === placed.cameraId)
            if (!cam) return null
            const svg = svgRef.current
            const svgW = svg?.clientWidth ?? 800
            const svgH = svg?.clientHeight ?? 600
            const cw = svgW * BASE_SCALE * placed.scale
            const ch = cw * (cam.realHeight / cam.realWidth)
            const cx = placed.x / 100 * svgW
            const cy = placed.y / 100 * svgH
            const isSelected = placed.id === selectedId

            const handleResizeMouseDown = (e: React.MouseEvent) => {
              e.stopPropagation()
              const rect = getSvgRect()
              if (!rect) return
              const mx0 = e.clientX - rect.left
              const my0 = e.clientY - rect.top
              const startDist = Math.sqrt((mx0 - cx) ** 2 + (my0 - cy) ** 2)
              if (startDist < 2) return
              const startScale = placed.scale

              const onMove = (ev: MouseEvent) => {
                const r = getSvgRect()
                if (!r) return
                const mx = ev.clientX - r.left
                const my = ev.clientY - r.top
                const newDist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2)
                onResizeCamera(placed.id, startScale * (newDist / startDist))
              }
              const onUp = () => {
                window.removeEventListener('mousemove', onMove)
                window.removeEventListener('mouseup', onUp)
              }
              window.addEventListener('mousemove', onMove)
              window.addEventListener('mouseup', onUp)
            }

            return (
              <g
                key={placed.id}
                transform={`translate(${cx},${cy}) rotate(${placed.rotation})`}
                style={{ cursor: 'grab' }}
                onMouseDown={e => handleCameraMouseDown(e, placed.id)}
              >
                {isSelected && (
                  <rect
                    x={-cw / 2 - 5} y={-ch / 2 - 5}
                    width={cw + 10} height={ch + 10}
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                    rx={4}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                <foreignObject
                  x={-cw / 2} y={-ch / 2}
                  width={cw} height={ch}
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                  <CameraShape type={cam.type} width={cw} height={ch} />
                </foreignObject>
                <text
                  x={0} y={ch / 2 + 13}
                  textAnchor="middle"
                  fontFamily="DM Mono"
                  fontSize={Math.max(8, Math.min(13, cw * 0.10))}
                  fill="#00d4ff"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {cam.brand} {cam.model}
                </text>
                {/* Corner resize handles — only when selected */}
                {isSelected && [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
                  <circle
                    key={i}
                    cx={sx * (cw / 2 + 5)}
                    cy={sy * (ch / 2 + 5)}
                    r={5}
                    fill="#00d4ff"
                    stroke="#0d0d0f"
                    strokeWidth={1.5}
                    style={{ cursor: 'nwse-resize' }}
                    onMouseDown={handleResizeMouseDown}
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

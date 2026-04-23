import { useRef, useCallback } from 'react'
import type { PlacedCamera, CalibrationData } from '../types'
import type { LoadedImage } from '../hooks/useImageLoader'
import type { CalibState } from '../hooks/useCalibration'
import { cameras } from '../data/cameras'
import CameraShape from './CameraShape'

interface Props {
  imageData: LoadedImage
  placedCameras: PlacedCamera[]
  selectedId: string | null
  calibration: CalibrationData | null
  calibState: CalibState
  point1: { x: number; y: number } | null
  point2: { x: number; y: number } | null
  armedCameraId: string | null
  onCanvasClick: (xPct: number, yPct: number, svgW: number, svgH: number) => void
  onSelectCamera: (id: string) => void
  onMoveCamera: (id: string, xPct: number, yPct: number) => void
}

export default function Workspace({
  imageData,
  placedCameras,
  selectedId,
  calibration,
  calibState,
  point1,
  point2,
  armedCameraId,
  onCanvasClick,
  onSelectCamera,
  onMoveCamera,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const draggingRef = useRef<{ id: string; startX: number; startY: number } | null>(null)

  const getSvgCoords = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { xPct: 0, yPct: 0, svgW: 0, svgH: 0 }
    const rect = svg.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    return { xPct, yPct, svgW: rect.width, svgH: rect.height }
  }, [])

  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    if (draggingRef.current) return
    const { xPct, yPct, svgW, svgH } = getSvgCoords(e)
    onCanvasClick(xPct, yPct, svgW, svgH)
  }, [getSvgCoords, onCanvasClick])

  const handleCameraMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onSelectCamera(id)
    const startX = e.clientX
    const startY = e.clientY
    draggingRef.current = { id, startX, startY }

    const onMove = (ev: MouseEvent) => {
      const svg = svgRef.current
      if (!svg || !draggingRef.current) return
      const rect = svg.getBoundingClientRect()
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

  const isCalibMode = calibState === 'picking1' || calibState === 'picking2'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
        <img
          src={imageData.src}
          alt="plan"
          style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 80px)', objectFit: 'contain', userSelect: 'none' }}
          draggable={false}
        />
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: isCalibMode ? 'crosshair' : armedCameraId ? 'copy' : 'default',
          }}
          onClick={handleSvgClick}
        >
          {/* Calibration line */}
          {point1 && point2 && (
            <line
              x1={`${point1.x}%`} y1={`${point1.y}%`}
              x2={`${point2.x}%`} y2={`${point2.y}%`}
              stroke="#ff6b00" strokeWidth={2} strokeDasharray="6,4"
            />
          )}
          {/* Calibration points */}
          {[point1, point2].map((pt, i) => pt && (
            <g key={i} transform={`translate(${pt.x}%,${pt.y}%)`}>
              <circle r={8} fill="none" stroke="#ff6b00" strokeWidth={2} />
              <circle r={3} fill="#ff6b00" />
            </g>
          ))}

          {/* Placed cameras */}
          {placedCameras.map(placed => {
            const cam = cameras.find(c => c.id === placed.cameraId)
            if (!cam || !calibration) return null
            const svg = svgRef.current
            const svgW = svg?.clientWidth ?? 800
            const svgH = svg?.clientHeight ?? 600
            const pxPerMm = calibration.pixelsPerMm * (svgW / (imageData.naturalWidth))
            const cw = cam.realWidth * pxPerMm
            const ch = cam.realHeight * pxPerMm
            const cx = placed.x / 100 * svgW
            const cy = placed.y / 100 * svgH
            const isSelected = placed.id === selectedId

            return (
              <g
                key={placed.id}
                transform={`translate(${cx},${cy}) rotate(${placed.rotation})`}
                style={{ cursor: 'grab' }}
                onMouseDown={e => handleCameraMouseDown(e, placed.id)}
              >
                {isSelected && (
                  <rect
                    x={-cw / 2 - 4} y={-ch / 2 - 4}
                    width={cw + 8} height={ch + 8}
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                    rx={4}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                <foreignObject x={-cw / 2} y={-ch / 2} width={cw} height={ch} style={{ overflow: 'visible', pointerEvents: 'none' }}>
                  <CameraShape type={cam.type} color={cam.color} width={cw} height={ch} />
                </foreignObject>
                <text
                  x={0} y={ch / 2 + 14}
                  textAnchor="middle"
                  fontFamily="DM Mono"
                  fontSize={Math.max(9, Math.min(14, ch * 0.12))}
                  fill="#00d4ff"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {cam.brand} {cam.model}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

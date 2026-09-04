import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseZoomPanOptions {
  minZoom?: number
  maxZoom?: number
  onTap?: (clientX: number, clientY: number) => void
}

interface Point { x: number; y: number }

const TAP_MOVE_THRESHOLD = 6 // px : au-delà, un pointeur unique est considéré comme un glissé (pan) et non un tap

type Gesture =
  | { type: 'pan'; pointerId: number; startClient: Point; startPan: Point; moved: boolean }
  | { type: 'pinch'; startDist: number; startZoom: number; contentPoint: Point }
  | null

/**
 * Zoom + pan tactile/souris sur une zone (pincement à 2 doigts, glisser à 1 doigt,
 * molette avec Ctrl/Cmd pour zoomer sous le curseur, double-clic pour zoomer/dézoomer).
 * Les caméras placées gardent leurs propres gestionnaires (drag, redimension) qui
 * stoppent la propagation : ce hook ne s'applique qu'au fond (photo vide).
 */
export function useZoomPan({ minZoom = 1, maxZoom = 5, onTap }: UseZoomPanOptions) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [transitioning, setTransitioning] = useState(false)

  const stateRef = useRef({ zoom, pan })
  stateRef.current = { zoom, pan }

  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<Gesture>(null)

  const clampZoom = useCallback((z: number) => Math.min(maxZoom, Math.max(minZoom, z)), [minZoom, maxZoom])

  const clampPan = useCallback((p: Point, z: number): Point => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return p
    const maxOffsetX = (rect.width * z) / 2
    const maxOffsetY = (rect.height * z) / 2
    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, p.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, p.y)),
    }
  }, [])

  const zoomAtClientPoint = useCallback((clientX: number, clientY: number, nextZoomRaw: number, basePan: Point, baseZoom: number) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    const nextZoom = clampZoom(nextZoomRaw)
    if (!rect) return { zoom: nextZoom, pan: basePan }
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const contentX = (clientX - (cx + basePan.x)) / baseZoom
    const contentY = (clientY - (cy + basePan.y)) / baseZoom
    return {
      zoom: nextZoom,
      pan: { x: clientX - cx - contentX * nextZoom, y: clientY - cy - contentY * nextZoom },
    }
  }, [clampZoom])

  const zoomBy = useCallback((factor: number, atClient?: Point, animate = true) => {
    const { zoom: z0, pan: p0 } = stateRef.current
    const rect = viewportRef.current?.getBoundingClientRect()
    const point = atClient ?? (rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 })
    const { zoom: nz, pan: np } = zoomAtClientPoint(point.x, point.y, z0 * factor, p0, z0)
    if (animate) { setTransitioning(true); window.setTimeout(() => setTransitioning(false), 180) }
    setZoom(nz)
    setPan(clampPan(np, nz))
  }, [zoomAtClientPoint, clampPan])

  const resetView = useCallback(() => {
    setTransitioning(true)
    window.setTimeout(() => setTransitioning(false), 180)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1) {
      gestureRef.current = {
        type: 'pan',
        pointerId: e.pointerId,
        startClient: { x: e.clientX, y: e.clientY },
        startPan: stateRef.current.pan,
        moved: false,
      }
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2
      const rect = viewportRef.current?.getBoundingClientRect()
      const { zoom: z0, pan: p0 } = stateRef.current
      const cx = rect ? rect.left + rect.width / 2 : 0
      const cy = rect ? rect.top + rect.height / 2 : 0
      gestureRef.current = {
        type: 'pinch',
        startDist,
        startZoom: z0,
        contentPoint: { x: (midX - (cx + p0.x)) / z0, y: (midY - (cy + p0.y)) / z0 },
      }
    }

    const handleMove = (ev: PointerEvent) => {
      if (!pointersRef.current.has(ev.pointerId)) return
      pointersRef.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      const gesture = gestureRef.current
      if (!gesture) return

      if (gesture.type === 'pan' && ev.pointerId === gesture.pointerId) {
        const dx = ev.clientX - gesture.startClient.x
        const dy = ev.clientY - gesture.startClient.y
        if (!gesture.moved && Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD) gesture.moved = true
        if (gesture.moved) {
          setPan(clampPan({ x: gesture.startPan.x + dx, y: gesture.startPan.y + dy }, stateRef.current.zoom))
        }
      } else if (gesture.type === 'pinch') {
        const pts = Array.from(pointersRef.current.values())
        if (pts.length < 2) return
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1
        const midX = (pts[0].x + pts[1].x) / 2
        const midY = (pts[0].y + pts[1].y) / 2
        const rect = viewportRef.current?.getBoundingClientRect()
        const cx = rect ? rect.left + rect.width / 2 : 0
        const cy = rect ? rect.top + rect.height / 2 : 0
        const nextZoom = clampZoom(gesture.startZoom * (dist / gesture.startDist))
        setZoom(nextZoom)
        setPan(clampPan({
          x: midX - cx - gesture.contentPoint.x * nextZoom,
          y: midY - cy - gesture.contentPoint.y * nextZoom,
        }, nextZoom))
      }
    }

    const handleUp = (ev: PointerEvent) => {
      pointersRef.current.delete(ev.pointerId)
      const gesture = gestureRef.current
      if (pointersRef.current.size === 0) {
        if (gesture?.type === 'pan' && !gesture.moved) onTap?.(ev.clientX, ev.clientY)
        gestureRef.current = null
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handleUp)
      } else if (pointersRef.current.size === 1 && gesture?.type === 'pinch') {
        const [[remainingId, remainingPos]] = pointersRef.current
        gestureRef.current = {
          type: 'pan',
          pointerId: remainingId,
          startClient: remainingPos,
          startPan: stateRef.current.pan,
          moved: true,
        }
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
  }, [clampZoom, clampPan, onTap])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const { zoom: z0 } = stateRef.current
    if (z0 > 1.05) resetView()
    else zoomBy(2.5 / z0, { x: e.clientX, y: e.clientY })
  }, [zoomBy, resetView])

  /* Molette : Ctrl/Cmd (ou pincement trackpad) zoome sous le curseur, sinon déplace la vue.
     Écouteur natif non-passif requis pour pouvoir bloquer le zoom/scroll de la page. */
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01)
        zoomBy(factor, { x: e.clientX, y: e.clientY }, false)
      } else {
        setPan(clampPan({ x: stateRef.current.pan.x - e.deltaX, y: stateRef.current.pan.y - e.deltaY }, stateRef.current.zoom))
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [zoomBy, clampPan])

  return {
    zoom,
    viewportRef,
    contentStyle: {
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: 'center center',
      transition: transitioning ? 'transform 0.18s ease-out' : 'none',
    } as React.CSSProperties,
    viewportProps: { onPointerDown, onDoubleClick },
    zoomIn: () => zoomBy(1.5),
    zoomOut: () => zoomBy(1 / 1.5),
    resetView,
    isZoomed: zoom > 1.001,
  }
}

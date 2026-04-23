import { useState, useCallback } from 'react'
import type { CalibrationData } from '../types'

export type CalibState = 'idle' | 'picking1' | 'picking2' | 'modal' | 'done'

export function useCalibration() {
  const [calibState, setCalibState] = useState<CalibState>('idle')
  const [point1, setPoint1] = useState<{ x: number; y: number } | null>(null)
  const [point2, setPoint2] = useState<{ x: number; y: number } | null>(null)
  const [svgSizeAtClick, setSvgSizeAtClick] = useState<{ w: number; h: number } | null>(null)
  const [calibration, setCalibration] = useState<CalibrationData | null>(null)

  const startCalibration = useCallback(() => {
    setCalibState('picking1')
    setPoint1(null)
    setPoint2(null)
    setSvgSizeAtClick(null)
  }, [])

  const handleCalibClick = useCallback((xPct: number, yPct: number, svgW: number, svgH: number) => {
    if (calibState === 'picking1') {
      setPoint1({ x: xPct, y: yPct })
      setCalibState('picking2')
    } else if (calibState === 'picking2') {
      setPoint2({ x: xPct, y: yPct })
      setSvgSizeAtClick({ w: svgW, h: svgH })
      setCalibState('modal')
    }
  }, [calibState])

  const confirmDistance = useCallback((distanceMm: number, naturalWidth: number) => {
    if (!point1 || !point2 || !svgSizeAtClick) return
    const dx = (point2.x - point1.x) / 100 * svgSizeAtClick.w
    const dy = (point2.y - point1.y) / 100 * svgSizeAtClick.h
    const displayedDist = Math.sqrt(dx * dx + dy * dy)
    const pixelsPerMm = (displayedDist * (naturalWidth / svgSizeAtClick.w)) / distanceMm
    setCalibration({ point1, point2, distanceMm, pixelsPerMm })
    setCalibState('done')
  }, [point1, point2, svgSizeAtClick])

  const cancelCalib = useCallback(() => {
    setCalibState('idle')
    setPoint1(null)
    setPoint2(null)
  }, [])

  const resetCalib = useCallback(() => {
    setCalibState('idle')
    setPoint1(null)
    setPoint2(null)
    setSvgSizeAtClick(null)
    setCalibration(null)
  }, [])

  return {
    calibState,
    point1,
    point2,
    calibration,
    startCalibration,
    handleCalibClick,
    confirmDistance,
    cancelCalib,
    resetCalib,
  }
}

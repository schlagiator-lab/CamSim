import { useState, useCallback } from 'react'
import type { PlacedCamera } from '../types'

export function usePlacement() {
  const [placedCameras, setPlacedCameras] = useState<PlacedCamera[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const placeCamera = useCallback((cameraId: string, xPct: number, yPct: number) => {
    const id = `placed-${Date.now()}`
    setPlacedCameras(prev => [...prev, { id, cameraId, x: xPct, y: yPct, rotation: 0 }])
    setSelectedId(id)
  }, [])

  const moveCamera = useCallback((id: string, xPct: number, yPct: number) => {
    setPlacedCameras(prev => prev.map(c => c.id === id ? { ...c, x: xPct, y: yPct } : c))
  }, [])

  const rotateCamera = useCallback((id: string, rotation: number) => {
    setPlacedCameras(prev => prev.map(c => c.id === id ? { ...c, rotation } : c))
  }, [])

  const deleteCamera = useCallback((id: string) => {
    setPlacedCameras(prev => prev.filter(c => c.id !== id))
    setSelectedId(prev => prev === id ? null : prev)
  }, [])

  return { placedCameras, selectedId, setSelectedId, placeCamera, moveCamera, rotateCamera, deleteCamera }
}

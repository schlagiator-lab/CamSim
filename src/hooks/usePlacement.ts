import { useState, useCallback } from 'react'
import type { PlacedCamera } from '../types'

export function usePlacement() {
  const [placedCameras, setPlacedCameras] = useState<PlacedCamera[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const placeCamera = useCallback((cameraId: string, xPct: number, yPct: number) => {
    const id = `placed-${Date.now()}`
    setPlacedCameras(prev => [...prev, { id, cameraId, x: xPct, y: yPct, rotation: 0, scale: 1.0, label: '', showLabel: true }])
    setSelectedId(id)
  }, [])

  const moveCamera = useCallback((id: string, xPct: number, yPct: number) => {
    setPlacedCameras(prev => prev.map(c => c.id === id ? { ...c, x: xPct, y: yPct } : c))
  }, [])

  const rotateCamera = useCallback((id: string, rotation: number) => {
    setPlacedCameras(prev => prev.map(c => c.id === id ? { ...c, rotation } : c))
  }, [])

  const resizeCamera = useCallback((id: string, scale: number) => {
    setPlacedCameras(prev =>
      prev.map(c => c.id === id ? { ...c, scale: Math.max(0.2, Math.min(5, scale)) } : c)
    )
  }, [])

  const deleteCamera = useCallback((id: string) => {
    setPlacedCameras(prev => prev.filter(c => c.id !== id))
    setSelectedId(prev => prev === id ? null : prev)
  }, [])

  const duplicateCamera = useCallback((id: string) => {
    const newId = `placed-${Date.now()}`
    setPlacedCameras(prev => {
      const src = prev.find(c => c.id === id)
      if (!src) return prev
      const dup: PlacedCamera = { ...src, id: newId, x: Math.min(100, src.x + 4), y: Math.min(100, src.y + 4) }
      return [...prev, dup]
    })
    setSelectedId(newId)
  }, [])

  const updateLabel = useCallback((id: string, label: string) => {
    setPlacedCameras(prev => prev.map(c => c.id === id ? { ...c, label } : c))
  }, [])

  const toggleLabel = useCallback((id: string) => {
    setPlacedCameras(prev => prev.map(c => c.id === id ? { ...c, showLabel: !c.showLabel } : c))
  }, [])

  const restorePlacedCameras = useCallback((cams: PlacedCamera[]) => {
    setPlacedCameras(cams)
  }, [])

  return { placedCameras, selectedId, setSelectedId, placeCamera, moveCamera, rotateCamera, resizeCamera, deleteCamera, duplicateCamera, updateLabel, toggleLabel, restorePlacedCameras }
}

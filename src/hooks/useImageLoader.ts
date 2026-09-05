import { useState, useCallback } from 'react'

export interface LoadedImage {
  src: string
  naturalWidth: number
  naturalHeight: number
  blob: Blob
}

export function useImageLoader() {
  const [imageData, setImageData] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadImage = useCallback((file: Blob) => {
    setError(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImageData({ src: url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, blob: file })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError("Impossible d'ouvrir cette photo : le format n'est pas pris en charge par ce navigateur (les photos HEIC, par exemple, ne s'ouvrent en général que sur Safari/iOS) ou le fichier est corrompu.")
    }
    img.src = url
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const reset = useCallback(() => {
    setImageData(null)
    setError(null)
  }, [])

  return { imageData, loadImage, error, clearError, reset }
}

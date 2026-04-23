import { useState, useCallback } from 'react'

export interface LoadedImage {
  src: string
  naturalWidth: number
  naturalHeight: number
}

export function useImageLoader() {
  const [imageData, setImageData] = useState<LoadedImage | null>(null)

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImageData({ src: url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })
    }
    img.src = url
  }, [])

  return { imageData, loadImage }
}

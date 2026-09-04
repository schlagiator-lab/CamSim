import { useState, useCallback } from 'react'

export interface LoadedImage {
  src: string
  naturalWidth: number
  naturalHeight: number
  blob: Blob
}

export function useImageLoader() {
  const [imageData, setImageData] = useState<LoadedImage | null>(null)

  const loadImage = useCallback((file: Blob) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImageData({ src: url, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, blob: file })
    }
    img.src = url
  }, [])

  return { imageData, loadImage }
}

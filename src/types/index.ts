export type CameraType = 'dome' | 'bullet' | 'ptz' | 'fisheye'

export interface Camera {
  id: string
  brand: string
  model: string
  type: CameraType
  label: string
  realWidth: number
  realHeight: number
  color: string
}

export interface PlacedCamera {
  id: string
  cameraId: string
  x: number
  y: number
  rotation: number
  scale: number
}

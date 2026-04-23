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
  x: number   // % of image width (0-100)
  y: number   // % of image height (0-100)
  rotation: number
}

export interface CalibrationData {
  point1: { x: number; y: number }  // % coords
  point2: { x: number; y: number }  // % coords
  distanceMm: number
  pixelsPerMm: number   // in natural image pixels
}

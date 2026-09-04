export type CameraType = 'dome' | 'bullet' | 'ptz' | 'fisheye' | 'nvr'

export interface Camera {
  id: string
  brand: string
  model: string
  type: CameraType
  label: string
  realWidth: number
  realHeight: number
  color: string
  images?: {
    front: string
    angleLeft?: string
    angleRight?: string
  }
  /* Comment `images` réagit à la rotation :
     - 'discrete' (défaut) : bascule entre front/angleLeft/angleRight selon l'angle.
     - 'mirror' : une seule photo, retournée horizontalement (miroir) à gauche.
     - 'free' : une seule photo, tourne librement comme une icône vectorielle
       (utile pour une fixation murale, au prix d'un léger défaut de perspective). */
  orientationMode?: 'discrete' | 'mirror' | 'free'
}

export interface PlacedCamera {
  id: string
  cameraId: string
  x: number
  y: number
  rotation: number
  scale: number
  label: string
  showLabel: boolean
}

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
     - 'mirror' : une seule photo, retournée horizontalement (miroir) pour l'autre côté.
     - 'free' : une seule photo, tourne librement comme une icône vectorielle
       (utile pour une fixation murale, au prix d'un léger défaut de perspective). */
  orientationMode?: 'discrete' | 'mirror' | 'free'
  /* Pour orientationMode 'mirror' : sens vers lequel la photo `front` pointe nativement
     (objectif visible à gauche ou à droite de l'image). Défaut 'right' si non précisé. */
  frontFacing?: 'left' | 'right'
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
  labelColor?: string
  /* Inclinaison du mur (degrés, -60..60, 0 = aucune) : cisaillement 2D approximant
     une caméra posée sur un pan de mur qui s'éloigne du point de vue. Optionnel pour
     rester compatible avec les projets sauvegardés avant l'ajout de ce réglage. */
  wallTilt?: number
}

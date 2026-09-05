/* MVP d'inclinaison de mur : un simple cisaillement 2D approximant une caméra fixée
   sur un pan de mur qui s'éloigne du point de vue, sans vraie perspective 3D. Isolé
   dans cette fonction unique (plutôt que dupliqué en degrés/CSS d'un côté et en
   facteur de cisaillement de l'autre) pour qu'une future homographie 4 points puisse
   la remplacer sans changer l'appel dans Workspace.tsx / exportImage.ts : il suffira
   de faire renvoyer à `computeWallTransform` une vraie matrice de perspective plutôt
   que ce simple skewX, les deux renderers resteront inchangés côté appelant. */

export interface WallTransform {
  /* Pour le SVG/CSS : `skewX(${cssSkewDeg}deg)` */
  cssSkewDeg: number
  /* Pour Canvas2D : ctx.transform(1, 0, canvasShearC, 1, 0, 0) */
  canvasShearC: number
}

const MAX_TILT_DEG = 60

export function computeWallTransform(wallTiltDeg: number): WallTransform {
  const clamped = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, wallTiltDeg))
  return {
    cssSkewDeg: clamped,
    canvasShearC: Math.tan((clamped * Math.PI) / 180),
  }
}

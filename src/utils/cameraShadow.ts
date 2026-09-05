/* Calcul partagé des paramètres d'ombre portée, utilisé à la fois par l'aperçu SVG
   (Workspace.tsx) et l'export canvas (exportImage.ts) — seule source de vérité pour
   que les deux rendus restent visuellement cohérents. `ch` est la hauteur rendue de
   la caméra dans l'unité locale de chaque renderer (px CSS non zoomés en aperçu, px
   image naturelle à l'export) : décalage et flou sont exprimés en fraction de `ch`,
   donc l'ombre garde les mêmes proportions dans les deux cas, et reste correcte à
   tout niveau de zoom puisqu'elle est appliquée à l'intérieur du repère qui se fait
   ensuite mettre à l'échelle avec le reste du contenu. */

export interface ShadowParams {
  dx: number
  dy: number
  blur: number
  opacity: number
}

/* Longueur de l'ombre et rayon de flou en fraction de la hauteur rendue de la caméra.
   Un flou relativement faible donne le bord net attendu d'une photo en plein soleil. */
const OFFSET_FACTOR = 0.22
const BLUR_FACTOR = 0.045
const MIN_BLUR_PX = 0.5

export function computeShadowParams(ch: number, angleDeg: number, strength: number): ShadowParams {
  const rad = (angleDeg * Math.PI) / 180
  const k = ch * OFFSET_FACTOR
  return {
    dx: Math.cos(rad) * k,
    dy: Math.sin(rad) * k,
    blur: Math.max(MIN_BLUR_PX, ch * BLUR_FACTOR),
    opacity: Math.max(0, Math.min(1, strength)),
  }
}

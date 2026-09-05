/* Légère altération tonale du visuel de la caméra pour qu'elle "appartienne" à une
   photo de téléphone compressée plutôt que de ressembler à un autocollant net posé
   dessus. Saturation/luminosité sont des multiplicateurs sans unité (identiques en
   aperçu et à l'export, indépendants de la résolution) ; le flou, lui, est exprimé
   en fraction de `ch` comme dans cameraShadow.ts — sinon un flou absolu en pixels
   paraîtrait beaucoup plus fort dans l'aperçu (dimensions ~ largeur CSS de l'écran)
   qu'à l'export (dimensions ~ résolution native de la photo), cassant la cohérence
   aperçu/export. */

export interface IntegrationSettings {
  saturate: number
  brightness: number
  blurFactor: number
}

export const DEFAULT_INTEGRATION: IntegrationSettings = {
  saturate: 0.92,
  brightness: 1.03,
  blurFactor: 0.0025, // ≈ 0.3px pour une caméra d'une hauteur rendue de ~120px
}

export function integrationFilterCss(ch: number, settings: IntegrationSettings = DEFAULT_INTEGRATION): string {
  const blur = Math.max(0.1, ch * settings.blurFactor)
  return `saturate(${settings.saturate}) brightness(${settings.brightness}) blur(${blur}px)`
}

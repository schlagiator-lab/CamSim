export interface SunSettings {
  angleDeg: number
  strength: number
}

/* Réglage propre à chaque projet (chaque photo a sa propre direction/puissance de
   soleil réelle) : sauvegardé avec le reste du projet dans projectStore.ts, pas en
   localStorage. 45° = bas-droite en repère écran (y vers le bas), cohérent avec une
   photo prise en plein soleil ; intensité modérée avec un bord net (peu de flou,
   voir cameraShadow.ts). */
export const DEFAULT_SUN: SunSettings = { angleDeg: 45, strength: 0.6 }

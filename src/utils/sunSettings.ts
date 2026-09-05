const KEY = 'camsim-sun-settings'

export interface SunSettings {
  angleDeg: number
  strength: number
}

/* 45° = bas-droite en repère écran (y vers le bas), cohérent avec une photo prise
   en plein soleil ; intensité modérée avec un bord net (peu de flou, voir cameraShadow.ts). */
export const DEFAULT_SUN: SunSettings = { angleDeg: 45, strength: 0.6 }

export function getSunSettings(): SunSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SUN
    const parsed = JSON.parse(raw)
    return {
      angleDeg: typeof parsed.angleDeg === 'number' ? parsed.angleDeg : DEFAULT_SUN.angleDeg,
      strength: typeof parsed.strength === 'number' ? parsed.strength : DEFAULT_SUN.strength,
    }
  } catch {
    return DEFAULT_SUN
  }
}

export function setSunSettings(settings: SunSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* stockage indisponible */
  }
}

import type { PlacedCamera } from '../types'
import { makeThumbnail } from './thumbnail'
import { DEFAULT_SUN } from './sunSettings'
import type { SunSettings } from './sunSettings'

const DB_NAME = 'camsim'
const STORE_NAME = 'project'
const DB_VERSION = 1
const LEGACY_KEY = 'current'
const ACTIVE_ID_KEY = 'camsim-active-project'

export interface StoredProject {
  id: string
  name: string
  imageBlob: Blob
  thumbBlob?: Blob
  placedCameras: PlacedCamera[]
  sunSettings: SunSettings
  createdAt: number
  savedAt: number
}

/* Filet de sécurité pour un enregistrement plus ancien qui n'aurait pas encore de
   réglage soleil (avant qu'il ne devienne propre à chaque projet). */
function normalizeProject(raw: StoredProject): StoredProject {
  return raw.sunSettings ? raw : { ...raw, sunSettings: DEFAULT_SUN }
}

interface LegacyStoredProject {
  imageBlob: Blob
  placedCameras: PlacedCamera[]
  savedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE_NAME) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/* Le stockage peut échouer (navigation privée, quota dépassé…) :
   les opérations sont alors ignorées silencieusement, sans bloquer l'utilisateur. */

export async function listProjects(): Promise<StoredProject[]> {
  try {
    const db = await openDB()
    const result = await new Promise<StoredProject[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve((req.result ?? []).filter((p): p is StoredProject => !!p && typeof p.id === 'string'))
      req.onerror = () => reject(req.error)
    })
    db.close()
    return result.map(normalizeProject).sort((a, b) => b.savedAt - a.savedAt)
  } catch {
    return []
  }
}

export async function getProject(id: string): Promise<StoredProject | null> {
  try {
    const db = await openDB()
    const result = await new Promise<StoredProject | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(id)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return result ? normalizeProject(result) : null
  } catch {
    return null
  }
}

export async function saveProject(project: StoredProject): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(project, project.id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible */
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible */
  }
}

export async function renameProject(id: string, name: string): Promise<void> {
  const project = await getProject(id)
  if (!project) return
  await saveProject({ ...project, name })
}

export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY)
  } catch {
    return null
  }
}

export function setActiveProjectId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_ID_KEY, id)
    else localStorage.removeItem(ACTIVE_ID_KEY)
  } catch {
    /* stockage indisponible */
  }
}

/* Convertit l'ancien plan unique (clé fixe 'current', avant l'introduction du
   multi-projet) en un projet nommé normal. No-op si un projet actif est déjà
   défini, ou si aucune ancienne entrée n'existe. */
export async function migrateLegacyProject(): Promise<void> {
  if (getActiveProjectId()) return
  try {
    const db = await openDB()
    const legacy = await new Promise<LegacyStoredProject | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(LEGACY_KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
    if (!legacy) { db.close(); return }

    const savedAt = legacy.savedAt ?? Date.now()
    const id = `proj-${savedAt}`
    let thumbBlob: Blob | undefined
    try { thumbBlob = await makeThumbnail(legacy.imageBlob) } catch { /* pas grave, pas de vignette */ }

    const migrated: StoredProject = {
      id,
      name: `Projet du ${new Date(savedAt).toLocaleDateString('fr-FR')}`,
      imageBlob: legacy.imageBlob,
      thumbBlob,
      placedCameras: legacy.placedCameras ?? [],
      sunSettings: DEFAULT_SUN,
      createdAt: savedAt,
      savedAt,
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(migrated, id)
      tx.objectStore(STORE_NAME).delete(LEGACY_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
    setActiveProjectId(id)
  } catch {
    /* stockage indisponible : rien à migrer */
  }
}

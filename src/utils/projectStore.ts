import type { PlacedCamera } from '../types'
import { makeThumbnail } from './thumbnail'
import { DEFAULT_SUN } from './sunSettings'
import type { SunSettings } from './sunSettings'

const DB_NAME = 'camsim'
const STORE_NAME = 'project'
const CLIENT_STORE_NAME = 'client'
const DB_VERSION = 2
const LEGACY_KEY = 'current'
const ACTIVE_ID_KEY = 'camsim-active-project'

export interface StoredProject {
  id: string
  name: string
  /* Dossier client auquel appartient ce projet. Absent (ou pointant vers un
     dossier supprimé) = projet classé dans « Sans dossier ». */
  clientId?: string
  imageBlob: Blob
  thumbBlob?: Blob
  placedCameras: PlacedCamera[]
  sunSettings: SunSettings
  createdAt: number
  savedAt: number
}

export interface StoredClient {
  id: string
  name: string
  createdAt: number
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
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
      if (!db.objectStoreNames.contains(CLIENT_STORE_NAME)) db.createObjectStore(CLIENT_STORE_NAME)
    }
    req.onsuccess = () => {
      const db = req.result
      /* Si un futur changement de schéma est demandé ailleurs (autre onglet)
         pendant que cette connexion est ouverte, on la referme spontanément
         plutôt que de bloquer indéfiniment cette autre ouverture. */
      db.onversionchange = () => db.close()
      resolve(db)
    }
    req.onerror = () => reject(req.error)
    req.onblocked = () => {
      /* Une connexion plus ancienne (autre onglet resté ouvert depuis avant
         une mise à jour du schéma) empêche la montée de version : on
         n'attend pas indéfiniment, on remonte une erreur exploitable par
         l'appelant plutôt que de laisser la promesse ne jamais se résoudre. */
      reject(new Error('IndexedDB bloqué par une autre connexion ouverte (fermez les autres onglets/fenêtres de l\'application et réessayez).'))
    }
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

export async function listClients(): Promise<StoredClient[]> {
  try {
    const db = await openDB()
    const result = await new Promise<StoredClient[]>((resolve, reject) => {
      const tx = db.transaction(CLIENT_STORE_NAME, 'readonly')
      const req = tx.objectStore(CLIENT_STORE_NAME).getAll()
      req.onsuccess = () => resolve((req.result ?? []).filter((c): c is StoredClient => !!c && typeof c.id === 'string'))
      req.onerror = () => reject(req.error)
    })
    db.close()
    return result.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  } catch {
    return []
  }
}

export async function createClient(name: string): Promise<StoredClient> {
  const client: StoredClient = { id: `client-${Date.now()}`, name, createdAt: Date.now() }
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CLIENT_STORE_NAME, 'readwrite')
      tx.objectStore(CLIENT_STORE_NAME).put(client, client.id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible */
  }
  return client
}

export async function renameClient(id: string, name: string): Promise<void> {
  try {
    const db = await openDB()
    const existing = await new Promise<StoredClient | null>((resolve, reject) => {
      const tx = db.transaction(CLIENT_STORE_NAME, 'readonly')
      const req = tx.objectStore(CLIENT_STORE_NAME).get(id)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
    if (!existing) { db.close(); return }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CLIENT_STORE_NAME, 'readwrite')
      tx.objectStore(CLIENT_STORE_NAME).put({ ...existing, name }, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible */
  }
}

/* Supprime uniquement le dossier : les projets qu'il contenait restent intacts
   et retombent automatiquement dans « Sans dossier » (leur clientId ne
   correspond plus à aucun dossier existant). */
export async function deleteClient(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CLIENT_STORE_NAME, 'readwrite')
      tx.objectStore(CLIENT_STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible */
  }
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

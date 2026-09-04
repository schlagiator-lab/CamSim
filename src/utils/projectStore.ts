import type { PlacedCamera } from '../types'

const DB_NAME = 'camsim'
const STORE_NAME = 'project'
const DB_VERSION = 1
const KEY = 'current'

export interface StoredProject {
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
   l'autosauvegarde est alors ignorée silencieusement, sans bloquer l'utilisateur. */

export async function saveProject(data: StoredProject): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(data, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible */
  }
}

export async function loadProject(): Promise<StoredProject | null> {
  try {
    const db = await openDB()
    const result = await new Promise<StoredProject | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

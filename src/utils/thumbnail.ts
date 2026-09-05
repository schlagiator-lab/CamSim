interface Drawable {
  width: number
  height: number
  source: CanvasImageSource
  cleanup: () => void
}

/* Décode la source à dessiner sur le canvas. `createImageBitmap` est tenté en premier :
   il évite un bug connu de Safari/WebKit où dessiner un <img> source HEIC sur un canvas
   peut échouer (canvas « taintée ») alors que la même image s'affiche très bien dans une
   balise <img> classique — exactement le cas où la photo se charge et s'affiche dans
   l'espace de travail, mais où sa vignette ne se génère jamais. Repli sur <img> pour les
   navigateurs qui ne supportent pas createImageBitmap. */
async function loadDrawable(source: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(source)
      return { width: bitmap.width, height: bitmap.height, source: bitmap, cleanup: () => bitmap.close() }
    } catch {
      /* repli sur <img> ci-dessous */
    }
  }

  const url = URL.createObjectURL(source)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode failed'))
      img.src = url
    })
    return { width: img.naturalWidth, height: img.naturalHeight, source: img, cleanup: () => URL.revokeObjectURL(url) }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

/* Vignette basse résolution utilisée pour l'affichage rapide de la liste des projets
   (évite de décoder la photo pleine résolution rien que pour afficher une carte). */
export async function makeThumbnail(source: Blob, maxDim = 240): Promise<Blob> {
  const drawable = await loadDrawable(source)
  try {
    const scale = Math.min(1, maxDim / Math.max(drawable.width, drawable.height))
    const w = Math.max(1, Math.round(drawable.width * scale))
    const h = Math.max(1, Math.round(drawable.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(drawable.source, 0, 0, w, h)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.72)
    })
  } finally {
    drawable.cleanup()
  }
}

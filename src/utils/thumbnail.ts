/* Vignette basse résolution utilisée pour l'affichage rapide de la liste des projets
   (évite de décoder la photo pleine résolution rien que pour afficher une carte). */
export async function makeThumbnail(source: Blob, maxDim = 240): Promise<Blob> {
  const url = URL.createObjectURL(source)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode failed'))
      img.src = url
    })
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.72)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

import type { PlacedCamera } from '../types'
import type { LoadedImage } from '../hooks/useImageLoader'
import { cameras } from '../data/cameras'

const BASE_SCALE = 0.08

function drawDome(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = Math.min(w, h) / 2
  const cx = w / 2, cy = h / 2

  const housingGrad = ctx.createRadialGradient(cx - r * 0.13, cy - r * 0.18, r * 0.05, cx, cy, r)
  housingGrad.addColorStop(0, '#e2e2e2')
  housingGrad.addColorStop(0.42, '#a8a8a8')
  housingGrad.addColorStop(1, '#363636')
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = housingGrad; ctx.fill()

  ctx.strokeStyle = '#787878'; ctx.lineWidth = r * 0.014; ctx.globalAlpha = 0.5
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = 1

  const bezelGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.77)
  bezelGrad.addColorStop(0, '#484848')
  bezelGrad.addColorStop(1, '#141414')
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.77, 0, Math.PI * 2)
  ctx.fillStyle = bezelGrad; ctx.fill()

  const lensGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.23, r * 0.02, cx, cy, r * 0.63)
  lensGrad.addColorStop(0, '#5e94cc')
  lensGrad.addColorStop(0.28, '#1f4585')
  lensGrad.addColorStop(0.66, '#0b1e3e')
  lensGrad.addColorStop(1, '#040b1a')
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.63, 0, Math.PI * 2)
  ctx.fillStyle = lensGrad; ctx.fill()

  ctx.strokeStyle = 'rgba(88,138,212,0.38)'; ctx.lineWidth = r * 0.025
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 2); ctx.stroke()
  ctx.strokeStyle = 'rgba(68,110,182,0.28)'; ctx.lineWidth = r * 0.018
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.27, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = '#020810'; ctx.fill()

  ctx.save()
  const specGrad = ctx.createRadialGradient(cx - r * 0.16, cy - r * 0.18, 0, cx - r * 0.16, cy - r * 0.18, r * 0.44)
  specGrad.addColorStop(0, 'rgba(255,255,255,0.55)')
  specGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = specGrad
  ctx.beginPath(); ctx.ellipse(cx - r * 0.16, cy - r * 0.18, r * 0.26, r * 0.17, -0.31, 0, Math.PI * 2)
  ctx.fill(); ctx.restore()
}

function drawBullet(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bodyGrad = ctx.createLinearGradient(0, 0, 0, h)
  bodyGrad.addColorStop(0, '#dadada')
  bodyGrad.addColorStop(0.12, '#bababa')
  bodyGrad.addColorStop(0.5, '#787878')
  bodyGrad.addColorStop(0.88, '#565656')
  bodyGrad.addColorStop(1, '#363636')
  const rx = h * 0.18
  ctx.beginPath(); ctx.roundRect(0, h * 0.24, w * 0.72, h * 0.52, [rx])
  ctx.fillStyle = bodyGrad; ctx.fill()

  const lensX = w * 0.87, lensY = h * 0.5
  const lensR = h * 0.38
  const bezelGrad = ctx.createLinearGradient(lensX, lensY - lensR, lensX, lensY + lensR)
  bezelGrad.addColorStop(0, '#808080')
  bezelGrad.addColorStop(0.5, '#404040')
  bezelGrad.addColorStop(1, '#181818')
  ctx.beginPath(); ctx.arc(lensX, lensY, lensR, 0, Math.PI * 2)
  ctx.fillStyle = bezelGrad; ctx.fill()
  ctx.beginPath(); ctx.arc(lensX, lensY, lensR * 0.82, 0, Math.PI * 2)
  ctx.fillStyle = '#1c1c1c'; ctx.fill()

  const lensGrad = ctx.createRadialGradient(lensX - lensR * 0.18, lensY - lensR * 0.22, lensR * 0.02, lensX, lensY, lensR * 0.65)
  lensGrad.addColorStop(0, '#6ea2d6')
  lensGrad.addColorStop(0.3, '#264a84')
  lensGrad.addColorStop(0.66, '#0d1e42')
  lensGrad.addColorStop(1, '#040a1e')
  ctx.beginPath(); ctx.arc(lensX, lensY, lensR * 0.65, 0, Math.PI * 2)
  ctx.fillStyle = lensGrad; ctx.fill()
  ctx.beginPath(); ctx.arc(lensX, lensY, lensR * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = '#020810'; ctx.fill()

  const irAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  irAngles.forEach(a => {
    const rad = a * Math.PI / 180
    ctx.beginPath(); ctx.arc(lensX + lensR * 1.0 * Math.cos(rad), lensY + lensR * 1.0 * Math.sin(rad), h * 0.04, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(204,85,0,0.82)'; ctx.fill()
  })
}

function drawPtz(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const panGrad = ctx.createLinearGradient(0, 0, 0, h * 0.3)
  panGrad.addColorStop(0, '#d8d8d8')
  panGrad.addColorStop(1, '#606060')
  ctx.beginPath(); ctx.roundRect(cx - w * 0.32, 0, w * 0.64, h * 0.3, [h * 0.08])
  ctx.fillStyle = panGrad; ctx.fill()

  const domeR = Math.min(w * 0.3, h * 0.3)
  const domeCy = h * 0.62
  const domeGrad = ctx.createRadialGradient(cx - domeR * 0.12, domeCy - domeR * 0.18, domeR * 0.05, cx, domeCy, domeR)
  domeGrad.addColorStop(0, '#e0e0e0')
  domeGrad.addColorStop(0.45, '#a0a0a0')
  domeGrad.addColorStop(1, '#3a3a3a')
  ctx.beginPath(); ctx.arc(cx, domeCy, domeR, 0, Math.PI * 2)
  ctx.fillStyle = domeGrad; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, domeCy, domeR * 0.8, 0, Math.PI * 2)
  ctx.fillStyle = '#2a2a2a'; ctx.fill()

  const lensGrad = ctx.createRadialGradient(cx - domeR * 0.21, domeCy - domeR * 0.25, domeR * 0.02, cx, domeCy, domeR * 0.63)
  lensGrad.addColorStop(0, '#62a0d4'); lensGrad.addColorStop(0.3, '#1f4888')
  lensGrad.addColorStop(0.68, '#0a1e40'); lensGrad.addColorStop(1, '#040b1c')
  ctx.beginPath(); ctx.arc(cx, domeCy, domeR * 0.63, 0, Math.PI * 2)
  ctx.fillStyle = lensGrad; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, domeCy, domeR * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = '#020810'; ctx.fill()
}

export async function exportImage(imageData: LoadedImage, placedCameras: PlacedCamera[]) {
  const { src, naturalWidth, naturalHeight } = imageData
  const canvas = document.createElement('canvas')
  canvas.width = naturalWidth
  canvas.height = naturalHeight
  const ctx = canvas.getContext('2d')!

  const img = new Image()
  await new Promise<void>(res => { img.onload = () => res(); img.src = src })
  ctx.drawImage(img, 0, 0)

  for (const placed of placedCameras) {
    const cam = cameras.find(c => c.id === placed.cameraId)
    if (!cam) continue
    const px = placed.x / 100 * naturalWidth
    const py = placed.y / 100 * naturalHeight
    const cw = naturalWidth * BASE_SCALE * placed.scale
    const ch = cw * (cam.realHeight / cam.realWidth)

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate((placed.rotation * Math.PI) / 180)
    ctx.translate(-cw / 2, -ch / 2)

    if (cam.type === 'dome' || cam.type === 'fisheye') drawDome(ctx, cw, ch)
    else if (cam.type === 'bullet') drawBullet(ctx, cw, ch)
    else if (cam.type === 'ptz') drawPtz(ctx, cw, ch)

    ctx.restore()

    ctx.save()
    ctx.translate(px, py + ch / 2 + 16)
    ctx.fillStyle = '#00d4ff'
    ctx.font = `${Math.max(12, Math.min(22, cw * 0.10))}px "DM Mono", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`${cam.brand} ${cam.model}`, 0, 0)
    ctx.restore()
  }

  const link = document.createElement('a')
  link.download = 'camsim-export.jpg'
  link.href = canvas.toDataURL('image/jpeg', 0.93)
  link.click()
}

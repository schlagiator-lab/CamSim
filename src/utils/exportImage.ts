import type { PlacedCamera, CalibrationData } from '../types'
import type { LoadedImage } from '../hooks/useImageLoader'
import { cameras } from '../data/cameras'

function drawDome(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const r = Math.min(w, h) / 2
  const cx = w / 2, cy = h / 2
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color; ctx.fill()
  ctx.strokeStyle = '#444'; ctx.lineWidth = r * 0.08; ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2)
  ctx.fillStyle = '#222'; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = '#111'; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#0a2a3a'; ctx.fill()
  ctx.beginPath(); ctx.arc(cx - r * 0.15, cy - r * 0.15, r * 0.08, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill()
}

function drawBullet(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const rx = h * 0.15
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, [rx])
  ctx.fillStyle = color; ctx.fill()
  ctx.strokeStyle = '#444'; ctx.lineWidth = h * 0.04; ctx.stroke()
  ctx.beginPath(); ctx.roundRect(w * 0.75, h * 0.05, w * 0.2, h * 0.9, [rx * 0.5])
  ctx.fillStyle = '#222'; ctx.fill()
  ctx.beginPath(); ctx.arc(w * 0.88, h * 0.5, h * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = '#111'; ctx.fill()
  ctx.strokeStyle = '#555'; ctx.lineWidth = h * 0.04; ctx.stroke()
  ctx.beginPath(); ctx.arc(w * 0.88, h * 0.5, h * 0.13, 0, Math.PI * 2)
  ctx.fillStyle = '#0a2a3a'; ctx.fill()
  ctx.fillStyle = 'rgba(255,68,0,0.85)';
  [0.25, 0.5, 0.75].forEach(yf => {
    ctx.beginPath(); ctx.arc(w * 0.3, h * yf, h * 0.07, 0, Math.PI * 2); ctx.fill()
  })
}

function drawPtz(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const cx = w / 2
  const sphereR = Math.min(w, h * 0.7) / 2
  const baseY = h * 0.3
  ctx.beginPath(); ctx.roundRect(cx - w * 0.35, 0, w * 0.7, h * 0.35, [h * 0.05])
  ctx.fillStyle = '#666'; ctx.fill()
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, baseY + sphereR, sphereR, 0, Math.PI * 2)
  ctx.fillStyle = color; ctx.fill()
  ctx.strokeStyle = '#444'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, baseY + sphereR * 1.2, sphereR * 0.35, 0, Math.PI * 2)
  ctx.fillStyle = '#111'; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, baseY + sphereR * 1.2, sphereR * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = '#0a2a3a'; ctx.fill()
  ctx.beginPath(); ctx.arc(cx - sphereR * 0.25, baseY + sphereR * 0.5, sphereR * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill()
}

export async function exportImage(
  imageData: LoadedImage,
  placedCameras: PlacedCamera[],
  calibration: CalibrationData,
) {
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
    const cw = cam.realWidth * calibration.pixelsPerMm
    const ch = cam.realHeight * calibration.pixelsPerMm

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate((placed.rotation * Math.PI) / 180)
    ctx.translate(-cw / 2, -ch / 2)
    if (cam.type === 'dome' || cam.type === 'fisheye') drawDome(ctx, cw, ch, cam.color)
    else if (cam.type === 'bullet') drawBullet(ctx, cw, ch, cam.color)
    else if (cam.type === 'ptz') drawPtz(ctx, cw, ch, cam.color)
    ctx.restore()

    ctx.save()
    ctx.translate(px, py + ch / 2 + 18)
    ctx.fillStyle = '#00d4ff'
    ctx.font = `${Math.max(12, Math.min(24, ch * 0.1))}px "DM Mono", monospace`
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

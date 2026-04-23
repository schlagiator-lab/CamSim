import type { CameraType } from '../types'

interface Props {
  type: CameraType
  color: string
  width: number
  height: number
}

export default function CameraShape({ type, color, width, height }: Props) {
  if (type === 'dome' || type === 'fisheye') {
    const r = Math.min(width, height) / 2
    const cx = width / 2, cy = height / 2
    return (
      <svg width={width} height={height} overflow="visible">
        <circle cx={cx} cy={cy} r={r} fill={color} stroke="#444" strokeWidth={r * 0.08} />
        <circle cx={cx} cy={cy} r={r * 0.7} fill="#222" />
        <circle cx={cx} cy={cy} r={r * 0.4} fill="#111" />
        <circle cx={cx} cy={cy} r={r * 0.3} fill="#0a2a3a" />
        <circle cx={cx - r * 0.15} cy={cy - r * 0.15} r={r * 0.08} fill="rgba(255,255,255,0.4)" />
      </svg>
    )
  }

  if (type === 'bullet') {
    const rx = height * 0.15
    return (
      <svg width={width} height={height} overflow="visible">
        <rect x={0} y={0} width={width} height={height} rx={rx} fill={color} stroke="#444" strokeWidth={height * 0.04} />
        <rect x={width * 0.75} y={height * 0.05} width={width * 0.2} height={height * 0.9} rx={rx * 0.5} fill="#222" />
        <circle cx={width * 0.88} cy={height * 0.5} r={height * 0.22} fill="#111" stroke="#555" strokeWidth={height * 0.04} />
        <circle cx={width * 0.88} cy={height * 0.5} r={height * 0.13} fill="#0a2a3a" />
        {[0.25, 0.5, 0.75].map((yf, i) => (
          <circle key={i} cx={width * 0.3} cy={height * yf} r={height * 0.07} fill="rgba(255,68,0,0.85)" />
        ))}
      </svg>
    )
  }

  if (type === 'ptz') {
    const cx = width / 2
    const sphereR = Math.min(width, height * 0.7) / 2
    const baseY = height * 0.3
    return (
      <svg width={width} height={height} overflow="visible">
        <rect x={cx - width * 0.35} y={0} width={width * 0.7} height={height * 0.35} rx={height * 0.05} fill="#666" stroke="#444" strokeWidth={2} />
        <circle cx={cx} cy={baseY + sphereR} r={sphereR} fill={color} stroke="#444" strokeWidth={3} />
        <circle cx={cx} cy={baseY + sphereR * 1.2} r={sphereR * 0.35} fill="#111" />
        <circle cx={cx} cy={baseY + sphereR * 1.2} r={sphereR * 0.22} fill="#0a2a3a" />
        <circle cx={cx - sphereR * 0.25} cy={baseY + sphereR * 0.5} r={sphereR * 0.12} fill="rgba(255,255,255,0.3)" />
      </svg>
    )
  }

  return null
}

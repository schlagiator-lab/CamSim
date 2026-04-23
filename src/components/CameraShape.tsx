import { useId } from 'react'
import type { CameraType } from '../types'

interface Props {
  type: CameraType
  width: number
  height: number
}

export default function CameraShape({ type, width, height }: Props) {
  const id = useId().replace(/:/g, 'x')
  if (type === 'dome') return <DomeSVG id={id} w={width} h={height} />
  if (type === 'bullet') return <BulletSVG id={id} w={width} h={height} />
  if (type === 'ptz') return <PtzSVG id={id} w={width} h={height} />
  if (type === 'fisheye') return <FisheyeSVG id={id} w={width} h={height} />
  return null
}

function DomeSVG({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <radialGradient id={`${id}a`} cx="37%" cy="30%" r="67%">
          <stop offset="0%" stopColor="#e2e2e2"/>
          <stop offset="42%" stopColor="#a8a8a8"/>
          <stop offset="100%" stopColor="#363636"/>
        </radialGradient>
        <radialGradient id={`${id}b`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#484848"/>
          <stop offset="100%" stopColor="#141414"/>
        </radialGradient>
        <radialGradient id={`${id}c`} cx="30%" cy="25%" r="76%">
          <stop offset="0%" stopColor="#5e94cc"/>
          <stop offset="28%" stopColor="#1f4585"/>
          <stop offset="66%" stopColor="#0b1e3e"/>
          <stop offset="100%" stopColor="#040b1a"/>
        </radialGradient>
        <radialGradient id={`${id}d`} cx="33%" cy="28%" r="44%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <filter id={`${id}e`} x="-25%" y="-20%" width="150%" height="155%">
          <feDropShadow dx="1" dy="2.5" stdDeviation="2.5" floodColor="rgba(0,0,0,0.72)"/>
        </filter>
      </defs>
      <ellipse cx="51" cy="95" rx="33" ry="4.5" fill="rgba(0,0,0,0.38)" opacity="0.7"/>
      <circle cx="50" cy="48" r="43" fill={`url(#${id}a)`} filter={`url(#${id}e)`}/>
      <circle cx="50" cy="48" r="43" fill="none" stroke="#787878" strokeWidth="0.6" opacity="0.5"/>
      <circle cx="50" cy="48" r="38" fill="none" stroke="#4e4e4e" strokeWidth="0.4" opacity="0.4"/>
      <circle cx="50" cy="48" r="33" fill={`url(#${id}b)`}/>
      <circle cx="50" cy="48" r="33" fill="none" stroke="#525252" strokeWidth="0.7"/>
      <circle cx="50" cy="48" r="27" fill={`url(#${id}c)`}/>
      <circle cx="50" cy="48" r="19" fill="none" stroke="rgba(88,138,212,0.38)" strokeWidth="1.1"/>
      <circle cx="50" cy="48" r="11.5" fill="none" stroke="rgba(68,110,182,0.28)" strokeWidth="0.8"/>
      <circle cx="50" cy="48" r="5" fill="#020810"/>
      <ellipse cx="34" cy="30" rx="11" ry="7" fill={`url(#${id}d)`} transform="rotate(-18,34,30)"/>
      <ellipse cx="40" cy="37" rx="7" ry="4.5" fill="rgba(255,255,255,0.20)" transform="rotate(-28,40,37)"/>
      {([270, 30, 150] as number[]).map((angle, i) => {
        const rad = angle * Math.PI / 180
        const sx = 50 + 40 * Math.cos(rad), sy = 48 + 40 * Math.sin(rad)
        return (
          <g key={i}>
            <circle cx={sx} cy={sy} r="2.8" fill="#5a5a5a" stroke="#7e7e7e" strokeWidth="0.4"/>
            <line x1={sx - 1.2} y1={sy} x2={sx + 1.2} y2={sy} stroke="#9a9a9a" strokeWidth="0.6"/>
            <line x1={sx} y1={sy - 1.2} x2={sx} y2={sy + 1.2} stroke="#9a9a9a" strokeWidth="0.6"/>
          </g>
        )
      })}
    </svg>
  )
}

function BulletSVG({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dadada"/>
          <stop offset="12%" stopColor="#bababa"/>
          <stop offset="50%" stopColor="#787878"/>
          <stop offset="88%" stopColor="#565656"/>
          <stop offset="100%" stopColor="#363636"/>
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c2c2c2"/>
          <stop offset="100%" stopColor="#686868"/>
        </linearGradient>
        <radialGradient id={`${id}c`} cx="32%" cy="26%" r="73%">
          <stop offset="0%" stopColor="#6ea2d6"/>
          <stop offset="30%" stopColor="#264a84"/>
          <stop offset="66%" stopColor="#0d1e42"/>
          <stop offset="100%" stopColor="#040a1e"/>
        </radialGradient>
        <linearGradient id={`${id}d`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#808080"/>
          <stop offset="50%" stopColor="#404040"/>
          <stop offset="100%" stopColor="#181818"/>
        </linearGradient>
        <filter id={`${id}e`}>
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.65)"/>
        </filter>
      </defs>
      <ellipse cx="150" cy="97" rx="132" ry="5" fill="rgba(0,0,0,0.35)" opacity="0.65"/>
      {/* Sun visor */}
      <rect x="18" y="14" width="198" height="13" rx="3.5" fill={`url(#${id}b)`} opacity="0.9"/>
      {/* Main body */}
      <rect x="15" y="24" width="215" height="52" rx="9" fill={`url(#${id}a)`} filter={`url(#${id}e)`}/>
      <rect x="20" y="24" width="207" height="11" rx="7" fill="rgba(255,255,255,0.13)"/>
      <rect x="48" y="37" width="105" height="26" rx="3" fill="rgba(0,0,0,0.10)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.6"/>
      {[62, 74, 86, 98, 110].map(x => (
        <rect key={x} x={x} y="43" width="1.5" height="14" rx="0.7" fill="rgba(0,0,0,0.32)"/>
      ))}
      {/* Cable exit */}
      <rect x="0" y="38" width="19" height="24" rx="3" fill="#3a3a3a" stroke="#505050" strokeWidth="0.5"/>
      <circle cx="9.5" cy="50" r="5.5" fill="#232323"/>
      <circle cx="9.5" cy="50" r="3.2" fill="#161616"/>
      {/* Mount bracket */}
      <rect x="86" y="74" width="88" height="14" rx="4" fill="#505050" stroke="#666" strokeWidth="0.5"/>
      <rect x="98" y="86" width="64" height="10" rx="3" fill="#404040"/>
      {[108, 130, 152, 174].map(x => (
        <g key={x}>
          <circle cx={x} cy={92} r="2.8" fill="#5e5e5e" stroke="#808080" strokeWidth="0.4"/>
          <line x1={x - 1.2} y1={92} x2={x + 1.2} y2={92} stroke="#9a9a9a" strokeWidth="0.6"/>
          <line x1={x} y1={90.8} x2={x} y2={93.2} stroke="#9a9a9a" strokeWidth="0.6"/>
        </g>
      ))}
      {/* Lens outer ring */}
      <circle cx="262" cy="50" r="34" fill={`url(#${id}d)`} filter={`url(#${id}e)`}/>
      <circle cx="262" cy="50" r="28" fill="#1c1c1c"/>
      <circle cx="262" cy="50" r="22" fill={`url(#${id}c)`}/>
      <circle cx="262" cy="50" r="15" fill="none" stroke="rgba(80,140,220,0.40)" strokeWidth="1.2"/>
      <circle cx="262" cy="50" r="8" fill="none" stroke="rgba(60,110,190,0.30)" strokeWidth="0.8"/>
      <circle cx="262" cy="50" r="3.5" fill="#020810"/>
      <ellipse cx="252" cy="40" rx="8.5" ry="5.5" fill="rgba(255,255,255,0.26)" transform="rotate(-22,252,40)"/>
      {/* IR LED ring */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = angle * Math.PI / 180
        return <circle key={i} cx={262 + 30 * Math.cos(rad)} cy={50 + 30 * Math.sin(rad)} r="2.3" fill="#cc5500" opacity="0.82"/>
      })}
    </svg>
  )
}

function PtzSVG({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <linearGradient id={`${id}a`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d8d8d8"/>
          <stop offset="100%" stopColor="#606060"/>
        </linearGradient>
        <radialGradient id={`${id}b`} cx="38%" cy="32%" r="66%">
          <stop offset="0%" stopColor="#e0e0e0"/>
          <stop offset="45%" stopColor="#a0a0a0"/>
          <stop offset="100%" stopColor="#3a3a3a"/>
        </radialGradient>
        <radialGradient id={`${id}c`} cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#62a0d4"/>
          <stop offset="30%" stopColor="#1f4888"/>
          <stop offset="68%" stopColor="#0a1e40"/>
          <stop offset="100%" stopColor="#040b1c"/>
        </radialGradient>
        <radialGradient id={`${id}d`} cx="34%" cy="28%" r="44%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.52)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <filter id={`${id}e`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="1.5" dy="2.5" stdDeviation="2.5" floodColor="rgba(0,0,0,0.68)"/>
        </filter>
      </defs>
      <ellipse cx="50" cy="118" rx="28" ry="4" fill="rgba(0,0,0,0.35)" opacity="0.7"/>
      {/* Pan housing */}
      <rect x="18" y="3" width="64" height="36" rx="10" fill={`url(#${id}a)`} filter={`url(#${id}e)`}/>
      <rect x="18" y="3" width="64" height="12" rx="8" fill="rgba(255,255,255,0.14)"/>
      <line x1="18" y1="22" x2="82" y2="22" stroke="rgba(0,0,0,0.20)" strokeWidth="1"/>
      {/* Tilt arms */}
      <rect x="12" y="34" width="12" height="44" rx="5" fill="#707070" stroke="#505050" strokeWidth="0.5"/>
      <rect x="76" y="34" width="12" height="44" rx="5" fill="#707070" stroke="#505050" strokeWidth="0.5"/>
      <circle cx="18" cy="44" r="4" fill="#585858" stroke="#888" strokeWidth="0.6"/>
      <circle cx="18" cy="44" r="2" fill="#3a3a3a"/>
      <circle cx="82" cy="44" r="4" fill="#585858" stroke="#888" strokeWidth="0.6"/>
      <circle cx="82" cy="44" r="2" fill="#3a3a3a"/>
      {/* Camera dome */}
      <circle cx="50" cy="66" r="30" fill={`url(#${id}b)`} filter={`url(#${id}e)`}/>
      <circle cx="50" cy="66" r="30" fill="none" stroke="#707070" strokeWidth="0.6" opacity="0.5"/>
      <circle cx="50" cy="66" r="24" fill="#2a2a2a"/>
      <circle cx="50" cy="66" r="19" fill={`url(#${id}c)`}/>
      <circle cx="50" cy="66" r="13" fill="none" stroke="rgba(80,140,215,0.38)" strokeWidth="1"/>
      <circle cx="50" cy="66" r="7.5" fill="none" stroke="rgba(60,110,185,0.28)" strokeWidth="0.7"/>
      <circle cx="50" cy="66" r="3.5" fill="#020810"/>
      <ellipse cx="36" cy="53" rx="9.5" ry="6.5" fill={`url(#${id}d)`} transform="rotate(-18,36,53)"/>
      <ellipse cx="43" cy="59" rx="6" ry="3.8" fill="rgba(255,255,255,0.22)" transform="rotate(-28,43,59)"/>
      {/* Base mount */}
      <rect x="25" y="94" width="50" height="16" rx="5" fill="#585858" stroke="#707070" strokeWidth="0.5"/>
      <rect x="18" y="107" width="64" height="12" rx="4" fill="#484848" stroke="#606060" strokeWidth="0.5"/>
      {[28, 50, 72].map(x => (
        <g key={x}>
          <circle cx={x} cy={113} r="3" fill="#5e5e5e" stroke="#888" strokeWidth="0.4"/>
          <line x1={x - 1.3} y1={113} x2={x + 1.3} y2={113} stroke="#9a9a9a" strokeWidth="0.6"/>
          <line x1={x} y1={111.7} x2={x} y2={114.3} stroke="#9a9a9a" strokeWidth="0.6"/>
        </g>
      ))}
    </svg>
  )
}

function FisheyeSVG({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <radialGradient id={`${id}a`} cx="37%" cy="30%" r="67%">
          <stop offset="0%" stopColor="#e0e0e0"/>
          <stop offset="42%" stopColor="#a4a4a4"/>
          <stop offset="100%" stopColor="#343434"/>
        </radialGradient>
        <radialGradient id={`${id}b`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3e3e3e"/>
          <stop offset="100%" stopColor="#101010"/>
        </radialGradient>
        <radialGradient id={`${id}c`} cx="28%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#88c0e0"/>
          <stop offset="22%" stopColor="#3870b0"/>
          <stop offset="55%" stopColor="#183858"/>
          <stop offset="100%" stopColor="#060e18"/>
        </radialGradient>
        <radialGradient id={`${id}d`} cx="30%" cy="25%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.68)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <filter id={`${id}e`} x="-25%" y="-20%" width="150%" height="155%">
          <feDropShadow dx="1" dy="2.5" stdDeviation="2.5" floodColor="rgba(0,0,0,0.70)"/>
        </filter>
      </defs>
      <ellipse cx="51" cy="95" rx="33" ry="4.5" fill="rgba(0,0,0,0.38)" opacity="0.7"/>
      <circle cx="50" cy="48" r="43" fill={`url(#${id}a)`} filter={`url(#${id}e)`}/>
      <circle cx="50" cy="48" r="43" fill="none" stroke="#787878" strokeWidth="0.6" opacity="0.5"/>
      <circle cx="50" cy="48" r="36" fill={`url(#${id}b)`}/>
      <circle cx="50" cy="48" r="36" fill="none" stroke="#525252" strokeWidth="0.7"/>
      {/* Large convex fisheye lens */}
      <circle cx="50" cy="48" r="33" fill={`url(#${id}c)`}/>
      <circle cx="50" cy="48" r="24" fill="none" stroke="rgba(100,160,230,0.35)" strokeWidth="1.2"/>
      <circle cx="50" cy="48" r="14" fill="none" stroke="rgba(80,130,200,0.28)" strokeWidth="0.9"/>
      <circle cx="50" cy="48" r="6" fill="#030c1a"/>
      {/* Strong convex highlight */}
      <ellipse cx="33" cy="28" rx="14" ry="9" fill={`url(#${id}d)`} transform="rotate(-15,33,28)"/>
      <ellipse cx="38" cy="35" rx="8.5" ry="5.5" fill="rgba(255,255,255,0.28)" transform="rotate(-25,38,35)"/>
      {([270, 30, 150] as number[]).map((angle, i) => {
        const rad = angle * Math.PI / 180
        const sx = 50 + 40 * Math.cos(rad), sy = 48 + 40 * Math.sin(rad)
        return (
          <g key={i}>
            <circle cx={sx} cy={sy} r="2.8" fill="#5a5a5a" stroke="#7e7e7e" strokeWidth="0.4"/>
            <line x1={sx - 1.2} y1={sy} x2={sx + 1.2} y2={sy} stroke="#9a9a9a" strokeWidth="0.6"/>
            <line x1={sx} y1={sy - 1.2} x2={sx} y2={sy + 1.2} stroke="#9a9a9a" strokeWidth="0.6"/>
          </g>
        )
      })}
    </svg>
  )
}

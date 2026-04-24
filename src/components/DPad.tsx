import { useRef, useCallback } from 'react'

const STEP = 0.4
const HOLD_DELAY = 280
const HOLD_INTERVAL = 70

interface Props {
  onNudge: (dx: number, dy: number) => void
}

const BTN_SIZE = 42
const BTN_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: BTN_SIZE,
  height: BTN_SIZE,
  background: 'rgba(13,13,15,0.82)',
  border: '1px solid rgba(0,212,255,0.30)',
  borderRadius: 7,
  color: '#00d4ff',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  touchAction: 'none',
  WebkitTapHighlightColor: 'transparent',
}

export default function DPad({ onNudge }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  const start = useCallback((dx: number, dy: number) => {
    onNudge(dx, dy)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => onNudge(dx, dy), HOLD_INTERVAL)
    }, HOLD_DELAY)
  }, [onNudge])

  const btn = (dx: number, dy: number, label: React.ReactNode, extraStyle: React.CSSProperties) => (
    <button
      style={{ ...BTN_STYLE, ...extraStyle }}
      onPointerDown={e => { e.preventDefault(); start(dx, dy) }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {label}
    </button>
  )

  const size = BTN_SIZE * 3 + 4

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Up */}
      {btn(0, -STEP,
        <svg width={14} height={14} viewBox="0 0 10 10"><path d="M5 1 L9 9 L1 9 Z" fill="#00d4ff"/></svg>,
        { top: 0, left: BTN_SIZE + 2 }
      )}
      {/* Left */}
      {btn(-STEP, 0,
        <svg width={14} height={14} viewBox="0 0 10 10"><path d="M1 5 L9 1 L9 9 Z" fill="#00d4ff"/></svg>,
        { top: BTN_SIZE + 2, left: 0 }
      )}
      {/* Center (inert) */}
      <div style={{
        position: 'absolute',
        top: BTN_SIZE + 2, left: BTN_SIZE + 2,
        width: BTN_SIZE, height: BTN_SIZE,
        background: 'rgba(13,13,15,0.60)',
        border: '1px solid rgba(0,212,255,0.12)',
        borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,212,255,0.25)' }} />
      </div>
      {/* Right */}
      {btn(STEP, 0,
        <svg width={14} height={14} viewBox="0 0 10 10"><path d="M9 5 L1 9 L1 1 Z" fill="#00d4ff"/></svg>,
        { top: BTN_SIZE + 2, left: (BTN_SIZE + 2) * 2 }
      )}
      {/* Down */}
      {btn(0, STEP,
        <svg width={14} height={14} viewBox="0 0 10 10"><path d="M5 9 L1 1 L9 1 Z" fill="#00d4ff"/></svg>,
        { top: (BTN_SIZE + 2) * 2, left: BTN_SIZE + 2 }
      )}
    </div>
  )
}

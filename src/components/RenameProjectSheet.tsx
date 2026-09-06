import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  name: string
  onRename: (name: string) => void
  onClose: () => void
}

export default function RenameProjectSheet({ open, name, onRename, onClose }: Props) {
  const [value, setValue] = useState(name)

  useEffect(() => {
    if (open) setValue(name)
  }, [open, name])

  if (!open) return null

  const commit = () => {
    const trimmed = value.trim()
    if (trimmed) onRename(trimmed)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 200,
        background: '#0a0a10',
        borderTop: '1px solid #2a2a3e',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px' }}>
        <span style={{ fontFamily: 'Orbitron', color: '#444', fontSize: 9, letterSpacing: 2 }}>NOM DU PROJET</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24 }}
        >×</button>
      </div>

      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onClose() }}
          style={{
            flex: 1,
            minWidth: 0,
            background: '#14141c',
            border: '1px solid #2a2a3e',
            borderRadius: 6,
            color: '#ccc',
            fontFamily: 'DM Mono',
            fontSize: 12,
            padding: '9px 10px',
            outline: 'none',
          }}
        />
        <button
          onClick={commit}
          style={{
            flexShrink: 0,
            background: '#bf393a',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontFamily: 'Orbitron',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1,
            padding: '0 16px',
            cursor: 'pointer',
          }}
        >RENOMMER</button>
      </div>
    </div>
  )
}

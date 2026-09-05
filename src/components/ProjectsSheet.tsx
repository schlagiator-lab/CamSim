import { useEffect, useRef, useState } from 'react'
import type { StoredProject } from '../utils/projectStore'

interface Props {
  open: boolean
  projects: StoredProject[]
  activeProjectId: string | null
  onClose: () => void
  onCreateNew: (file: File) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

const CARD_W = 128
const THUMB_H = 76

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function ProjectsSheet({ open, projects, activeProjectId, onClose, onCreateNew, onOpen, onDelete, onRename }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const map: Record<string, string> = {}
    for (const p of projects) {
      if (p.thumbBlob) map[p.id] = URL.createObjectURL(p.thumbBlob)
    }
    setThumbUrls(map)
    return () => { for (const url of Object.values(map)) URL.revokeObjectURL(url) }
  }, [projects])

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      setConfirmDeleteId(null)
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
    }
  }, [open])

  if (!open) return null

  const startEdit = (p: StoredProject) => {
    setEditingId(p.id)
    setEditingValue(p.name)
  }

  const commitEdit = () => {
    if (editingId && editingValue.trim()) onRename(editingId, editingValue.trim())
    setEditingId(null)
  }

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
      setConfirmDeleteId(null)
      onDelete(id)
      return
    }
    setConfirmDeleteId(id)
    confirmTimeoutRef.current = setTimeout(() => setConfirmDeleteId(null), 2500)
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
        <span style={{ fontFamily: 'Orbitron', color: '#444', fontSize: 9, letterSpacing: 2 }}>MES PROJETS</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24 }}
        >×</button>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flexShrink: 0, width: CARD_W,
            background: 'transparent', border: '2px dashed #2a2a3a', borderRadius: 8,
            padding: '8px 6px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            height: THUMB_H + 46,
          }}
        >
          <span style={{ fontSize: 20, color: '#bf393a', fontWeight: 300, lineHeight: 1 }}>+</span>
          <span style={{ fontFamily: 'Orbitron', color: '#bf393a', fontSize: 8, letterSpacing: 1 }}>NOUVEAU</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,.heic"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onCreateNew(f); e.target.value = '' }}
        />

        {projects.map(p => {
          const active = p.id === activeProjectId
          const isEditing = editingId === p.id
          const isConfirming = confirmDeleteId === p.id
          const url = thumbUrls[p.id]
          return (
            <div
              key={p.id}
              onClick={() => { if (!isEditing) onOpen(p.id) }}
              style={{
                flexShrink: 0, width: CARD_W,
                background: '#0f0f14',
                border: `1px solid ${active ? '#bf393a' : '#222232'}`,
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              <div style={{ width: '100%', height: THUMB_H, borderRadius: 4, background: '#14141c', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {url
                  ? <img src={url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'DM Mono', color: '#333', fontSize: 20 }}>▢</span>
                }
              </div>

              {isEditing ? (
                <input
                  autoFocus
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onPointerDown={e => e.stopPropagation()}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                  style={{
                    width: '100%', background: '#14141c', border: '1px solid #bf393a', borderRadius: 4,
                    color: '#ccc', fontFamily: 'DM Mono', fontSize: 9, padding: '3px 5px', outline: 'none',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'DM Mono', color: active ? '#bf393a' : '#ccc', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </span>
                  <button
                    title="Renommer"
                    aria-label="Renommer"
                    onClick={e => { e.stopPropagation(); startEdit(p) }}
                    style={{ ...iconBtn, color: '#555', fontSize: 10 }}
                  >✎</button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'DM Mono', color: '#444', fontSize: 8 }}>{formatDate(p.savedAt)}</span>
                <button
                  title="Supprimer"
                  aria-label="Supprimer"
                  onClick={e => { e.stopPropagation(); handleDeleteClick(p.id) }}
                  style={{ ...iconBtn, color: isConfirming ? '#ff6a6a' : '#663333', fontSize: 8, fontFamily: 'Orbitron', letterSpacing: 0.5 }}
                >{isConfirming ? 'SÛR ?' : '✕'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

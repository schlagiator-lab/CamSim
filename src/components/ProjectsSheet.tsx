import { useEffect, useRef, useState } from 'react'
import type { StoredProject, StoredClient } from '../utils/projectStore'
import { getLastFolderId, setLastFolderId } from '../utils/projectStore'

interface Props {
  open: boolean
  clients: StoredClient[]
  projects: StoredProject[]
  activeProjectId: string | null
  onClose: () => void
  onCreateNew: (file: File, clientId: string | null) => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onCreateClient: (name: string) => Promise<StoredClient>
  onRenameClient: (id: string, name: string) => void
  onDeleteClient: (id: string) => void
}

/* Sentinelle pour regrouper les projets sans dossier client (clientId absent,
   ou pointant vers un dossier supprimé). Ne correspond à aucun StoredClient réel. */
const UNFILED = '__unfiled__'

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

export default function ProjectsSheet({
  open, clients, projects, activeProjectId, onClose, onCreateNew, onOpen, onDelete, onRename,
  onCreateClient, onRenameClient, onDeleteClient,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  /* Permet d'accéder à l'écran des dossiers même sans en avoir encore créé
     (lien « + Dossier client » depuis la vue à plat). */
  const [forceFolderList, setForceFolderList] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingClientValue, setEditingClientValue] = useState('')
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null)
  const confirmClientTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const map: Record<string, string> = {}
    for (const p of projects) {
      if (p.thumbBlob) map[p.id] = URL.createObjectURL(p.thumbBlob)
    }
    setThumbUrls(map)
    return () => { for (const url of Object.values(map)) URL.revokeObjectURL(url) }
  }, [projects])

  useEffect(() => {
    if (open) {
      /* Ce composant reste monté en permanence (il rend juste `null` quand
         fermé) : sans ceci, le dossier n'est relu depuis le stockage qu'au
         tout premier montage, et un retour à la liste des dossiers plus tôt
         dans la session bloquerait `selectedClientId` à `null` pour le reste
         de la session malgré la valeur mémorisée. On la relit donc à chaque
         ouverture du panneau. */
      setSelectedClientId(getLastFolderId())
    } else {
      setEditingId(null)
      setConfirmDeleteId(null)
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
      setForceFolderList(false)
      setCreatingClient(false)
      setEditingClientId(null)
      setConfirmDeleteClientId(null)
      if (confirmClientTimeoutRef.current) clearTimeout(confirmClientTimeoutRef.current)
    }
  }, [open])

  if (!open) return null

  const clientIds = new Set(clients.map(c => c.id))
  const grouped = new Map<string, StoredProject[]>()
  for (const p of projects) {
    const key = p.clientId && clientIds.has(p.clientId) ? p.clientId : UNFILED
    const list = grouped.get(key)
    if (list) list.push(p)
    else grouped.set(key, [p])
  }
  const unfiledProjects = grouped.get(UNFILED) ?? []

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

  const startEditClient = (c: StoredClient) => {
    setEditingClientId(c.id)
    setEditingClientValue(c.name)
  }

  const commitEditClient = () => {
    if (editingClientId && editingClientValue.trim()) onRenameClient(editingClientId, editingClientValue.trim())
    setEditingClientId(null)
  }

  const handleDeleteClientClick = (id: string) => {
    if (confirmDeleteClientId === id) {
      if (confirmClientTimeoutRef.current) clearTimeout(confirmClientTimeoutRef.current)
      setConfirmDeleteClientId(null)
      onDeleteClient(id)
      if (selectedClientId === id) enterFolder(null)
      return
    }
    setConfirmDeleteClientId(id)
    confirmClientTimeoutRef.current = setTimeout(() => setConfirmDeleteClientId(null), 2500)
  }

  const commitCreateClient = async () => {
    const name = newClientName.trim()
    setCreatingClient(false)
    setNewClientName('')
    if (!name) return
    const client = await onCreateClient(name)
    enterFolder(client.id)
  }

  /* Le dossier mémorisé (dernier consulté) peut avoir été supprimé entretemps :
     on l'ignore alors silencieusement plutôt que d'afficher un dossier vide. */
  const validSelectedClientId = selectedClientId === null || selectedClientId === UNFILED || clients.some(c => c.id === selectedClientId)
    ? selectedClientId
    : null

  /* Tant qu'aucun dossier client n'existe, on saute l'écran de sélection et on
     retrouve le comportement historique (liste des projets à plat) : la
     nouveauté ne doit rien changer pour qui n'utilise pas les dossiers. */
  const hasClients = clients.length > 0
  const showFolderList = validSelectedClientId === null && (hasClients || forceFolderList)
  const flatMode = validSelectedClientId === null && !showFolderList
  const activeGroupId = flatMode ? UNFILED : validSelectedClientId

  const selectedClient = activeGroupId && activeGroupId !== UNFILED
    ? clients.find(c => c.id === activeGroupId) ?? null
    : null
  const showingUnfiled = activeGroupId === UNFILED

  const currentProjects = !showFolderList && activeGroupId
    ? grouped.get(activeGroupId) ?? []
    : []

  /* Retenu pour qu'un prochain « MES PROJETS » retombe directement dedans. */
  const enterFolder = (id: string | null) => {
    setSelectedClientId(id)
    setLastFolderId(id)
  }

  const goBack = () => {
    if (validSelectedClientId !== null) setSelectedClientId(null)
    else setForceFolderList(false)
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {(validSelectedClientId !== null || forceFolderList) && (
            <button
              onClick={goBack}
              title="Retour"
              aria-label="Retour aux dossiers"
              style={{ ...iconBtn, color: '#bf393a', fontSize: 14 }}
            >←</button>
          )}
          <span style={{
            fontFamily: 'Orbitron', color: validSelectedClientId !== null ? '#ccc' : '#444', fontSize: 9, letterSpacing: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {validSelectedClientId !== null ? (showingUnfiled ? 'SANS DOSSIER' : (selectedClient?.name.toUpperCase() ?? 'DOSSIER')) : 'MES PROJETS'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {flatMode && (
            <button
              onClick={() => setForceFolderList(true)}
              title="Organiser mes projets par dossier client"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontFamily: 'DM Mono', fontSize: 8, letterSpacing: 0.5, whiteSpace: 'nowrap' }}
            >🗂 + DOSSIER</button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #282834', borderRadius: 4, color: '#555', cursor: 'pointer', fontSize: 14, lineHeight: 1, width: 24, height: 24, flexShrink: 0 }}
          >×</button>
        </div>
      </div>

      {showFolderList ? (
        /* ── Niveau 1 : dossiers clients ── */
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px' }}>
          {creatingClient ? (
            <div
              style={{
                flexShrink: 0, width: CARD_W,
                background: '#0f0f14', border: '1px solid #bf393a', borderRadius: 8,
                padding: '8px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
                height: THUMB_H + 46,
              }}
            >
              <input
                autoFocus
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                onBlur={commitCreateClient}
                onKeyDown={e => { if (e.key === 'Enter') commitCreateClient(); if (e.key === 'Escape') { setCreatingClient(false); setNewClientName('') } }}
                placeholder="Nom du client"
                style={{
                  width: '100%', background: '#14141c', border: '1px solid #2a2a3e', borderRadius: 4,
                  color: '#ccc', fontFamily: 'DM Mono', fontSize: 9, padding: '4px 6px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setCreatingClient(true)}
              style={{
                flexShrink: 0, width: CARD_W,
                background: 'transparent', border: '2px dashed #2a2a3a', borderRadius: 8,
                padding: '8px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                height: THUMB_H + 46,
              }}
            >
              <span style={{ fontSize: 20, color: '#bf393a', fontWeight: 300, lineHeight: 1 }}>+</span>
              <span style={{ fontFamily: 'Orbitron', color: '#bf393a', fontSize: 8, letterSpacing: 1 }}>NOUVEAU DOSSIER</span>
            </button>
          )}

          {clients.map(c => {
            const isEditing = editingClientId === c.id
            const isConfirming = confirmDeleteClientId === c.id
            const count = grouped.get(c.id)?.length ?? 0
            return (
              <div
                key={c.id}
                onClick={() => { if (!isEditing) enterFolder(c.id) }}
                style={{
                  flexShrink: 0, width: CARD_W,
                  background: '#0f0f14', border: '1px solid #222232', borderRadius: 8,
                  padding: 6, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}
              >
                <div style={{ width: '100%', height: THUMB_H, borderRadius: 4, background: '#14141c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 26 }}>🗂</span>
                </div>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editingClientValue}
                    onChange={e => setEditingClientValue(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onPointerDown={e => e.stopPropagation()}
                    onBlur={commitEditClient}
                    onKeyDown={e => { if (e.key === 'Enter') commitEditClient(); if (e.key === 'Escape') setEditingClientId(null) }}
                    style={{
                      width: '100%', background: '#14141c', border: '1px solid #bf393a', borderRadius: 4,
                      color: '#ccc', fontFamily: 'DM Mono', fontSize: 9, padding: '3px 5px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'DM Mono', color: '#ccc', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </span>
                    <button
                      title="Renommer"
                      aria-label="Renommer"
                      onClick={e => { e.stopPropagation(); startEditClient(c) }}
                      style={{ ...iconBtn, color: '#555', fontSize: 10 }}
                    >✎</button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'DM Mono', color: '#444', fontSize: 8 }}>{count} projet{count > 1 ? 's' : ''}</span>
                  <button
                    title="Supprimer le dossier"
                    aria-label="Supprimer le dossier"
                    onClick={e => { e.stopPropagation(); handleDeleteClientClick(c.id) }}
                    style={{ ...iconBtn, color: isConfirming ? '#ff6a6a' : '#663333', fontSize: 8, fontFamily: 'Orbitron', letterSpacing: 0.5 }}
                  >{isConfirming ? 'SÛR ?' : '✕'}</button>
                </div>
              </div>
            )
          })}

          {unfiledProjects.length > 0 && (
            <div
              onClick={() => enterFolder(UNFILED)}
              style={{
                flexShrink: 0, width: CARD_W,
                background: '#0f0f14', border: '1px solid #222232', borderRadius: 8,
                padding: 6, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              <div style={{ width: '100%', height: THUMB_H, borderRadius: 4, background: '#14141c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 26, opacity: 0.5 }}>🗂</span>
              </div>
              <span style={{ fontFamily: 'DM Mono', color: '#888', fontSize: 9 }}>Sans dossier</span>
              <span style={{ fontFamily: 'DM Mono', color: '#444', fontSize: 8 }}>{unfiledProjects.length} projet{unfiledProjects.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Niveau 2 : projets du dossier sélectionné ── */
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
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onCreateNew(f, showingUnfiled ? null : activeGroupId)
              e.target.value = ''
            }}
          />

          {currentProjects.map(p => {
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
      )}
    </div>
  )
}

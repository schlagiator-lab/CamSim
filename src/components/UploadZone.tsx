import { useRef, useState } from 'react'

interface Props {
  onImageLoad: (file: File) => void
}

export default function UploadZone({ onImageLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp|heic)/i) && !file.name.match(/\.heic$/i)) return
    onImageLoad(file)
  }

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer select-none"
      style={{
        border: `2px dashed ${dragging ? '#00d4ff' : '#2a2a3a'}`,
        borderRadius: 12,
        background: dragging ? 'rgba(0,212,255,0.04)' : 'transparent',
        transition: 'border-color 0.2s, background 0.2s',
        minHeight: 320,
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <svg width={56} height={56} viewBox="0 0 56 56" fill="none" style={{ marginBottom: 16 }}>
        <rect x={4} y={4} width={48} height={48} rx={10} fill="#191921" stroke="#2a2a3a" strokeWidth={2} />
        <path d="M28 18v14M21 25l7-7 7 7" stroke="#00d4ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 36h20" stroke="#2a2a3a" strokeWidth={2} strokeLinecap="round" />
      </svg>
      <p style={{ fontFamily: 'Orbitron', color: '#00d4ff', fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>
        CHARGER UNE PHOTO
      </p>
      <p style={{ color: '#444', fontSize: 11, fontFamily: 'DM Mono', letterSpacing: 1 }}>
        JPG · PNG · WEBP · HEIC
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.heic"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

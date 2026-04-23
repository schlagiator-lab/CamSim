import { useState } from 'react'

interface Props {
  onConfirm: (distanceMm: number) => void
  onCancel: () => void
}

type Unit = 'mm' | 'cm' | 'm'

export default function CalibrationModal({ onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState<Unit>('cm')

  const toMm = (v: number, u: Unit) => {
    if (u === 'cm') return v * 10
    if (u === 'm') return v * 1000
    return v
  }

  const handleConfirm = () => {
    const num = parseFloat(value.replace(',', '.'))
    if (!num || num <= 0) return
    onConfirm(toMm(num, unit))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0f0f14',
        border: '1px solid #ff6b00',
        borderRadius: 12,
        padding: '28px 32px',
        minWidth: 320,
        boxShadow: '0 0 40px rgba(255,107,0,0.15)',
      }}>
        <p style={{ fontFamily: 'Orbitron', color: '#ff6b00', fontSize: 13, letterSpacing: 2, marginBottom: 6 }}>
          CALIBRATION
        </p>
        <p style={{ fontFamily: 'DM Mono', color: '#888', fontSize: 11, marginBottom: 20 }}>
          Distance réelle entre les 2 points
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
            placeholder="0"
            style={{
              flex: 1,
              background: '#191921',
              border: '1px solid #2a2a3a',
              borderRadius: 6,
              color: '#e0e0e0',
              fontFamily: 'DM Mono',
              fontSize: 18,
              padding: '8px 12px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['mm', 'cm', 'm'] as Unit[]).map(u => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                style={{
                  background: unit === u ? '#ff6b00' : '#191921',
                  border: `1px solid ${unit === u ? '#ff6b00' : '#2a2a3a'}`,
                  borderRadius: 6,
                  color: unit === u ? '#fff' : '#888',
                  fontFamily: 'Orbitron',
                  fontSize: 10,
                  padding: '0 10px',
                  cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #2a2a3a',
              borderRadius: 6,
              color: '#666',
              fontFamily: 'Orbitron',
              fontSize: 10,
              padding: '10px',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            ANNULER
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              background: '#ff6b00',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'Orbitron',
              fontSize: 10,
              padding: '10px',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            CONFIRMER
          </button>
        </div>
      </div>
    </div>
  )
}

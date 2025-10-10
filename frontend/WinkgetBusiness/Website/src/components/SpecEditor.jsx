import React, { useMemo, useState } from 'react'

export default function SpecEditor({ value, onChange }) {
  const initial = useMemo(() => {
    try {
      const obj = value && typeof value === 'string' ? JSON.parse(value) : (value || {})
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj
      return {}
    } catch {
      return {}
    }
  }, [value])

  const [rows, setRows] = useState(() => {
    const entries = Object.entries(initial)
    return entries.length > 0 ? entries.map(([k, v]) => ({ key: k, value: String(v) })) : [{ key: '', value: '' }]
  })

  const update = (newRows) => {
    setRows(newRows)
    const obj = {}
    for (const { key, value } of newRows) {
      if (key && key.trim()) obj[key.trim()] = value
    }
    onChange?.(JSON.stringify(obj))
  }

  return (
    <div className="space-y-2">
      {rows.map((row, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="w-1/2 rounded-md border px-3 py-2"
            placeholder="Key (e.g., material)"
            value={row.key}
            onChange={(e) => {
              const newRows = [...rows]
              newRows[idx] = { ...newRows[idx], key: e.target.value }
              update(newRows)
            }}
          />
          <input
            className="w-1/2 rounded-md border px-3 py-2"
            placeholder="Value (e.g., cotton)"
            value={row.value}
            onChange={(e) => {
              const newRows = [...rows]
              newRows[idx] = { ...newRows[idx], value: e.target.value }
              update(newRows)
            }}
          />
          <button
            type="button"
            className="px-3 py-2 rounded-md border"
            onClick={() => update(rows.filter((_, i) => i !== idx))}
            disabled={rows.length <= 1}
          >Remove</button>
        </div>
      ))}
      <button
        type="button"
        className="px-3 py-2 rounded-md border"
        onClick={() => update([...rows, { key: '', value: '' }])}
      >Add Field</button>
    </div>
  )
}



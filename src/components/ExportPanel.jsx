import { useState } from 'react'
import { T } from '../theme.js'
import { CopyButton } from './CopyButton.jsx'
import { downloadPropertiesJson, getExportJsonString } from '../exportProperties.js'

export function ExportPanel({ properties, onClose }) {
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const liveCount = properties.filter(p => !p.deleted).length
  const deletedCount = properties.filter(p => p.deleted).length
  const exportCount = includeDeleted ? properties.length : liveCount

  const jsonPreview = getExportJsonString(properties, { includeDeleted })

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4 }}>📦 Export All Properties</div>
      <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 18, lineHeight: 1.5 }}>
        Download or copy every property currently in your tracker as one JSON file — useful for backups, sharing with someone else, or pasting into a chat.
      </div>

      {deletedCount > 0 && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: T.textMid }}>Include {deletedCount} recently deleted {deletedCount === 1 ? 'property' : 'properties'}</span>
        </label>
      )}

      <div style={{
        background: T.navy, borderRadius: 12, padding: '16px 18px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: T.slateLight, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>Ready to export</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{exportCount} {exportCount === 1 ? 'property' : 'properties'}</div>
        </div>
        <div style={{ fontSize: 32 }}>📦</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => downloadPropertiesJson(properties, { includeDeleted })}
          style={{
            flex: 1, background: T.blue, color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}
        >⬇️ Download JSON</button>
        <CopyButton text={jsonPreview} label="Copy JSON" />
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        Preview
      </div>
      <div style={{
        background: T.navy, borderRadius: 10, padding: '12px 14px',
        fontFamily: "'SF Mono', Menlo, monospace", fontSize: 10.5, color: '#E2E8F0',
        lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: 200, overflowY: 'auto', marginBottom: 16,
      }}>
        {jsonPreview.length > 2000 ? jsonPreview.slice(0, 2000) + '\n\n... (truncated preview — full content is in the download/copy)' : jsonPreview}
      </div>

      <button onClick={onClose} style={{
        width: '100%', background: T.borderLight, color: T.textMid,
        border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
      }}>Close</button>
    </div>
  )
}

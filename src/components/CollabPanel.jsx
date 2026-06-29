import { useState, useEffect, useRef } from 'react'
import {
  fetchComments, addComment, deleteComment,
  fetchVotes, upsertVote, removeVote,
  subscribeToComments, subscribeToVotes,
} from '../supabase.js'

const VOTE_OPTIONS = ['❤️', '👍', '👎', '🤔']
const VOTE_LABELS = { '❤️': 'Love it', '👍': 'Like it', '👎': "Pass", '🤔': 'Not sure' }

export function CollabPanel({ property, user }) {
  const [comments, setComments] = useState([])
  const [votes, setVotes] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!property) return
    fetchComments(property.id).then(setComments)
    fetchVotes(property.id).then(setVotes)

    const unsubComments = subscribeToComments(property.id, () => {
      fetchComments(property.id).then(setComments)
    })
    const unsubVotes = subscribeToVotes(property.id, () => {
      fetchVotes(property.id).then(setVotes)
    })
    return () => { unsubComments(); unsubVotes() }
  }, [property?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleSend() {
    if (!text.trim() || !user) return
    setSending(true)
    const comment = await addComment(property.id, user, text.trim())
    if (comment) setComments(c => [...c, comment])
    setText('')
    setSending(false)
  }

  async function handleVote(emoji) {
    if (!user) return
    const existing = votes.find(v => v.author === user)
    if (existing?.vote === emoji) {
      await removeVote(property.id, user)
      setVotes(v => v.filter(x => !(x.author === user)))
    } else {
      await upsertVote(property.id, user, emoji)
      setVotes(v => {
        const filtered = v.filter(x => x.author !== user)
        return [...filtered, { property_id: property.id, author: user, vote: emoji }]
      })
    }
  }

  const myVote = votes.find(v => v.author === user)?.vote
  const otherVotes = votes.filter(v => v.author !== user)

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div>
      {/* Votes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 10 }}>
          👥 Reactions
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VOTE_OPTIONS.map(emoji => {
            const votesForThis = votes.filter(v => v.vote === emoji)
            const isMine = myVote === emoji
            return (
              <button key={emoji} onClick={() => handleVote(emoji)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: isMine ? '#e0e7ff' : '#f8fafc',
                border: isMine ? '2px solid #3b5bdb' : '1.5px solid #e2e8f0',
                borderRadius: 99, padding: '8px 14px',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
                {votesForThis.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: isMine ? '#3b5bdb' : '#64748b' }}>
                    {votesForThis.map(v => v.author).join(', ')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {/* Show other people's votes summary */}
        {otherVotes.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>
            {otherVotes.map(v => (
              <span key={v.author} style={{ marginRight: 12 }}>
                <strong>{v.author}</strong>: {v.vote} {VOTE_LABELS[v.vote]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 10 }}>
        💬 Notes & Comments
      </div>

      {comments.length === 0 && (
        <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 12, padding: '12px 0' }}>
          No comments yet — add your thoughts below
        </div>
      )}

      <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 12 }}>
        {comments.map(c => {
          const isMe = c.author === user
          return (
            <div key={c.id} style={{
              display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
              gap: 8, marginBottom: 10, alignItems: 'flex-end',
            }}>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                background: isMe ? '#3b5bdb' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isMe ? '#fff' : '#475569',
              }}>
                {c.author[0]?.toUpperCase()}
              </div>
              {/* Bubble */}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: isMe ? '#3b5bdb' : '#f1f5f9',
                  color: isMe ? '#fff' : '#1e293b',
                  borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '8px 12px', fontSize: 14, lineHeight: 1.5,
                }}>
                  {c.text}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {c.author} · {formatTime(c.created_at)}
                  {isMe && (
                    <button onClick={() => {
                      deleteComment(c.id)
                      setComments(x => x.filter(x => x.id !== c.id))
                    }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 10, marginLeft: 6 }}>
                      delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={user ? `Add a note as ${user}...` : 'Set your name first'}
          disabled={!user || sending}
          style={{
            flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 10,
            padding: '10px 13px', fontSize: 14, color: '#0f172a',
            background: '#f8fafc', outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !user || sending}
          style={{
            background: text.trim() && user ? '#3b5bdb' : '#e2e8f0',
            color: text.trim() && user ? '#fff' : '#94a3b8',
            border: 'none', borderRadius: 10,
            padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >Send</button>
      </div>
    </div>
  )
}

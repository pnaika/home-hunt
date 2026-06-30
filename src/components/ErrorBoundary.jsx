import { Component } from 'react'
import { T } from '../theme.js'

// Last-resort safety net. If anything still slips past safeDisplay() and the
// JSON normalizer and React throws while rendering, this catches it and shows
// a recoverable error screen instead of a permanently blank page.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: T.offWhite,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, gap: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>Something went wrong displaying this</div>
          <div style={{ fontSize: 13, color: T.textSoft, maxWidth: 320, lineHeight: 1.6 }}>
            A piece of property data may be in an unexpected format. Try editing the property to fix it, or go back.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.location.href = '/'} style={{
              background: T.blue, color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer',
            }}>← Back to list</button>
            <button onClick={() => this.setState({ hasError: false, error: null })} style={{
              background: T.borderLight, color: T.textMid, border: 'none',
              borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer',
            }}>Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

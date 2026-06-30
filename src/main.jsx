import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { fonts } from './theme.js'

// Disable browser scroll restoration — we handle it manually per route
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Inject global styles
const style = document.createElement('style')
style.textContent = fonts
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

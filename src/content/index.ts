import React from 'react'
import ReactDOM from 'react-dom/client'
import LoggerPanel from '../view/LoggerPanel'

console.log('Content script loaded!')


const script = document.createElement('script')
script.src = chrome.runtime.getURL('content/inject.js')
script.onload = () => {
  script.remove()
  console.log('inject.js loaded')
}
script.onerror = (e) => console.error('Failed to load inject.js:', e)
;(document.head || document.documentElement).appendChild(script)


if (!document.getElementById('chrome-logger-root')) {
  const container = document.createElement('div')
  container.id = 'chrome-logger-root'

  container.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: visible !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
  `


  function mount() {
    if (document.body) {
      document.body.appendChild(container)

      const root = ReactDOM.createRoot(container)
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(LoggerPanel, null)
        )
      )
    } else {
  
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true })
      } else {

        requestAnimationFrame(mount)
      }
    }
  }

  mount()
}